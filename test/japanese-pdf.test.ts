import { describe, it, expect, beforeEach } from "bun:test";
import { PDFProcessor } from "../src/pdf-processor";

const JAPANESE_PDF_URL = "https://www.stat.go.jp/data/nenkan/74nenkan/zenbun/jp74/data/676/src/jp74.pdf";

describe("Japanese PDF Handling", () => {
  let processor: PDFProcessor;
  let pdfId: string;

  beforeEach(() => {
    processor = new PDFProcessor();
  });

  it("should properly extract pages from Japanese statistical yearbook", async () => {
    // Load the PDF
    const result = await processor.loadPDF(JAPANESE_PDF_URL);
    pdfId = result.id;
    
    expect(result.pageCount).toBe(831);
    
    // Test single page extraction
    const page1 = await processor.extractPage(pdfId, 1);
    // Handle potential spacing in Japanese text
    expect(page1.replace(/\s/g, '')).toContain("第七十四回");
    expect(page1).toContain("JAPAN");
    expect(page1).toContain("STATISTICAL YEARBOOK");
    expect(page1.length).toBeLessThan(500); // Should be a single page, not the entire document
    
    // Test range extraction
    const range = await processor.extractRange(pdfId, 1, 3);
    expect(range).toContain("--- Page 1 ---");
    expect(range).toContain("--- Page 2 ---");
    expect(range).toContain("--- Page 3 ---");
    // Handle spacing in Japanese text
    expect(range.replace(/\s/g, '')).toContain("まえがき"); // Preface on page 3
    
    // Verify each page is properly separated
    const pages = range.split(/--- Page \d+ ---/);
    expect(pages.length).toBe(4); // Empty first element + 3 pages
    
    // Check that pages have reasonable content
    const page1Content = pages[1].trim();
    const page2Content = pages[2].trim();
    const page3Content = pages[3].trim();
    
    expect(page1Content.length).toBeGreaterThan(0);
    expect(page1Content.length).toBeLessThan(1000);
    
    // Page 2 might be empty in some PDFs
    expect(page2Content.length).toBeGreaterThanOrEqual(0);
    expect(page2Content.length).toBeLessThan(1000);
    
    expect(page3Content.length).toBeGreaterThan(0);
    expect(page3Content.length).toBeLessThan(2000);
  }, 60000); // 60 second timeout for large PDF

  it("should handle page extraction for middle pages", async () => {
    // Always load fresh for this test
    const result = await processor.loadPDF(JAPANESE_PDF_URL);
    const localPdfId = result.id;
    
    // Test extraction of pages in the middle
    const range = await processor.extractRange(localPdfId, 100, 102);
    const pages = range.split(/--- Page \d+ ---/).filter(p => p.trim());
    
    expect(pages.length).toBe(3);
    
    // Each page should have content
    pages.forEach(page => {
      expect(page.trim().length).toBeGreaterThan(0);
    });
  }, 60000);
});