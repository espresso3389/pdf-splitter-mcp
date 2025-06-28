# PDF Splitter MCP Server

A Model Context Protocol (MCP) server that provides random access to PDF contents, reducing total reading costs by allowing selective extraction of pages and content.

## Prerequisites

### Install Bun (required for all installation methods):

```bash
# Linux/macOS
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

## Quick Start - One Command Installation!

### For Claude Code:

```bash
bunx espresso3389/pdf-splitter-mcp install claudecode
```

### For Gemini CLI:

```bash
bunx espresso3389/pdf-splitter-mcp install geminicli
```

That's it! The installer will automatically configure everything for you.

### Note for upgrading the package

Because `bunx` caches the downloaded package under your temporary directory, if you want to upgrade the package forcibly, you should delete the cache by yourself before `bunx`:

```bash
# Linux/macOS
rm -rf /tmp/bunx-*-@espresso3389/pdf-splitter-mcp

# Windows
powershell -c "rm -Recurse -Force $env:TEMP/bunx-*-@espresso3389/pdf-splitter-mcp"
```


## Manual Installation (Optional)

If you prefer to install locally:

1. Clone and setup
```bash
# Clone or download this project to your computer
# Then navigate to the project directory
cd /path/to/pdf-splitter-mcp
bun install
```

3. Configure your AI tool:

#### For Claude Code:
```bash
claude mcp add pdf-splitter -- bun run /full/path/to/pdf-splitter-mcp/src/index.ts
```

#### For Gemini CLI:
```json
{
  "mcpServers": {
    "pdf-splitter": {
      "command": "bun",
      "args": ["run", "/full/path/to/pdf-splitter-mcp/src/index.ts"]
    }
  }
}
```

### Restart your AI tool and start using!

Example conversation:
```
You: Load the PDF at /Users/me/documents/report.pdf
AI: [uses load_pdf tool] PDF loaded! ID: abc123, 50 pages

You: Show me page 10
AI: [uses extract_page tool] Here's page 10 content...

You: Search for "revenue" in the PDF
AI: [uses search_pdf tool] Found "revenue" on pages 3, 10, and 25...

You: Search for email addresses using regex
AI: [uses search_pdf tool with regex] Found matches for pattern "\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b" on pages 5, 12...

You: Render page 10 as a high-quality image
AI: [uses render_page tool with dpi=300] Here's page 10 rendered at 300 DPI as a PNG image...

You: Create thumbnails of all pages
AI: [uses render_pages tool with dpi=72] Generated thumbnails for all 50 pages...

You: Save page 10 as a high-quality image to /tmp/page10.png
AI: [uses render_page tool with dpi=300 and outputPath="/tmp/page10.png"] Page 10 rendered and saved to: /tmp/page10.png

You: Extract all images from the PDF and save them to /tmp/images/
AI: [uses extract_images tool with outputPath="/tmp/images/page_{page}_img_{index}.png"] Saved 15 images. First image saved to: /tmp/images/page_1_img_0.png
```

---

## Features

- **Load PDF**: Load PDF files from local filesystem or URLs into memory
- **Extract Page**: Extract text content from specific pages
- **Extract Range**: Extract text from a range of pages
- **Search PDF**: Search for text within the PDF (supports plain text and regular expressions, case-sensitive or case-insensitive)
- **Get PDF Info**: Retrieve metadata and information about the loaded PDF
- **List Loaded PDFs**: View all currently loaded PDFs
- **Extract Outline**: Extract document outline/table of contents with page numbers
- **List Images**: List all images in the PDF with metadata (page, dimensions, format)
- **Extract Images**: Extract images as base64-encoded data (PNG/JPEG)
- **Extract Image**: Extract a specific image by page and index
- **Render Page**: Render a PDF page as an image at any DPI (PNG/JPEG)
- **Render Pages**: Render multiple PDF pages as images with batch processing

## CLI Commands

The PDF Splitter MCP provides several useful commands:

```bash
# Show help and usage
bunx @espresso3389/pdf-splitter-mcp

# Install for Claude Code
bunx @espresso3389/pdf-splitter-mcp install claudecode

# Install for Gemini CLI  
bunx @espresso3389/pdf-splitter-mcp install geminicli

