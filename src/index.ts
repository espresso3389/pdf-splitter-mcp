#!/usr/bin/env bun

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PDFProcessor } from "./pdf-processor.js";

const server = new Server(
  {
    name: "pdf-splitter-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const pdfProcessor = new PDFProcessor();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "load_pdf",
        description: "Load a PDF file into memory for processing",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to the PDF file",
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
        name: "extract_range",
        description: "Extract content from a range of pages",
        inputSchema: {
          type: "object",
          properties: {
            pdfId: {
              type: "string",
              description: "ID of the loaded PDF",
            },
            startPage: {
              type: "number",
              description: "Starting page number (1-indexed)",
            },
            endPage: {
              type: "number",
              description: "Ending page number (1-indexed)",
            },
          },
          required: ["pdfId", "startPage", "endPage"],
        },
      },
      {
        name: "search_pdf",
        description: "Search for text within the PDF",
        inputSchema: {
          type: "object",
          properties: {
            pdfId: {
              type: "string",
              description: "ID of the loaded PDF",
            },
            query: {
              type: "string",
              description: "Text to search for",
            },
            caseSensitive: {
              type: "boolean",
              description: "Whether the search should be case sensitive",
              default: false,
            },
          },
          required: ["pdfId", "query"],
        },
      },
      {
        name: "get_pdf_info",
        description: "Get metadata and information about a loaded PDF",
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
      {
        name: "list_loaded_pdfs",
        description: "List all currently loaded PDFs",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "load_pdf": {
        const { path } = args as { path: string };
        const result = await pdfProcessor.loadPDF(path);
        return {
          content: [
            {
              type: "text",
              text: `PDF loaded successfully. ID: ${result.id}, Pages: ${result.pageCount}`,
            },
          ],
        };
      }

      case "extract_page": {
        const { pdfId, pageNumber } = args as {
          pdfId: string;
          pageNumber: number;
        };
        const content = await pdfProcessor.extractPage(pdfId, pageNumber);
        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      }

      case "extract_range": {
        const { pdfId, startPage, endPage } = args as {
          pdfId: string;
          startPage: number;
          endPage: number;
        };
        const content = await pdfProcessor.extractRange(
          pdfId,
          startPage,
          endPage
        );
        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      }

      case "search_pdf": {
        const { pdfId, query, caseSensitive = false } = args as {
          pdfId: string;
          query: string;
          caseSensitive?: boolean;
        };
        const results = await pdfProcessor.searchPDF(
          pdfId,
          query,
          caseSensitive
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case "get_pdf_info": {
        const { pdfId } = args as { pdfId: string };
        const info = await pdfProcessor.getPDFInfo(pdfId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      case "list_loaded_pdfs": {
        const pdfs = await pdfProcessor.listLoadedPDFs();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(pdfs, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PDF Splitter MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});