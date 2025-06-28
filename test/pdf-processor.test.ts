import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PDFProcessor } from "../src/pdf-processor";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";

// Test PDF URL - Adobe PDF 32000 specification
const TEST_PDF_URL = "https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf";

// Create a simple test PDF for local file testing
const createTestPDF = async (path: string) => {
  // This is a minimal valid PDF with "Hello World" text
  const pdfContent = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
72 720 Td
(Hello World) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000262 00000 n
0000000341 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
439
%%EOF`, 'utf-8');
  
  await writeFile(path, pdfContent);
};

describe("PDFProcessor", () => {
  let processor: PDFProcessor;
  let testPdfPath: string;
  let loadedPdfId: string;
  let urlPdfId: string;

  beforeAll(async () => {
    processor = new PDFProcessor();
    testPdfPath = join(process.cwd(), "test-sample.pdf");
    await createTestPDF(testPdfPath);
  });

  afterAll(async () => {
    try {
      await unlink(testPdfPath);
    } catch (error) {
      // Ignore error if file doesn't exist
    }
  });

  describe("loadPDF", () => {
    it("should load a local PDF file", async () => {
      const result = await processor.loadPDF(testPdfPath);
      loadedPdfId = result.id;
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.pageCount).toBe(1);
    });

    it("should load a PDF from URL", async () => {
      const result = await processor.loadPDF(TEST_PDF_URL);
      urlPdfId = result.id;
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.pageCount).toBeGreaterThan(0);
      console.log(`Loaded PDF from URL with ${result.pageCount} pages`);
    }, 30000); // 30 second timeout for URL fetch

    it("should throw error for invalid file path", async () => {
      expect(processor.loadPDF("/nonexistent/file.pdf")).rejects.toThrow();
    });

    it("should throw error for invalid URL", async () => {
      expect(processor.loadPDF("https://example.com/nonexistent.pdf")).rejects.toThrow();
    });
  });

  describe("extractPage", () => {
    it("should extract a specific page from local PDF", async () => {
      const content = await processor.extractPage(loadedPdfId, 1);
      
      expect(content).toBeDefined();
      expect(content).toContain("Hello World");
    });

    it("should extract a specific page from URL PDF", async () => {
      const content = await processor.extractPage(urlPdfId, 1);
      
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
    });

    it("should throw error for invalid page number", async () => {
      expect(processor.extractPage(loadedPdfId, 0)).rejects.toThrow("Invalid page number");
      expect(processor.extractPage(loadedPdfId, 999)).rejects.toThrow("Invalid page number");
    });

    it("should throw error for non-existent PDF", async () => {
      expect(processor.extractPage("nonexistent", 1)).rejects.toThrow("PDF not found");
    });
  });

  describe("extractRange", () => {
    it("should extract a range of pages from URL PDF", async () => {
      const content = await processor.extractRange(urlPdfId, 1, 3);
      
      expect(content).toBeDefined();
      expect(content).toContain("--- Page 1 ---");
      expect(content).toContain("--- Page 2 ---");
      expect(content).toContain("--- Page 3 ---");
    });

    it("should throw error for invalid page range", async () => {
      expect(processor.extractRange(urlPdfId, 5, 2)).rejects.toThrow("Invalid page range");
      expect(processor.extractRange(urlPdfId, -1, 5)).rejects.toThrow("Invalid page range");
    });
  });

  describe("searchPDF", () => {
    it("should find text in PDF", async () => {
      const results = await processor.searchPDF(loadedPdfId, "Hello");
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].page).toBe(1);
      expect(results[0].matches.length).toBeGreaterThan(0);
    });

    it("should search case-insensitive by default", async () => {
      const results = await processor.searchPDF(loadedPdfId, "hello");
      
      expect(results.length).toBeGreaterThan(0);
    });

    it("should search case-sensitive when specified", async () => {
      const results = await processor.searchPDF(loadedPdfId, "hello", true);
      
      expect(results.length).toBe(0);
    });

    it("should search in URL-loaded PDF", async () => {
      const results = await processor.searchPDF(urlPdfId, "PDF");
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      console.log(`Found "PDF" in ${results.length} pages`);
    });

    it("should search with regex when enabled", async () => {
      const results = await processor.searchPDF(loadedPdfId, "H.llo", false, true);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matches[0].text).toBe("Hello");
    });

    it("should find multiple words with regex", async () => {
      const results = await processor.searchPDF(loadedPdfId, "Hello|World", false, true);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matches.length).toBe(2);
    });

    it("should search with case-sensitive regex", async () => {
      const results = await processor.searchPDF(loadedPdfId, "h.llo", true, true);
      
      expect(results.length).toBe(0);
    });

    it("should handle invalid regex patterns", async () => {
      expect(processor.searchPDF(loadedPdfId, "[", false, true)).rejects.toThrow("Invalid regular expression");
    });

    it("should search with word boundaries in regex", async () => {
      const results = await processor.searchPDF(loadedPdfId, "\\bWorld\\b", false, true);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matches[0].text).toBe("World");
    });
  });

  describe("extractOutline", () => {
    it("should extract outline from URL PDF", async () => {
      const outline = await processor.extractOutline(urlPdfId);
      
      if (outline) {
        expect(outline).toBeDefined();
        expect(Array.isArray(outline)).toBe(true);
        console.log(`Found ${outline.length} top-level outline items`);
        
        // The PDF specification should have a table of contents
        expect(outline.length).toBeGreaterThan(0);
        
        // Check first outline item has expected properties
        if (outline.length > 0) {
          expect(outline[0]).toHaveProperty('title');
          expect(outline[0]).toHaveProperty('level');
        }
      } else {
        console.log("No outline found in PDF");
      }
    });

    it("should format outline as text", async () => {
      const formattedOutline = await processor.getFormattedOutline(urlPdfId);
      
      expect(formattedOutline).toBeDefined();
      expect(typeof formattedOutline).toBe('string');
      
      if (!formattedOutline.includes("No outline")) {
        // Should contain indentation for nested items
        expect(formattedOutline).toMatch(/\s{2,}/); // At least 2 spaces for indentation
      }
      
      console.log("Formatted outline preview:");
      console.log(formattedOutline.split('\n').slice(0, 10).join('\n'));
    });

    it("should return null for PDF without outline", async () => {
      const outline = await processor.extractOutline(loadedPdfId);
      
      expect(outline).toBeNull();
    });
  });

  describe("getPDFInfo", () => {
    it("should get PDF metadata", async () => {
      const info = await processor.getPDFInfo(urlPdfId);
      
      expect(info).toBeDefined();
      expect(info.id).toBe(urlPdfId);
      expect(info.path).toBe(TEST_PDF_URL);
      expect(info.pageCount).toBeGreaterThan(0);
      expect(info.metadata).toBeDefined();
      
      console.log("PDF metadata:", JSON.stringify(info.metadata, null, 2));
    });

    it("should throw error for non-existent PDF", async () => {
      expect(processor.getPDFInfo("nonexistent")).rejects.toThrow("PDF not found");
    });
  });

  describe("listLoadedPDFs", () => {
    it("should list all loaded PDFs", async () => {
      const pdfs = await processor.listLoadedPDFs();
      
      expect(pdfs).toBeDefined();
      expect(Array.isArray(pdfs)).toBe(true);
      expect(pdfs.length).toBeGreaterThanOrEqual(2); // At least our test PDF and URL PDF
      
      // Check that our loaded PDFs are in the list
      const pdfIds = pdfs.map(p => p.id);
      expect(pdfIds).toContain(loadedPdfId);
      expect(pdfIds).toContain(urlPdfId);
      
      console.log(`Currently loaded PDFs: ${pdfs.length}`);
      pdfs.forEach(pdf => {
        console.log(`- ${pdf.path} (${pdf.pageCount} pages)`);
      });
    });
  });
});