# Run the MCP server directly
bunx @espresso3389/pdf-splitter-mcp serve
```

### Available Tools

1. **load_pdf**
   - Load a PDF file into memory (supports URLs)
   - Parameters: `path` (string - local path or URL)
   - Returns: PDF ID and page count

2. **extract_page**
   - Extract content from a specific page
   - Parameters: `pdfId` (string), `pageNumber` (number, 1-indexed)
   - Returns: Page content as text

3. **extract_range**
   - Extract content from a range of pages
   - Parameters: `pdfId` (string), `startPage` (number), `endPage` (number)
   - Returns: Combined content from the page range

4. **search_pdf**
   - Search for text within the PDF
   - Parameters: `pdfId` (string), `query` (string), `caseSensitive` (boolean, optional)
   - Returns: Search results with page numbers and context

5. **get_pdf_info**
   - Get metadata about a loaded PDF
   - Parameters: `pdfId` (string)
   - Returns: PDF information including metadata

6. **list_loaded_pdfs**
   - List all currently loaded PDFs
   - Returns: Array of loaded PDFs with their IDs and page counts

7. **extract_outline**
   - Extract document outline/TOC with page numbers
   - Parameters: `pdfId` (string)
   - Returns: Formatted outline with page references

8. **list_images**
   - List all images in the PDF with metadata
   - Parameters: `pdfId` (string)
   - Returns: Array of image information (page, index, dimensions, format)

9. **extract_images**
   - Extract images from the PDF as base64-encoded data
   - Parameters: 
     - `pdfId` (string)
     - `pageNumbers` (array of numbers, optional)
     - `dpi` (number, optional, default: 96)
     - `outputPath` (string, optional - save images to files instead of returning base64)
   - Returns: Array of images with base64 data (or saves to files if outputPath provided)
   - outputPath pattern: Use `{page}` for page number and `{index}` for image index (e.g., `/path/page_{page}_img_{index}.png`)

10. **extract_image**
    - Extract a specific image from the PDF
    - Parameters: 
      - `pdfId` (string)
      - `pageNumber` (number)
      - `imageIndex` (number)
      - `dpi` (number, optional, default: 96)
      - `outputPath` (string, optional - save image to file instead of returning base64)
    - Returns: Single image with base64 data (or saves to file if outputPath provided)

11. **render_page**
    - Render a PDF page as an image at specified DPI
    - Parameters: 
      - `pdfId` (string)
      - `pageNumber` (number, 1-indexed)
      - `dpi` (number, optional, default: 96)
      - `format` (string, optional, "png" or "jpeg", default: "png")
      - `outputPath` (string, optional - save image to file instead of returning base64)
    - Returns: Rendered page image with base64 data, dimensions, and format (or saves to file if outputPath provided)

12. **render_pages**
    - Render multiple PDF pages as images
    - Parameters:
      - `pdfId` (string)
      - `pageNumbers` (array of numbers, optional - renders all pages if not provided)
      - `dpi` (number, optional, default: 96)
      - `format` (string, optional, "png" or "jpeg", default: "png")
      - `outputPath` (string, optional - save images to files instead of returning base64)
    - Returns: Array of rendered page images with base64 data (or saves to files if outputPath provided)
    - outputPath pattern: Use `{page}` for page number (e.g., `/path/page_{page}.png`)

### MCP Client Configuration

Add this to your MCP client configuration:

```json
{
  "mcpServers": {
    "pdf-splitter": {
      "command": "bun",
      "args": ["run", "/path/to/pdf-splitter-mcp/src/index.ts"]
    }
  }
}
```

## Development

```bash
# Run in development mode with hot reload
bun run dev

# Build for production
bun run build

# Run production build
bun run start
```

## Benefits

- **Reduced Token Usage**: Only extract the pages you need instead of processing entire PDFs
- **Faster Processing**: Random access to specific sections without sequential reading
- **Memory Efficient**: PDFs are parsed once and kept in memory for quick access
- **Search Capability**: Find specific content across large documents quickly
- **Visual Processing**: Render pages as images for OCR, visual analysis, or thumbnail generation
- **Flexible Output**: Support for different DPI settings and image formats (PNG/JPEG)

## Common Use Cases

### Document Analysis
- Extract specific pages or sections for detailed analysis
- Search for patterns, keywords, or data across large documents
- Extract tables of contents and navigate complex documents

### Image Processing
- Extract embedded images from PDFs for separate processing
- Render pages as high-quality images for OCR or visual analysis
- Create thumbnail previews of PDF pages
- Convert PDF pages to images for web display

### Research & Development
- Process technical papers and extract specific sections
- Search for citations, formulas, or specific terms
- Extract figures and diagrams from research papers

### Automation
- Batch process multiple PDFs programmatically
- Extract data from standardized forms or reports
- Generate image previews for document management systems