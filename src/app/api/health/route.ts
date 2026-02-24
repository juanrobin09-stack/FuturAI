import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const startTime = Date.now();

export async function GET() {
  try {
    // Test DB connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      version: "7.0.0",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "unhealthy",
        version: "7.0.0",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
