import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// POST /api/user/consent — Record user consent
export async function POST() {
  try {
    const user = await getCurrentUser();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        consentGiven: true,
        consentAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/user/consent error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
