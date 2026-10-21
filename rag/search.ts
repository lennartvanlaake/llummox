import { dbSearch } from "./db";
import { embed } from "./embed";

export async function searchRag(
  query: string,
  maxResults: number = 5,
  subject?: string,
) {
  const embedded = await embed(query);
  return dbSearch(embedded, maxResults, subject);
}
