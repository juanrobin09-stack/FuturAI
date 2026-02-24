import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

interface AiClientConfig {
  provider: string;
  apiKey: string;
  endpoint?: string | null;
}

/**
 * Get the user's decrypted API key for a given provider.
 * Returns null if the user has no key for that provider.
 */
export async function getUserAiConfig(
  userId: string,
  provider: string
): Promise<AiClientConfig | null> {
  const record = await prisma.userApiKey.findUnique({
    where: {
      userId_provider: { userId, provider },
    },
  });

  if (!record) return null;

  const apiKey = decrypt(record.encryptedKey, record.iv);

  return {
    provider: record.provider,
    apiKey,
    endpoint: record.endpoint,
  };
}

/**
 * Check if a user has any API key configured.
 */
export async function userHasApiKey(userId: string): Promise<boolean> {
  const count = await prisma.userApiKey.count({
    where: { userId },
  });
  return count > 0;
}
