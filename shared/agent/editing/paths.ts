import { chmod, mkdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";

/** Resolve a model-supplied path and keep it lexically inside cwd. */
export function resolveInside(cwd: string, file: string): string {
  const path = resolve(cwd, file);
  const rel = relative(cwd, path);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Path escapes cwd: ${file}`);
  }
  return path;
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Write through a sibling temp file so a failed write cannot truncate the target. */
export async function writeTextAtomic(path: string, content: string): Promise<void> {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true });

  const existing = await stat(path).catch(() => undefined);
  const temp = join(
    dir,
    `.${basename(path)}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`,
  );

  try {
    await writeFile(temp, content, "utf8");
    if (existing) {
      await chmod(temp, existing.mode);
    }
    try {
      await rename(temp, path);
    } catch {
      // Some platforms cannot replace an existing file with rename.
      await writeFile(path, content, "utf8");
      await unlink(temp).catch(() => undefined);
    }
  } catch (error) {
    await unlink(temp).catch(() => undefined);
    throw error;
  }
}
