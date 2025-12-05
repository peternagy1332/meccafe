const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validateImageFile(
  buffer: Buffer,
  contentType: string
): ValidationResult {
  if (buffer.length === 0) {
    return { valid: false, error: "File is empty" };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(contentType as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  const isValidImage = validateImageContent(buffer, contentType);
  if (!isValidImage) {
    return {
      valid: false,
      error: "File content does not match declared MIME type",
    };
  }

  return { valid: true };
}

function validateImageContent(buffer: Buffer, contentType: string): boolean {
  const header = buffer.subarray(0, 12);

  if (contentType === "image/jpeg") {
    return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  }

  if (contentType === "image/png") {
    return (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    );
  }

  if (contentType === "image/webp") {
    return (
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46 &&
      header[8] === 0x57 &&
      header[9] === 0x45 &&
      header[10] === 0x42 &&
      header[11] === 0x50
    );
  }

  return false;
}

export function getFileExtension(contentType: string): string {
  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  return extensionMap[contentType] || "jpg";
}
