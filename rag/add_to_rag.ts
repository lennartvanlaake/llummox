import { embedDocument } from "./embed";
import { readdir } from "node:fs/promises";
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
    try {

      await addFileToRag(join(directory, file), subject);
    } catch (e) {
      await addDirectoryToRag(join(directory, file), subject);
    }
  }
}
