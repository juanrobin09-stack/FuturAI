import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { executeAI } from "@/lib/ai-execute";

export const dynamic = 'force-dynamic';

export const maxDuration = 300; // Fluid Compute — up to 300s on Hobby

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    const body = await req.json();
    const { prompt, provider, mode } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }
    if (!mode) {
      return NextResponse.json({ error: "Mode is required" }, { status: 400 });
    }

    const result = await executeAI(user.id, provider, prompt.trim(), mode);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, provider: result.provider },
        { status: result.error === "no_api_key" ? 400 : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      result: result.result,
      resultUrl: result.resultUrl || null,
      provider: result.provider,
      durationMs: result.durationMs,
    });
  } catch (error: unknown) {
    console.error("Quick execute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
