import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Stand-in for the real database during the pre-backend phase (see the TODO
// markers in src/pages/api/contact.ts and src/pages/api/careers-apply.ts).
// Everything under apps/web/data/ is gitignored.
const DATA_DIR = path.join(process.cwd(), "data");

/** Appends one JSON record to a gitignored local file under apps/web/data/. */
export async function appendLocalSubmission(fileName: string, record: Record<string, unknown>): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, fileName);

  let existing: unknown[] = [];
  try {
    existing = JSON.parse(await readFile(filePath, "utf-8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  existing.push(record);
  await writeFile(filePath, JSON.stringify(existing, null, 2), "utf-8");
}

/** Writes an uploaded file to a gitignored local directory under apps/web/data/. */
export async function saveLocalUpload(subDir: string, fileName: string, file: File): Promise<string> {
  const dir = path.join(DATA_DIR, subDir);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return filePath;
}
