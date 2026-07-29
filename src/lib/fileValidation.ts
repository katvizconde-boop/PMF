/**
 * Server-side file type validation by reading magic bytes.
 *
 * Client-supplied MIME types can be spoofed; relying on `file.type` alone is unsafe.
 * This module sniffs the actual content to verify the format matches what's claimed.
 */

/** File-type "signatures" — initial bytes of common formats. */
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  "image/png":  [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  "image/jpeg": [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
  "image/gif":  [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
  "image/webp": [{ offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }],
  "application/pdf": [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  "application/zip": [
    { offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04] },
    { offset: 0, bytes: [0x50, 0x4B, 0x05, 0x06] },
    { offset: 0, bytes: [0x50, 0x4B, 0x07, 0x08] },
  ],
  // docx, xlsx, pptx are all zip-based — verify zip header first, then check internal structure if needed
};

/** Check if the buffer starts with the magic bytes for `mimeType`. */
export function isFileType(buf: Buffer, mimeType: string): boolean {
  const sigs = MAGIC_BYTES[mimeType];
  if (!sigs) return false;
  for (const sig of sigs) {
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buf[sig.offset + i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/** Detect the actual MIME type by checking magic bytes. Returns null if unknown. */
export function detectMimeType(buf: Buffer): string | null {
  for (const mime of Object.keys(MAGIC_BYTES)) {
    if (isFileType(buf, mime)) return mime;
  }
  return null;
}

/**
 * Validate a data URL (e.g., for signatures).
 *
 *   - Must be a data: URL
 *   - Must declare PNG or JPEG MIME type
 *   - Decoded bytes must actually match PNG or JPEG magic bytes
 *   - SVG and HTML data URLs are explicitly REJECTED (XSS risk)
 *
 * Returns the actual detected MIME type or throws.
 */
export function validateImageDataUrl(dataUrl: string): "image/png" | "image/jpeg" {
  if (!dataUrl || typeof dataUrl !== "string") {
    throw new Error("Invalid data URL");
  }
  if (!dataUrl.startsWith("data:")) {
    throw new Error("Must be a data URL");
  }

  // Match `data:<mime>;base64,<payload>`
  const m = dataUrl.match(/^data:([^;,]+)(;base64)?,(.+)$/);
  if (!m) throw new Error("Malformed data URL");

  const claimedMime = m[1].toLowerCase();
  const isBase64 = !!m[2];
  const payload = m[3];

  // Explicit denylist — even before we look at bytes
  if (claimedMime.includes("svg") || claimedMime.includes("html") || claimedMime.includes("xml") || claimedMime.includes("javascript")) {
    throw new Error("Unsupported image type. Only PNG or JPEG allowed.");
  }

  if (claimedMime !== "image/png" && claimedMime !== "image/jpeg" && claimedMime !== "image/jpg") {
    throw new Error("Unsupported image type. Only PNG or JPEG allowed.");
  }

  // Decode payload and verify magic bytes
  let buf: Buffer;
  try {
    buf = isBase64
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "binary");
  } catch {
    throw new Error("Could not decode data URL payload");
  }

  if (buf.length < 8) {
    throw new Error("Image data too short to be valid");
  }

  if (isFileType(buf, "image/png")) return "image/png";
  if (isFileType(buf, "image/jpeg")) return "image/jpeg";

  throw new Error("File content does not match a valid PNG or JPEG image");
}

/**
 * Validate an uploaded File (or Buffer) is one of the allowed types.
 * Allowed: PDF, PNG, JPEG, GIF, plus zip-based office docs (docx, xlsx, pptx).
 */
export function validateDocumentFile(
  buf: Buffer,
  claimedMime: string | null | undefined,
  allowedMimes: string[] = ["application/pdf", "image/png", "image/jpeg", "image/gif", "application/zip"]
): { mime: string } {
  if (!buf || buf.length === 0) throw new Error("Empty file");

  const detected = detectMimeType(buf);
  if (!detected) {
    throw new Error("Could not identify file type. Allowed: PDF, PNG, JPEG, GIF, DOCX, XLSX, PPTX.");
  }

  // For zip-based files, the magic detects "application/zip" — accept and trust
  // the client's claimed mime if it's a known office format.
  if (detected === "application/zip" && claimedMime) {
    const officeMimes = new Set([
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ]);
    if (officeMimes.has(claimedMime)) {
      return { mime: claimedMime };
    }
  }

  if (!allowedMimes.includes(detected)) {
    throw new Error(`Files of type ${detected} are not allowed. Allowed: ${allowedMimes.join(", ")}`);
  }

  return { mime: detected };
}
