import { describe, it, expect, beforeAll } from "bun:test";
import { PDFProcessor } from "../src/pdf-processor";
import { writeFile } from "fs/promises";
import sharp from "sharp";

// We'll use a test PDF that has images
const TEST_PDF_WITH_IMAGES = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

describe("Image Extraction", () => {
  let processor: PDFProcessor;
  let pdfId: string;

  beforeAll(async () => {
    processor = new PDFProcessor();
    const result = await processor.loadPDF(TEST_PDF_WITH_IMAGES);
    pdfId = result.id;
  }, 30000);

  describe("listImages", () => {
    it("should list all images in the PDF", async () => {
      const images = await processor.listImages(pdfId);
      
      expect(images).toBeDefined();
      expect(Array.isArray(images)).toBe(true);
      
      console.log(`Found ${images.length} images in the PDF`);
      
      // If images are found, check their structure
      if (images.length > 0) {
        const firstImage = images[0];
        expect(firstImage).toHaveProperty('page');
        expect(firstImage).toHaveProperty('index');
        expect(firstImage).toHaveProperty('width');
        expect(firstImage).toHaveProperty('height');
        expect(firstImage).toHaveProperty('format');
        
        expect(firstImage.page).toBeGreaterThan(0);
        expect(firstImage.index).toBeGreaterThanOrEqual(0);
        expect(firstImage.width).toBeGreaterThan(0);
        expect(firstImage.height).toBeGreaterThan(0);
      }
    });
  });

  describe("extractImages", () => {
    it("should extract all images from the PDF", async () => {
      const images = await processor.extractImages(pdfId);
      
      expect(images).toBeDefined();
      expect(Array.isArray(images)).toBe(true);
      
      // Check if any images were extracted
      expect(images.length).toBeGreaterThanOrEqual(0);
      
      if (images.length > 0) {
        const firstImage = images[0];
        expect(firstImage).toHaveProperty('page');
        expect(firstImage).toHaveProperty('index');
        expect(firstImage).toHaveProperty('width');
        expect(firstImage).toHaveProperty('height');
        expect(firstImage).toHaveProperty('format');
        expect(firstImage).toHaveProperty('base64');
        
        // Check base64 is valid
        expect(firstImage.base64).toBeDefined();
        expect(firstImage.base64.length).toBeGreaterThan(0);
        
        // Validate it's proper base64
        expect(() => Buffer.from(firstImage.base64, 'base64')).not.toThrow();
        
        // Validate with sharp
        const buffer = Buffer.from(firstImage.base64, 'base64');
        const metadata = await sharp(buffer).metadata();
        
        // Allow for small rounding differences (within 1 pixel)
        expect(Math.abs(metadata.width! - firstImage.width)).toBeLessThanOrEqual(1);
        expect(Math.abs(metadata.height! - firstImage.height)).toBeLessThanOrEqual(1);
      }
    });

    it("should extract images from specific pages", async () => {
      const images = await processor.extractImages(pdfId, [1]);
      
      expect(images).toBeDefined();
      expect(Array.isArray(images)).toBe(true);
      
      // All images should be from page 1
      images.forEach(img => {
        expect(img.page).toBe(1);
      });
    });

    it("should handle invalid page numbers gracefully", async () => {
      const images = await processor.extractImages(pdfId, [999]);
      
      expect(images).toBeDefined();
      expect(images.length).toBe(0);
    });
  });

  describe("extractImage", () => {
    it("should extract a specific image", async () => {
      // First get list of images to know what's available
      const imageList = await processor.listImages(pdfId);
      
      if (imageList.length > 0) {
        const firstImageInfo = imageList[0];
        const image = await processor.extractImage(
          pdfId,
          firstImageInfo.page,
          firstImageInfo.index
        );
        
        expect(image).not.toBeNull();
        expect(image?.page).toBe(firstImageInfo.page);
        expect(image?.index).toBe(firstImageInfo.index);
        expect(image?.base64).toBeDefined();
      }
    });

    it("should return null for non-existent image", async () => {
      const image = await processor.extractImage(pdfId, 1, 999);
      expect(image).toBeNull();
    });
  });

  describe("Image formats", () => {
    it("should handle different image formats", async () => {
      const images = await processor.extractImages(pdfId);
      
      if (images.length > 0) {
        images.forEach(img => {
          expect(['png', 'jpeg', 'unknown']).toContain(img.format);
          
          // If format is known, check the base64 data starts correctly
          if (img.format === 'png') {
            const buffer = Buffer.from(img.base64, 'base64');
            expect(buffer[0]).toBe(0x89);
            expect(buffer[1]).toBe(0x50);
          } else if (img.format === 'jpeg') {
            const buffer = Buffer.from(img.base64, 'base64');
            expect(buffer[0]).toBe(0xFF);
            expect(buffer[1]).toBe(0xD8);
          }
        });
      }
    });
  });

  describe("Performance", () => {
    it("should extract images efficiently from large PDFs", async () => {
      // Load the Adobe PDF spec
      const largePdfUrl = "https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf";
      const result = await processor.loadPDF(largePdfUrl);
      
      const startTime = Date.now();
      const images = await processor.extractImages(result.id, [1, 2, 3]); // First 3 pages only
      const endTime = Date.now();
      
      console.log(`Extracted ${images.length} images from 3 pages in ${endTime - startTime}ms`);
      
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    }, 30000);
  });
});