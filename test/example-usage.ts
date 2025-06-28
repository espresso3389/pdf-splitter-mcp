#!/usr/bin/env bun

/**
 * Example usage of the PDF Splitter MCP functions
 * This demonstrates how to use all available functions with a real PDF
 */

import { PDFProcessor } from "../src/pdf-processor";

const EXAMPLE_PDF_URL = "https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf";

async function main() {
  const processor = new PDFProcessor();
  
  console.log("=== PDF Splitter MCP Example Usage ===\n");

  try {
    // 1. Load PDF from URL
    console.log("1. Loading PDF from URL...");
    const loadResult = await processor.loadPDF(EXAMPLE_PDF_URL);
    const pdfId = loadResult.id;
    console.log(`✓ PDF loaded successfully!`);
    console.log(`  - ID: ${pdfId}`);
    console.log(`  - Pages: ${loadResult.pageCount}\n`);

    // 2. Get PDF info
    console.log("2. Getting PDF information...");
    const info = await processor.getPDFInfo(pdfId);
    console.log("✓ PDF Info:");
    console.log(`  - Path: ${info.path}`);
    console.log(`  - Page Count: ${info.pageCount}`);
    if (info.metadata) {
      console.log("  - Metadata:");
      Object.entries(info.metadata).forEach(([key, value]) => {
        if (value) console.log(`    - ${key}: ${value}`);
      });
    }
    console.log();

    // 3. Extract document outline/TOC
    console.log("3. Extracting document outline...");
    const outline = await processor.getFormattedOutline(pdfId);
    if (!outline.includes("No outline")) {
      console.log("✓ Document Outline (first 10 items):");
      const outlineLines = outline.split('\n').filter(line => line.trim());
      outlineLines.slice(0, 10).forEach(line => console.log(`  ${line}`));
      if (outlineLines.length > 10) {
        console.log(`  ... and ${outlineLines.length - 10} more items`);
      }
    } else {
      console.log("✗ No outline found in this PDF");
    }
    console.log();

    // 4. Extract a specific page
    console.log("4. Extracting page 1...");
    const page1Content = await processor.extractPage(pdfId, 1);
    console.log("✓ Page 1 content (first 200 characters):");
    console.log(`  "${page1Content.substring(0, 200).replace(/\n/g, ' ').trim()}..."\n`);

    // 5. Extract a range of pages
    console.log("5. Extracting pages 1-3...");
    const rangeContent = await processor.extractRange(pdfId, 1, 3);
    const pageCount = (rangeContent.match(/--- Page \d+ ---/g) || []).length;
    console.log(`✓ Extracted ${pageCount} pages`);
    console.log(`  Total content length: ${rangeContent.length} characters\n`);

    // 6. Search for text
    console.log("6. Searching for 'PDF' in the document...");
    const searchResults = await processor.searchPDF(pdfId, "PDF");
    console.log(`✓ Found "${searchResults.length}" pages containing "PDF"`);
    if (searchResults.length > 0) {
      console.log("  First 3 occurrences:");
      searchResults.slice(0, 3).forEach(result => {
        console.log(`  - Page ${result.page}: ${result.matches.length} matches`);
        if (result.matches.length > 0) {
          console.log(`    Context: "...${result.matches[0].context.substring(0, 80)}..."`);
        }
      });
    }
    console.log();

    // 7. Case-sensitive search
    console.log("7. Case-sensitive search for 'adobe'...");
    const caseSensitiveResults = await processor.searchPDF(pdfId, "adobe", true);
    console.log(`✓ Found ${caseSensitiveResults.length} pages with exact match "adobe"\n`);

    // 8. List all loaded PDFs
    console.log("8. Listing all loaded PDFs...");
    const loadedPDFs = await processor.listLoadedPDFs();
    console.log(`✓ Currently loaded PDFs: ${loadedPDFs.length}`);
    loadedPDFs.forEach(pdf => {
      console.log(`  - ${pdf.path}`);
      console.log(`    ID: ${pdf.id}, Pages: ${pdf.pageCount}`);
    });
    console.log();

    // 9. Render a page as an image
    console.log("9. Rendering page 1 as an image...");
    const renderedPage = await processor.renderPage(pdfId, 1, 150, 'png');
    console.log(`✓ Page rendered successfully!`);
    console.log(`  - Format: ${renderedPage.format}`);
    console.log(`  - Dimensions: ${renderedPage.width}x${renderedPage.height}`);
    console.log(`  - DPI: ${renderedPage.dpi}`);
    console.log(`  - Size: ${Math.round(renderedPage.base64.length / 1024)}KB (base64)\n`);

    // 10. Render multiple pages (thumbnails)
    console.log("10. Creating thumbnails of first 3 pages...");
    const thumbnails = await processor.renderPages(pdfId, [1, 2, 3], 72, 'jpeg');
    console.log(`✓ Created ${thumbnails.length} thumbnails`);
    thumbnails.forEach(thumb => {
      console.log(`  - Page ${thumb.page}: ${thumb.width}x${thumb.height} ${thumb.format}`);
    });
    console.log();

    // 11. Regex search
    console.log("11. Searching with regex pattern /\\d+\\.\\d+/ (version numbers)...");
    const regexResults = await processor.searchPDF(pdfId, "\\d+\\.\\d+", false, true);
    console.log(`✓ Found ${regexResults.length} pages with version number patterns`);
    if (regexResults.length > 0) {
      const allMatches = regexResults.flatMap(r => r.matches.map(m => m.text));
      const uniqueMatches = [...new Set(allMatches)].slice(0, 5);
      console.log(`  Sample matches: ${uniqueMatches.join(', ')}`);
    }

    console.log("\n=== Example completed successfully! ===");

  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
main().catch(console.error);