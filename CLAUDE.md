# Claude Implementation Notes for PDF Splitter MCP

This document contains important implementation notes and context for maintaining and extending the PDF Splitter MCP server.

## Project Overview

PDF Splitter MCP is a Model Context Protocol server that provides efficient PDF processing capabilities, allowing AI assistants to extract specific content from PDFs without processing entire documents.

## Key Features Implemented

1. **PDF Loading** - From local files and URLs
2. **Text Extraction** - Single pages or ranges
3. **Search** - Plain text and regex support with case sensitivity options
4. **Document Outline** - TOC extraction with page numbers
5. **Image Handling** - List, extract embedded images, and render pages as images
6. **Page Rendering** - Convert PDF pages to PNG/JPEG at any DPI

## Technical Stack

- **Runtime**: Bun (required)
- **Language**: TypeScript
- **PDF Processing**: pdfjs-dist
- **Canvas**: @napi-rs/canvas and canvas (for PDF rendering)
- **Image Validation**: Sharp (dev dependency for tests)
- **MCP SDK**: @modelcontextprotocol/sdk

## Important Implementation Details

### Canvas Dependencies
- Both `@napi-rs/canvas` and `canvas` are required for PDF.js rendering
- The code tries @napi-rs/canvas first, then falls back to canvas
- Canvas is necessary because PDF.js requires a canvas context for rendering

### Regex Search Implementation
- Added in response to user request
- Supports both plain text and regex patterns
- Uses JavaScript RegExp with 'g' or 'gi' flags
- Includes protection against infinite loops with zero-width matches

### Image Extraction
- Can extract embedded images from PDFs
- When no embedded images exist, can render pages as images
- Supports PNG and JPEG output formats
- Uses base64 encoding for transport

### Page Rendering
- Supports DPI settings from 72 to 300+ 
- Calculates scale from PDF points (72 DPI) to target DPI
- Maintains aspect ratios
- Supports batch rendering for efficiency

## Testing

The project has comprehensive test coverage:
- Unit tests for PDFProcessor class
- Integration tests for MCP server
- Image validation tests using Sharp
- Performance tests for large PDFs
- Examples demonstrating all features

### Key Test Files
- `pdf-processor.test.ts` - Core functionality
- `image-validation.test.ts` - Validates image output with Sharp
- `page-rendering.test.ts` - Tests rendering at different DPIs
- `example-usage.ts` - Demonstrates all features

## Known Issues and Workarounds

1. **Canvas Warnings**: PDF.js may produce "getPathGenerator" warnings for some fonts - these are harmless
2. **Height Discrepancy**: Small rounding differences (±1 pixel) may occur between reported and actual image dimensions
3. **Large PDFs**: URL loading has a 30-second timeout for tests

## Development Commands

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run specific test
bun test test/image-validation.test.ts

# Run example
bun run test/example-usage.ts

# Development mode
bun run dev
```

## Future Considerations

1. **Canvas Alternative**: Investigated removing canvas dependency, but PDF.js requires it for rendering. Could explore SVG rendering as alternative.
2. **Performance**: Current implementation loads entire PDF into memory. For very large PDFs, streaming approach might be beneficial.
3. **OCR Integration**: Page rendering at high DPI enables OCR workflows but OCR itself is not implemented.

## Code Style Guidelines

- Minimal comments in code (per user preference)
- Clear, descriptive function and variable names
- Comprehensive error handling with descriptive messages
- TypeScript strict mode compliance

## Security Considerations

- URL validation for PDF loading
- No execution of PDF JavaScript
- Safe regex compilation with error handling
- Input validation for all parameters

## Maintenance Notes

When updating:
1. Run all tests before committing
2. Update examples if adding new features
3. Keep README.md in sync with actual capabilities
4. Maintain backward compatibility for API (if possible)

## Performance Optimizations

- PDFs are cached in memory after loading
- Batch operations available for rendering multiple pages
- Efficient search using indexOf for plain text
- Lazy loading of PDF content only when needed

## Documentation Guidelines

The following guidelines should be followed when writing documentation including comments, `README.md`, and other markdown files:

- Use proper grammar and spelling
- Use clear and concise language
- Use consistent terminology
- Use proper headings for sections
- Use code blocks for code snippets
- Use bullet points for lists
- Use link to relevant issues/PRs when applicable
- Use backticks (`` ` ``) for code references and file/directory/path names in documentation

### Commenting Guidelines

- Use reference links for classes, enums, and functions in documentation
- Use `///` (dartdoc comments) for public API comments (and even for important private APIs)

### Markdown Documentation Guidelines

- Include links to issues/PRs when relevant
- Use link to [API reference](https://pub.dev/documentation/pdfrx/latest/pdfrx/) for public APIs if possible
- `README.md` should provide an overview of the project, how to use it, and any important notes
- `CHANGELOG.md` should follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) principles
  - Be careful not to include implementation details in the changelog
  - Focus on user-facing changes, new features, bug fixes, and breaking changes
  - Use sections for different versions
  - Use bullet points for changes

## Release Process

When releasing a new version, follow these steps:

1. **Determine Version Number**
   - Patch release (0.x.Y): Bug fixes only
   - Minor release (0.X.0): New features, backwards compatible
   - Major release (X.0.0): Breaking changes

2. **Update Version**
   - Update version in `package.json`
   - Update `CHANGELOG.md` with release notes following Keep a Changelog format

3. **Commit and Tag**
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "Release version X.Y.Z"
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   ```

4. **Push to GitHub**
   ```bash
   git push origin main --tags
   ```

## Special Notes

- `CHANGELOG.md` is not an implementation node. So it should be updated only on releasing a new version
- For web search, if `gemini` command is available, use `gemini -p "<query>"`.
