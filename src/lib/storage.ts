import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"]);
const MAX_BYTES = 8 * 1024 * 1024;

/** Stores an uploaded file. Uses Vercel Blob in production, /public/uploads locally. */
export async function storeFile(file: File, folder = "products"): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new Error("Only JPG, PNG, WEBP, AVIF or PDF files are allowed");
  if (file.size > MAX_BYTES) throw new Error("File is larger than 8 MB");
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const name = `${folder}/${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(name, file, { access: "public" });
    return blob.url;
  }
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", "uploads", name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
