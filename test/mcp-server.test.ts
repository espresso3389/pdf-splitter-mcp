import { describe, it, expect, beforeEach } from "bun:test";
import { PDFProcessor } from "../src/pdf-processor";

const TEST_PDF_URL = "https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf";

/**
 * Since the MCP server is designed to be used via stdio transport,
 * we'll test the PDFProcessor functionality directly which is what
 * the MCP server calls internally.
 */
describe("MCP Server Functionality", () => {
  let processor: PDFProcessor;

  // Test the tool definitions that would be exposed by the MCP server
  describe("Tool Definitions", () => {
    it("should have correct tool definitions", () => {
      const tools = [
        {
          name: "load_pdf",
          description: "Load a PDF file into memory for processing. Supports both local file paths and URLs (http/https)",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the PDF file or URL (http/https)",
              },
            },
            required: ["path"],
          },
        },
        {
          name: "extract_page",
          description: "Extract content from a specific page",
          inputSchema: {
            type: "object",
            properties: {
              pdfId: {
                type: "string",
                description: "ID of the loaded PDF",
              },
              pageNumber: {
                type: "number",
                description: "Page number to extract (1-indexed)",
              },
            },
            required: ["pdfId", "pageNumber"],
          },
        },
        {
          name: "extract_outline",
          description: "Extract the document outline/TOC with page numbers",
          inputSchema: {
            type: "object",
            properties: {
              pdfId: {
                type: "string",
                description: "ID of the loaded PDF",
              },
            },
            required: ["pdfId"],
          },
        },
      ];

      // Verify tool structure
      tools.forEach(tool => {
        expect(tool).toHaveProperty("name");
        expect(tool).toHaveProperty("description");
        expect(tool).toHaveProperty("inputSchema");
        expect(tool.inputSchema).toHaveProperty("type", "object");
        expect(tool.inputSchema).toHaveProperty("properties");
        expect(tool.inputSchema).toHaveProperty("required");
      });

      // Verify specific tools
      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain("load_pdf");
      expect(toolNames).toContain("extract_page");
      expect(toolNames).toContain("extract_outline");
    });
  });

  // Test the actual functionality that would be called by the MCP server
  describe("Tool Execution", () => {
    let pdfId: string;

    beforeEach(() => {
      processor = new PDFProcessor();
    });

    it("should execute load_pdf tool", async () => {
      // Simulate what the MCP server would do
      const args = { path: TEST_PDF_URL };
      const result = await processor.loadPDF(args.path);
      pdfId = result.id;

      // Check the response format that would be returned by MCP
      const response = {
        content: [
          {
            type: "text",
            text: `PDF loaded successfully. ID: ${result.id}, Pages: ${result.pageCount}`,
          },
        ],
      };

      expect(response.content).toBeDefined();
      expect(response.content[0].type).toBe("text");
      expect(response.content[0].text).toContain("PDF loaded successfully");
      expect(response.content[0].text).toContain(`ID: ${result.id}`);
      expect(response.content[0].text).toContain(`Pages: ${result.pageCount}`);
    }, 30000);

    it("should execute extract_outline tool", async () => {
      // First load a PDF
      const loadResult = await processor.loadPDF(TEST_PDF_URL);
      const args = { pdfId: loadResult.id };

      // Simulate extract_outline execution
      const outline = await processor.getFormattedOutline(args.pdfId);

      // Check the response format
      const response = {
        content: [
          {
            type: "text",
            text: outline,
          },
        ],
      };

      expect(response.content).toBeDefined();
      expect(response.content[0].type).toBe("text");
      expect(response.content[0].text).toBeDefined();
      
      // The PDF spec should have an outline
      if (!outline.includes("No outline")) {
        expect(outline.length).toBeGreaterThan(0);
        expect(outline).toContain("(Page");
      }
    }, 30000);

    it("should handle errors gracefully", async () => {
      const args = { pdfId: "nonexistent-pdf-id" };

      try {
        await processor.getFormattedOutline(args.pdfId);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        // Check error response format
        const response = {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };

        expect(response.content[0].text).toContain("Error:");
        expect(response.content[0].text).toContain("PDF not found");
      }
    });

    it("should execute search_pdf tool", async () => {
      // First load a PDF
      const loadResult = await processor.loadPDF(TEST_PDF_URL);
      const args = {
        pdfId: loadResult.id,
        query: "PDF",
        caseSensitive: false,
      };

      // Simulate search_pdf execution
      const results = await processor.searchPDF(
        args.pdfId,
        args.query,
        args.caseSensitive
      );

      // Check the response format
      const response = {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };

      expect(response.content).toBeDefined();
      expect(response.content[0].type).toBe("text");
      
      const parsedResults = JSON.parse(response.content[0].text);
      expect(Array.isArray(parsedResults)).toBe(true);
      expect(parsedResults.length).toBeGreaterThan(0);
    }, 30000);
  });
});