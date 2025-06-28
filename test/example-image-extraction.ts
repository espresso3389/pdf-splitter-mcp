#!/usr/bin/env bun

/**
 * Example of using the PDF image extraction features
 */

import { PDFProcessor } from "../src/pdf-processor";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Test with different PDFs
const EXAMPLE_PDFS = [
  {
    name: "W3C Test PDF",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    name: "Adobe PDF Spec (first 5 pages)",
    url: "https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf",
    pages: [1, 2, 3, 4, 5],
  },
];

async function extractImagesExample() {
  const processor = new PDFProcessor();
  
  // Create output directory
  const outputDir = "./extracted-images";
  await mkdir(outputDir, { recursive: true });
  
  console.log("=== PDF Image Extraction Example ===\n");

  for (const example of EXAMPLE_PDFS) {
    console.log(`\n--- Processing: ${example.name} ---`);
    
    try {
      // Load PDF
      console.log("Loading PDF...");
      const result = await processor.loadPDF(example.url);
      console.log(`✓ PDF loaded: ${result.pageCount} pages`);
      
      // List images
      console.log("\nListing images...");
      const imageList = await processor.listImages(result.id);
      console.log(`✓ Found ${imageList.length} images`);
      
      if (imageList.length > 0) {
        console.log("\nImage details:");
        imageList.slice(0, 5).forEach(img => {
          console.log(`  - Page ${img.page}, Index ${img.index}: ${img.width}x${img.height} (${img.format})`);
        });
        if (imageList.length > 5) {
          console.log(`  ... and ${imageList.length - 5} more`);
        }
      }
      
      // Extract images
      const pagesToExtract = example.pages || undefined;
      console.log(`\nExtracting images${pagesToExtract ? ` from pages ${pagesToExtract.join(', ')}` : ' from all pages'}...`);
      
      const startTime = Date.now();
      const images = await processor.extractImages(result.id, pagesToExtract);
      const endTime = Date.now();
      
      console.log(`✓ Extracted ${images.length} images in ${endTime - startTime}ms`);
      
      // Save a few images as examples
      const imagesToSave = Math.min(3, images.length);
      if (imagesToSave > 0) {
        console.log(`\nSaving first ${imagesToSave} images...`);
        
        for (let i = 0; i < imagesToSave; i++) {
          const image = images[i];
          const filename = `${example.name.replace(/[^a-z0-9]/gi, '-')}_page${image.page}_img${image.index}.${image.format}`;
          const filepath = join(outputDir, filename);
          
          const buffer = Buffer.from(image.base64, 'base64');
          await writeFile(filepath, buffer);
          
          console.log(`  ✓ Saved: ${filename} (${Math.round(buffer.length / 1024)}KB)`);
        }
      }
      
      // Test extracting a specific image
      if (imageList.length > 0) {
        console.log("\nTesting single image extraction...");
        const targetImage = imageList[0];
        const singleImage = await processor.extractImage(
          result.id,
          targetImage.page,
          targetImage.index
        );
        
        if (singleImage) {
          console.log(`✓ Successfully extracted image from page ${singleImage.page}, index ${singleImage.index}`);
          console.log(`  Dimensions: ${singleImage.width}x${singleImage.height}`);
          console.log(`  Format: ${singleImage.format}`);
          console.log(`  Data size: ${Math.round(singleImage.base64.length / 1024)}KB (base64)`);
        }
      }
      
    } catch (error) {
      console.error(`✗ Error processing ${example.name}:`, error);
    }
  }
  
  console.log("\n=== Example completed! ===");
  console.log(`Images saved to: ${outputDir}`);
}

// Run the example
extractImagesExample().catch(console.error);