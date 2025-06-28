import { describe, it, expect, beforeAll } from "bun:test";
import { PDFProcessor } from "../src/pdf-processor";
import sharp from "sharp";

describe("Image Validation", () => {
  let processor: PDFProcessor;
  let pdfWithImagesId: string;
  let renderedPdfId: string;
  
  beforeAll(async () => {
    processor = new PDFProcessor();
    
    // Load a PDF with embedded images
    const imagesPdfUrl = "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";
    const imagesResult = await processor.loadPDF(imagesPdfUrl);
    pdfWithImagesId = imagesResult.id;
    
    // Load a simple PDF for rendering tests
    const simplePdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    const renderResult = await processor.loadPDF(simplePdfUrl);
    renderedPdfId = renderResult.id;
    
    console.log(`Loaded PDFs: ${imagesResult.pageCount} pages with images, ${renderResult.pageCount} pages for rendering`);
  }, 60000);
  
  describe("Extracted Images Validation", () => {
    it("should extract valid PNG/JPEG images", async () => {
      // First try with dpi=0 for embedded images
      let images = await processor.extractImages(pdfWithImagesId, [1], 0);
      
      // If no embedded images, render the page
      if (images.length === 0) {
        console.log("No embedded images found, testing with rendered page");
        images = await processor.extractImages(pdfWithImagesId, [1], 96);
      }
      
      expect(images.length).toBeGreaterThan(0);
      
      for (const image of images) {
        // Decode base64 to buffer
        const buffer = Buffer.from(image.base64, 'base64');
        
        // Use sharp to validate and get metadata
        const metadata = await sharp(buffer).metadata();
        
        // Validate image properties
        expect(metadata.width).toBe(image.width);
        expect(metadata.height).toBe(image.height);
        expect(metadata.format).toBeDefined();
        expect(['jpeg', 'png', 'webp', 'gif', 'svg']).toContain(metadata.format);
        
        console.log(`Validated image: page ${image.page}, index ${image.index}, ${metadata.width}x${metadata.height} ${metadata.format}`);
      }
    });
    
    it("should extract images with correct color channels", async () => {
      let images = await processor.extractImages(pdfWithImagesId, [1], 0);
      if (images.length === 0) {
        images = await processor.extractImages(pdfWithImagesId, [1], 96);
      }
      
      for (const image of images.slice(0, 3)) { // Test first 3 images
        const buffer = Buffer.from(image.base64, 'base64');
        const metadata = await sharp(buffer).metadata();
        
        expect(metadata.channels).toBeDefined();
        expect([1, 3, 4]).toContain(metadata.channels); // Grayscale, RGB, or RGBA
        expect(metadata.space).toBeDefined();
        
        console.log(`Image color info: ${metadata.channels} channels, ${metadata.space} color space`);
      }
    });
    
    it("should be able to convert extracted images", async () => {
      let images = await processor.extractImages(pdfWithImagesId, [1], 0);
      if (images.length === 0) {
        images = await processor.extractImages(pdfWithImagesId, [1], 96);
      }
      
      expect(images.length).toBeGreaterThan(0);
      const firstImage = images[0];
      
      const buffer = Buffer.from(firstImage.base64, 'base64');
      
      // Try converting to different formats
      const pngBuffer = await sharp(buffer).png().toBuffer();
      const jpegBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
      const webpBuffer = await sharp(buffer).webp().toBuffer();
      
      // Validate conversions
      expect(pngBuffer.length).toBeGreaterThan(0);
      expect(jpegBuffer.length).toBeGreaterThan(0);
      expect(webpBuffer.length).toBeGreaterThan(0);
      
      // Check PNG signature
      expect(pngBuffer.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      
      // Check JPEG signature
      expect(jpegBuffer.slice(0, 2).toString('hex')).toBe('ffd8');
    });
  });
  
  describe("Rendered Page Validation", () => {
    it("should render pages as valid PNG images", async () => {
      const dpis = [96, 150, 300];
      
      for (const dpi of dpis) {
        const rendered = await processor.renderPage(renderedPdfId, 1, dpi, 'png');
        const buffer = Buffer.from(rendered.base64, 'base64');
        
        // Validate with sharp
        const metadata = await sharp(buffer).metadata();
        
        expect(metadata.format).toBe('png');
        expect(metadata.width).toBe(rendered.width);
        expect(metadata.height).toBe(rendered.height);
        expect(metadata.density).toBeDefined();
        
        // Check that higher DPI results in larger images
        if (dpi > 96) {
          expect(metadata.width).toBeGreaterThan(600); // Assuming base width ~600px at 96dpi
        }
        
        console.log(`Rendered at ${dpi} DPI: ${metadata.width}x${metadata.height}, density: ${metadata.density}`);
      }
    });
    
    it("should render pages as valid JPEG images", async () => {
      const rendered = await processor.renderPage(renderedPdfId, 1, 150, 'jpeg');
      const buffer = Buffer.from(rendered.base64, 'base64');
      
      const metadata = await sharp(buffer).metadata();
      
      expect(metadata.format).toBe('jpeg');
      expect(metadata.width).toBe(rendered.width);
      expect(metadata.height).toBe(rendered.height);
      expect(metadata.channels).toBe(3); // JPEG should be RGB
      
      // Check JPEG quality (sharp doesn't directly expose this, but we can check file characteristics)
      const stats = await sharp(buffer).stats();
      expect(stats).toBeDefined();
      expect(stats.channels.length).toBe(3);
    });
    
    it("should maintain aspect ratio when rendering", async () => {
      const page1 = await processor.renderPage(renderedPdfId, 1, 96);
      const page1_high = await processor.renderPage(renderedPdfId, 1, 192);
      
      const ratio1 = page1.width / page1.height;
      const ratio2 = page1_high.width / page1_high.height;
      
      // Aspect ratios should be the same (within rounding error)
      expect(Math.abs(ratio1 - ratio2)).toBeLessThan(0.01);
    });
    
    it("should render transparent areas correctly", async () => {
      const rendered = await processor.renderPage(renderedPdfId, 1, 96, 'png');
      const buffer = Buffer.from(rendered.base64, 'base64');
      
      const metadata = await sharp(buffer).metadata();
      
      // PNG can have alpha channel
      expect([3, 4]).toContain(metadata.channels); // RGB or RGBA
      
      // Extract alpha channel if present
      if (metadata.channels === 4) {
        const { data, info } = await sharp(buffer)
          .extractChannel('alpha')
          .raw()
          .toBuffer({ resolveWithObject: true });
        
        expect(data.length).toBe(info.width * info.height);
        console.log(`Alpha channel extracted: ${info.width}x${info.height}`);
      }
    });
  });
  
  describe("Image Extraction Edge Cases", () => {
    it("should handle PDFs without images gracefully", async () => {
      const images = await processor.extractImages(renderedPdfId, undefined, 0);
      
      // Should return empty array for PDFs without embedded images when dpi=0
      expect(images).toBeDefined();
      expect(Array.isArray(images)).toBe(true);
      expect(images.length).toBe(0);
    });
    
    it("should extract images when rendering pages without embedded images", async () => {
      const images = await processor.extractImages(renderedPdfId, [1], 96);
      
      // Should return rendered page as image when dpi > 0
      expect(images.length).toBe(1);
      expect(images[0].page).toBe(1);
      
      // Validate the rendered image
      const buffer = Buffer.from(images[0].base64, 'base64');
      const metadata = await sharp(buffer).metadata();
      expect(metadata.format).toBe('png');
    });
  });
  
  describe("Performance and Memory", () => {
    it("should handle large images efficiently", async () => {
      const start = performance.now();
      const images = await processor.extractImages(pdfWithImagesId, [1, 2, 3], 150);
      const extractTime = performance.now() - start;
      
      console.log(`Extracted ${images.length} images in ${Math.round(extractTime)}ms`);
      
      // Validate each image
      const validationStart = performance.now();
      for (const image of images) {
        const buffer = Buffer.from(image.base64, 'base64');
        await sharp(buffer).metadata();
      }
      const validationTime = performance.now() - validationStart;
      
      console.log(`Validated ${images.length} images in ${Math.round(validationTime)}ms`);
      
      // Should complete in reasonable time
      expect(extractTime).toBeLessThan(10000); // 10 seconds
      expect(validationTime).toBeLessThan(5000); // 5 seconds
    });
    
    it("should produce reasonably sized images", async () => {
      const rendered = await processor.renderPage(renderedPdfId, 1, 300, 'png');
      const buffer = Buffer.from(rendered.base64, 'base64');
      
      const metadata = await sharp(buffer).metadata();
      const sizeInKB = buffer.length / 1024;
      
      console.log(`300 DPI PNG: ${metadata.width}x${metadata.height}, ${Math.round(sizeInKB)}KB`);
      
      // A 300 DPI page shouldn't be unreasonably large
      expect(sizeInKB).toBeLessThan(5000); // Less than 5MB
      
      // Try compressing it
      const compressedBuffer = await sharp(buffer)
        .png({ compressionLevel: 9 })
        .toBuffer();
      
      const compressedSizeKB = compressedBuffer.length / 1024;
      console.log(`Compressed PNG: ${Math.round(compressedSizeKB)}KB (${Math.round((1 - compressedSizeKB/sizeInKB) * 100)}% reduction)`);
      
      expect(compressedSizeKB).toBeLessThan(sizeInKB);
    });
  });
});