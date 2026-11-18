import { createDb } from "../shared/db.ts";

export const { all, get, readQuery, run, setupDatabase } = createDb({
  queriesDir: new URL("./queries/", import.meta.url),
  migrationsDir: new URL("./migrations/", import.meta.url),
});
