import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET — public audit log (paginated)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          performedBy: { select: { id: true, username: true, role: true } },
        },
      }),
      prisma.auditLog.count(),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
        performedBy: log.performedBy,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json({ logs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  }
}
