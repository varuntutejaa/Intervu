import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CHUNK_STRATEGIES, type ChunkStrategyKey } from "./config.js";
import type { PageText } from "./pdfLoader.js";
import type { IndexedChunk } from "./types.js";

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

// chunkSize/chunkOverlap are interpreted in words (not characters) by supplying
// a word-counting lengthFunction, so they match the assignment's "~300 words" spec exactly.
function createSplitter(strategy: ChunkStrategyKey): RecursiveCharacterTextSplitter {
  const def = CHUNK_STRATEGIES[strategy];
  return new RecursiveCharacterTextSplitter({
    chunkSize: def.chunkSizeWords,
    chunkOverlap: def.chunkOverlapWords,
    lengthFunction: countWords,
  });
}

interface PageOffset {
  page: number;
  start: number;
}

const PAGE_SEPARATOR = "\n\n";

// Finds the page whose text contains the given character offset into the
// document's concatenated text. pageOffsets is sorted ascending by `start`.
function locatePage(offset: number, pageOffsets: PageOffset[]): number {
  let page = pageOffsets[0]?.page ?? 1;
  for (const p of pageOffsets) {
    if (p.start > offset) break;
    page = p.page;
  }
  return page;
}

// Chunks a whole document's text in one pass (rather than capping each chunk
// at a single page's worth of text), then maps each resulting chunk back to
// the page it starts on via character offsets. This lets a chunk legitimately
// span page content up to the configured strategy size, instead of silently
// truncating chunks at page boundaries.
export async function chunkPages(
  pages: PageText[],
  strategy: ChunkStrategyKey,
): Promise<IndexedChunk[]> {
  if (pages.length === 0) return [];

  const source = pages[0].source;
  const pageOffsets: PageOffset[] = [];
  let cursor = 0;
  const parts: string[] = [];
  for (const page of pages) {
    pageOffsets.push({ page: page.page, start: cursor });
    parts.push(page.text);
    cursor += page.text.length + PAGE_SEPARATOR.length;
  }
  const fullText = parts.join(PAGE_SEPARATOR);

  const splitter = createSplitter(strategy);
  const pieces = await splitter.splitText(fullText);

  const chunks: IndexedChunk[] = [];
  let searchFrom = 0;
  let chunkId = 0;
  for (const piece of pieces) {
    const idx = fullText.indexOf(piece, searchFrom);
    const offset = idx === -1 ? searchFrom : idx;
    chunks.push({
      text: piece,
      metadata: { source, page: locatePage(offset, pageOffsets), chunk: chunkId },
    });
    chunkId += 1;
    if (idx !== -1) searchFrom = idx;
  }

  return chunks;
}
