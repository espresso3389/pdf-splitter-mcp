# PDF Splitter MCP Tests

This directory contains comprehensive tests for the PDF Splitter MCP server.

## Test Files

- **`pdf-processor.test.ts`** - Unit tests for the PDFProcessor class
- **`mcp-server.test.ts`** - Integration tests for the MCP server
- **`image-extraction.test.ts`** - Tests for image extraction functionality
- **`image-validation.test.ts`** - Comprehensive image validation tests using Sharp
- **`page-rendering.test.ts`** - Tests for page rendering at different DPIs and formats
- **`japanese-pdf.test.ts`** - Tests for handling PDFs with CJK characters
- **`example-usage.ts`** - Executable example demonstrating all features
- **`example-image-extraction.ts`** - Example demonstrating image extraction

## Running Tests

### Run all tests
```bash
npm test
# or
bun test
```

### Run tests in watch mode
```bash
npm run test:watch
# or
bun test --watch
```

### Run specific test file
```bash
bun test pdf-processor.test.ts
```

### Run the example
```bash
bun run test/example-usage.ts
```

## Test Coverage

The tests cover all major functionality:

1. **PDF Loading**
   - Local file loading
   - URL loading (using Adobe PDF spec as example)
   - Error handling for invalid paths/URLs

2. **Page Extraction**
   - Single page extraction
   - Range extraction
   - Boundary validation

3. **Text Search**
   - Case-insensitive search (default)
   - Case-sensitive search
   - Multi-page results

4. **Document Outline**
   - TOC extraction with page numbers
   - Formatted outline output
   - Handling PDFs without outlines

5. **PDF Information**
   - Metadata extraction
   - PDF listing
   - Error handling

6. **Image Extraction**
   - List embedded images with metadata
   - Extract images as base64-encoded data
   - Extract specific images by page and index
   - Handle PDFs without images

7. **Page Rendering**
   - Render pages at different DPI settings (72-300)
   - Support for PNG and JPEG formats
   - Batch rendering of multiple pages
   - Maintain aspect ratios
   - Performance optimization

8. **Regex Search**
   - Search with regular expressions
   - Case-sensitive regex matching
   - Complex pattern matching
   - Invalid regex handling

## Test PDF

The tests use the Adobe PDF 32000 specification document as a real-world example:
- URL: https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf
- This is a large, well-structured PDF with:
  - Multiple pages (700+)
  - Complete document outline/TOC
  - Rich metadata
  - Searchable text content

## Notes

- URL tests require internet connection
- URL tests have extended timeout (30 seconds) for downloading large PDFs
- The example script provides a practical demonstration of all features