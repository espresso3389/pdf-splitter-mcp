# PDF Splitter MCP Server

A Model Context Protocol (MCP) server that provides random access to PDF contents, reducing total reading costs by allowing selective extraction of pages and content.

## Quick Start (No Installation Required!)

`GIT_CLONED_PATH` should be replaced with the path where you cloned this repository.

### For Claude Code:

```bash
claude mcp add pdf-splitter -- bunx GIT_CLONED_PATH/pdf-splitter-mcp
```

### For Gemini CLI:

Add to `~/.config/gemini-cli/config.json`:

```json
{
  "mcpServers": {
    "pdf-splitter": {
      "command": "bunx",
      "args": ["GIT_CLONED_PATH/src/pdf-splitter-mcp"]
    }
  }
}
```

### Local Installation (Optional)

If you prefer to install locally:

1. Install Bun (if not already installed)
```bash
curl -fsSL https://bun.sh/install | bash
```

2. Clone and setup
```bash
# Clone or download this project to your computer
# Then navigate to the project directory
cd /path/to/pdf-splitter-mcp
bun install
```

3. Configure your AI tool:

#### For Claude Code:
```bash
claude mcp install bun run /full/path/to/pdf-splitter-mcp/src/index.ts
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
```

---

## Features

- **Load PDF**: Load PDF files into memory for processing
- **Extract Single Page**: Extract content from a specific page
- **Extract Page Range**: Extract content from a range of pages
- **Search PDF**: Search for text within PDFs with case-sensitive options
- **PDF Info**: Get metadata and information about loaded PDFs
- **List PDFs**: List all currently loaded PDFs

## Installation

```bash
bun install
```

## Usage

### Running the Server

```bash
bun run dev
```

### Available Tools

1. **load_pdf**
   - Load a PDF file into memory
   - Parameters: `path` (string)
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