import pdf from "pdf-parse";
import { readFile } from "fs/promises";
import { createHash } from "crypto";

interface LoadedPDF {
  id: string;
  path: string;
  pageCount: number;
  pages: string[];
  metadata: any;
}

interface SearchResult {
  page: number;
  matches: Array<{
    text: string;
    context: string;
  }>;
}

export class PDFProcessor {
  private loadedPDFs: Map<string, LoadedPDF> = new Map();

  async loadPDF(path: string): Promise<{ id: string; pageCount: number }> {
    try {
      const dataBuffer = await readFile(path);
      const data = await pdf(dataBuffer);
      
      const id = createHash("md5").update(path).digest("hex");
      
      const pages: string[] = [];
      if (data.text) {
        const pageTexts = data.text.split(/\f/);
        pages.push(...pageTexts);
      }
      
      this.loadedPDFs.set(id, {
        id,
        path,
        pageCount: data.numpages,
        pages,
        metadata: data.info,
      });
      
      return { id, pageCount: data.numpages };
    } catch (error) {
      throw new Error(`Failed to load PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async extractPage(pdfId: string, pageNumber: number): Promise<string> {
    const pdf = this.loadedPDFs.get(pdfId);
    if (!pdf) {
      throw new Error("PDF not found. Please load it first.");
    }
    
    if (pageNumber < 1 || pageNumber > pdf.pageCount) {
      throw new Error(`Invalid page number. PDF has ${pdf.pageCount} pages.`);
    }
    
    return pdf.pages[pageNumber - 1] || "";
  }

  async extractRange(
    pdfId: string,
    startPage: number,
    endPage: number
  ): Promise<string> {
    const pdf = this.loadedPDFs.get(pdfId);
    if (!pdf) {
      throw new Error("PDF not found. Please load it first.");
    }
    
    if (startPage < 1 || endPage > pdf.pageCount || startPage > endPage) {
      throw new Error(`Invalid page range. PDF has ${pdf.pageCount} pages.`);
    }
    
    const pages: string[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(`--- Page ${i} ---\n${pdf.pages[i - 1] || ""}`);
    }
    
    return pages.join("\n\n");
  }

  async searchPDF(
    pdfId: string,
    query: string,
    caseSensitive: boolean = false
  ): Promise<SearchResult[]> {
    const pdf = this.loadedPDFs.get(pdfId);
    if (!pdf) {
      throw new Error("PDF not found. Please load it first.");
    }
    
    const results: SearchResult[] = [];
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    
    pdf.pages.forEach((pageText, index) => {
      const searchText = caseSensitive ? pageText : pageText.toLowerCase();
      const matches: Array<{ text: string; context: string }> = [];
      
      let position = 0;
      while ((position = searchText.indexOf(searchQuery, position)) !== -1) {
        const contextStart = Math.max(0, position - 50);
        const contextEnd = Math.min(pageText.length, position + searchQuery.length + 50);
        const context = pageText.substring(contextStart, contextEnd);
        
        matches.push({
          text: pageText.substring(position, position + query.length),
          context: context.trim(),
        });
        
        position += searchQuery.length;
      }
      
      if (matches.length > 0) {
        results.push({
          page: index + 1,
          matches,
        });
      }
    });
    
    return results;
  }

  async getPDFInfo(pdfId: string): Promise<any> {
    const pdf = this.loadedPDFs.get(pdfId);
    if (!pdf) {
      throw new Error("PDF not found. Please load it first.");
    }
    
    return {
      id: pdf.id,
      path: pdf.path,
      pageCount: pdf.pageCount,
      metadata: pdf.metadata,
    };
  }

  async listLoadedPDFs(): Promise<Array<{ id: string; path: string; pageCount: number }>> {
    return Array.from(this.loadedPDFs.values()).map((pdf) => ({
      id: pdf.id,
      path: pdf.path,
      pageCount: pdf.pageCount,
    }));
  }
}