import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { applyRateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

export const dynamic = 'force-dynamic';

// GET /api/user/api-keys — List user's API keys (never return full key)
export async function GET(req: NextRequest) {
  try {
    // Rate limit
    const blocked = applyRateLimit(req, "read");
    if (blocked) return blocked;

    const user = await getCurrentUser();

    const keys = await prisma.userApiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        label: true,
        endpoint: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Return provider status only — never expose decrypted keys
    const safeKeys = keys.map((k) => ({
      id: k.id,
      provider: k.provider,
      label: k.label,
      endpoint: k.endpoint,
      connected: true,
      createdAt: k.createdAt.toISOString(),
      updatedAt: k.updatedAt.toISOString(),
    }));

    return NextResponse.json({ keys: safeKeys });
  } catch (error) {
    console.error("GET /api/user/api-keys error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/user/api-keys — Add or update an API key
export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const blocked = applyRateLimit(req, "write");
    if (blocked) return blocked;

    const user = await getCurrentUser();
    const body = await req.json();
    const { provider, apiKey, label, endpoint } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required" },
        { status: 400 }
      );
    }

    const validProviders = ["openai", "anthropic", "mistral", "google", "stability", "leonardo", "replicate", "kling", "custom"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    if (provider === "custom" && !endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required for custom providers" },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const { encrypted, iv } = encrypt(apiKey);

    // Upsert: update if exists for this provider, create otherwise
    const key = await prisma.userApiKey.upsert({
      where: {
        userId_provider: { userId: user.id, provider },
      },
      update: {
        encryptedKey: encrypted,
        iv,
        label: label || null,
        endpoint: provider === "custom" ? endpoint : null,
      },
      create: {
        userId: user.id,
        provider,
        encryptedKey: encrypted,
        iv,
        label: label || null,
        endpoint: provider === "custom" ? endpoint : null,
      },
    });

    // Audit log
    await createAuditLog({
      action: "api_key_created",
      targetType: "api_key",
      targetId: key.id,
      performedById: user.id,
      metadata: { provider: key.provider },
    });

    return NextResponse.json({
      id: key.id,
      provider: key.provider,
      label: key.label,
      endpoint: key.endpoint,
      connected: true,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/user/api-keys error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/user/api-keys — Delete an API key by provider
export async function DELETE(req: NextRequest) {
  try {
    // Rate limit
    const blocked = applyRateLimit(req, "write");
    if (blocked) return blocked;

    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    await prisma.userApiKey.deleteMany({
      where: { userId: user.id, provider },
    });

    // Audit log
    await createAuditLog({
      action: "api_key_deleted",
      targetType: "api_key",
      targetId: provider,
      performedById: user.id,
      metadata: { provider },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/user/api-keys error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
