import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const SUPPORTED_PROVIDERS = ["openai", "anthropic", "mistral", "google", "stability", "leonardo", "replicate", "kling", "custom"];

export async function GET() {
  try {
    const user = await getCurrentUser();

    const keys = await prisma.userApiKey.findMany({
      where: { userId: user.id },
      select: { provider: true, label: true, endpoint: true, updatedAt: true },
    });

    const keyMap = new Map(keys.map((k) => [k.provider, k]));

    const providers = SUPPORTED_PROVIDERS.map((name) => {
      const key = keyMap.get(name);
      return {
        name,
        label: key?.label || null,
        endpoint: key?.endpoint || null,
        connected: !!key,
        status: key ? ("ok" as const) : ("not_connected" as const),
        lastChecked: new Date().toISOString(),
      };
    });

    return NextResponse.json({ providers });
  } catch {
    return NextResponse.json({ providers: [] });
  }
}
