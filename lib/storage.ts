import "server-only";
import { randomBytes } from "crypto";
import { supabaseAdmin } from "./supabase";

// Supabase Storage integration.
//
// Buckets are PRIVATE. Uploads and downloads only happen inside server actions
// that have already authorized the caller; downloads are handed out as
// short-lived signed URLs. We never expose a public URL for candidate or
// safer-recruitment documents.

export const BUCKETS = {
  candidateCvs: "candidate-cvs",
  candidateCertificates: "candidate-certificates",
  saferRecruitmentDocuments: "safer-recruitment-documents",
  referenceDocuments: "reference-documents",
  employerDocuments: "employer-documents",
} as const;
export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

export const ALL_BUCKETS: BucketName[] = Object.values(BUCKETS);

// Validation: keep it tight for a safeguarding document store.
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXT = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "doc",
  "docx",
]);

/** Strip path components and unsafe characters from an uploaded file name. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 120);
  return cleaned || "file";
}

function extOf(name: string): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name);
  return m ? m[1].toLowerCase() : "";
}

export type UploadResult = {
  bucket: BucketName;
  path: string;
  originalName: string;
  contentType: string;
  size: number;
};

export type ValidationError = { error: string };

/**
 * Validate + upload a file to a private bucket under a caller-supplied prefix
 * (e.g. a candidate id), returning the stored object metadata. Returns a
 * `{ error }` object on validation failure rather than throwing, so server
 * actions can surface a friendly message.
 */
export async function uploadFile(args: {
  bucket: BucketName;
  prefix: string; // e.g. candidateId — scopes the object path
  file: File;
}): Promise<UploadResult | ValidationError> {
  const { bucket, prefix, file } = args;

  if (!file || file.size === 0) return { error: "No file provided." };
  if (file.size > MAX_FILE_BYTES)
    return { error: "File is larger than 10 MB." };

  const original = sanitizeFileName(file.name);
  const ext = extOf(original);
  const typeOk = ALLOWED_MIME.has(file.type) || ALLOWED_EXT.has(ext);
  if (!typeOk)
    return { error: "Unsupported file type. Use PDF, image or Word document." };

  const safePrefix = prefix.replace(/[^a-zA-Z0-9._-]/g, "");
  const path = `${safePrefix}/${Date.now()}-${randomBytes(4).toString("hex")}-${original}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabaseAdmin()
    .storage.from(bucket)
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) return { error: error.message };

  return {
    bucket,
    path,
    originalName: original,
    contentType: file.type || "application/octet-stream",
    size: file.size,
  };
}

/** A short-lived signed URL for downloading a private object. */
export async function signedUrl(
  bucket: BucketName,
  path: string,
  expiresInSeconds = 60
): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .storage.from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}

export async function deleteFile(bucket: BucketName, path: string): Promise<void> {
  await supabaseAdmin().storage.from(bucket).remove([path]);
}

export function isValidationError(
  r: UploadResult | ValidationError
): r is ValidationError {
  return (r as ValidationError).error !== undefined;
}
