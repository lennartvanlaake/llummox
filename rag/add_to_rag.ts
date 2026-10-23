import { embedDocument } from "./embed";
import { readdir } from "node:fs/promises";
import { statSync } from "node:fs";
import { join } from "node:path";

export async function addFileToRag(
  file: string,
  subject: string,
) {
  const text = await Bun.file(file).text();
  return embedDocument(file, text, subject);
}

export async function addDirectoryToRag(
  directory: string,
  subject: string,
) {
  const dir = await readdir(directory);
  for (const file of dir) {
    const path = join(directory, file)
    const stats = statSync(path)
    if (stats.isDirectory()) {
      await addDirectoryToRag(path, subject);
    } else {
      await addFileToRag(path, subject);
    }
  }
}
