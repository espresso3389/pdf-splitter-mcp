import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PDFProcessor } from "../src/pdf-processor";
import { writeFile, mkdir, rm } from "fs/promises";
import { existsSync } from "fs";

describe("Page Rendering", () => {
  let processor: PDFProcessor;
  let pdfId: string;
  const outputDir = "./test-render-output";
  
  beforeAll(async () => {
    processor = new PDFProcessor();
    
    // Create output directory
    await mkdir(outputDir, { recursive: true });
    
    // Load a simple test PDF
    const pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    const result = await processor.loadPDF(pdfUrl);
    pdfId = result.id;
    console.log(`Loaded test PDF with ${result.pageCount} pages`);
  }, 30000);
  
  afterAll(async () => {
    // Clean up output directory
    if (existsSync(outputDir)) {
      await rm(outputDir, { recursive: true, force: true });
    }
  });
  
  describe("renderPage", () => {
    it("should render a page at default DPI (96)", async () => {
      const rendered = await processor.renderPage(pdfId, 1);
      
      expect(rendered).toBeDefined();
      expect(rendered.page).toBe(1);
      expect(rendered.width).toBeGreaterThan(0);
      expect(rendered.height).toBeGreaterThan(0);
      expect(rendered.format).toBe('png');
      expect(rendered.base64).toBeDefined();
      expect(rendered.base64.length).toBeGreaterThan(0);
    });
    
    it("should render at different DPI settings", async () => {
      const testDPIs = [96, 150, 300];
      const results = [];
      
      for (const dpi of testDPIs) {
        const rendered = await processor.renderPage(pdfId, 1, dpi);
        results.push(rendered);
        
        expect(rendered.width).toBeGreaterThan(0);
        expect(rendered.height).toBeGreaterThan(0);
        
        // Save test output
        const buffer = Buffer.from(rendered.base64, 'base64');
        await writeFile(`${outputDir}/page1_${dpi}dpi.png`, buffer);
      }
      
      // Higher DPI should result in larger dimensions
      expect(results[1].width).toBeGreaterThan(results[0].width);
      expect(results[2].width).toBeGreaterThan(results[1].width);
    });
    
    it("should render in JPEG format", async () => {
      const rendered = await processor.renderPage(pdfId, 1, 150, 'jpeg');
      
      expect(rendered).toBeDefined();
      expect(rendered.format).toBe('jpeg');
      expect(rendered.base64).toBeDefined();
      
      // Save test output
      const buffer = Buffer.from(rendered.base64, 'base64');
      await writeFile(`${outputDir}/page1_jpeg.jpeg`, buffer);
    });
    
    it("should handle invalid page numbers", async () => {
      expect(processor.renderPage(pdfId, 0)).rejects.toThrow("Invalid page number");
      expect(processor.renderPage(pdfId, 999)).rejects.toThrow("Invalid page number");
    });
    
    it("should handle non-existent PDF", async () => {
      expect(processor.renderPage("non-existent", 1)).rejects.toThrow("PDF not found");
    });
  });
  
  describe("renderPages", () => {
    it("should render all pages when pageNumbers is not provided", async () => {
      const rendered = await processor.renderPages(pdfId);
      
      expect(rendered).toBeDefined();
      expect(Array.isArray(rendered)).toBe(true);
      expect(rendered.length).toBeGreaterThan(0);
      
      rendered.forEach((page, index) => {
        expect(page.page).toBe(index + 1);
        expect(page.width).toBeGreaterThan(0);
        expect(page.height).toBeGreaterThan(0);
        expect(page.format).toBe('png');
        expect(page.base64).toBeDefined();
      });
    });
    
    it("should render specific pages", async () => {
      const pageNumbers = [1];
      const rendered = await processor.renderPages(pdfId, pageNumbers);
      
      expect(rendered.length).toBe(1);
      expect(rendered[0].page).toBe(1);
    });
    
    it("should render pages at specified DPI and format", async () => {
      const rendered = await processor.renderPages(pdfId, [1], 200, 'jpeg');
      
      expect(rendered.length).toBe(1);
      expect(rendered[0].format).toBe('jpeg');
      expect(rendered[0].width).toBeGreaterThan(0);
    });
    
    it("should handle empty page numbers array", async () => {
      const rendered = await processor.renderPages(pdfId, []);
      
      expect(rendered).toBeDefined();
      expect(Array.isArray(rendered)).toBe(true);
      expect(rendered.length).toBe(0);
    });
    
    it("should filter out invalid page numbers", async () => {
      const rendered = await processor.renderPages(pdfId, [1, 999, -1, 0]);
      
      expect(rendered.length).toBe(1);
      expect(rendered[0].page).toBe(1);
    });
  });
  
  describe("Performance", () => {
    it("should render pages efficiently", async () => {
      const start = performance.now();
      const rendered = await processor.renderPages(pdfId, undefined, 96);
      const duration = performance.now() - start;
      
      console.log(`Rendered ${rendered.length} pages in ${Math.round(duration)}ms`);
      
      expect(rendered.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds for a small PDF
    });
  });
});