import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

// Dev-only fallback key — used ONLY when ENCRYPTION_KEY env var is not set.
// In production, ENCRYPTION_KEY must be a 64-char hex string set in environment.
const DEV_FALLBACK_KEY = "0".repeat(64);

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (key && key.length === 64) {
    return Buffer.from(key, "hex");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ENCRYPTION_KEY must be set in production (64 hex chars). Generate with: openssl rand -hex 32"
    );
  }
  return Buffer.from(DEV_FALLBACK_KEY, "hex");
}

export function encrypt(text: string): { encrypted: string; iv: string } {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encrypted: encrypted + ":" + authTag,
    iv: iv.toString("hex"),
  };
}

export function decrypt(encrypted: string, iv: string): string {
  const key = getEncryptionKey();
  const [encData, authTag] = encrypted.split(":");

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
