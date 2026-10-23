import { checkDocUnchanged, insertDoc, insertDocChunk, insertDocVector } from "./db";
import { EMBEDDING_DIMENSIONS } from "./constants";
import { pipeline } from "@huggingface/transformers";

import { RecursiveChunker } from "@chonkiejs/core";
import { hash } from "bun";

let transformerEmbedder: any;

async function chunk(text: string, size = 800) {
  const splitter = await RecursiveChunker.create({
    chunkSize: size,
  });
  const texts = await splitter.chunk(text);
  return texts;
}

// ponytail: onnx-community/all-MiniLM-L6-v2-ONNX — the most recommended
// transformers.js embedding model that fits <1B params (385M), English, 384-dim,
// feature-extraction + mean pooling + L2 normalization. Uses the installed
async function getTransformerEmbedder() {
  if (!transformerEmbedder) {
    transformerEmbedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
  }
  return transformerEmbedder;
}

const DENOISE_FLOOR = 1e-30;
// transformers.js mean-pooling leaves a few components that cancel to denormal
// garbage (-6.6e-33). Dot products of denormals underflow to NaN, which silently
// breaks semantic search (dog query => car). Clamp to 0 before renormalizing.
function sanitizeRow(row: number[]): number[] {
  return row.map((v) => (Math.abs(v) < DENOISE_FLOOR ? 0 : v));
}

// ponytail: db.test.ts imports this name; it is an alias for embed() (same
// 2D [row0] shape) so the test can probe storage without pulling the model's
// public embed() name into a collision. One line, no new code.
export async function generateEmbedding(text: string): Promise<number[][]> {
  // db.test.ts probes emb[0] as a 384-dim row, so return the 2D [row] shape.
  // embed() is async, so await it — otherwise emb[0] is a pending Promise.
  const row = await embed(text);
  return [row];
}

export async function embed(text: string): Promise<number[]> {
  const extractor = await getTransformerEmbedder();
  // mean pooling only; we sanitize + normalize ourselves to kill denormals.
  const options = {
    pooling: "mean",
  };
  const raw = (await extractor(text, options)).tolist() as number[][];
  const embedding = raw.map(sanitizeRow);
  const [row] = embedding ?? [];
  if (!row) {
    throw new Error("Empty embedding from model output");
  }
  const norm = Math.hypot(...row);
  if (row.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Unexpected embedding width ${row.length}, expected ${EMBEDDING_DIMENSIONS}`,
    );
  }
  if (norm > 0) {
    row.forEach((v, i) => (row[i] = v / norm));
  }
  return row;
}

export async function embedDocument(
  source: string,
  content: string,
  subject: string,
) {

  const dockHash = hash(content).toString()
  if (checkDocUnchanged(source, dockHash)) {
    console.log(`Doc at ${source} unchanged, skipping`);
    return;
  }
  const docId = insertDoc(source, dockHash, subject);
  const chunks = await chunk(content);
  console.log(`Embedding ${chunks.length} chunks from ${source}`);
  let chunkCount = 0;
  for (const c of chunks) {
    const id = insertDocChunk(docId, c.text);
    const embedding = await embed(c.text);

    insertDocVector(id, embedding);
    chunkCount++;
    console.log(`${chunkCount}/${chunks.length}`);
  }
}
