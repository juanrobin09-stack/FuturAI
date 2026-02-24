import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/ideas/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { username: true, avatarUrl: true, country: true } },
        votes: { select: { value: true, userId: true } },
        sandbox: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!idea) {
      return NextResponse.json({ error: "Idee non trouvee" }, { status: 404 });
    }

    const score = idea.votes.reduce((sum, v) => sum + v.value, 0);

    return NextResponse.json({
      ...idea,
      score,
      createdAt: idea.createdAt.toISOString(),
      updatedAt: idea.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/ideas/:id error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/ideas/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // Handle sandbox result save
    if (body.sandboxResult) {
      const result = await prisma.sandboxResult.create({
        data: {
          ideaId: params.id,
          type: body.sandboxResult.type,
          prompt: body.sandboxResult.prompt,
          resultText: body.sandboxResult.resultText || null,
          resultUrl: body.sandboxResult.resultUrl || null,
        },
      });
      return NextResponse.json(result);
    }

    // Update idea fields
    const updateData: Record<string, unknown> = {};
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.category) updateData.category = body.category;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;

    const idea = await prisma.idea.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(idea);
  } catch (error) {
    console.error("PATCH /api/ideas/:id error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/ideas/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.idea.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/ideas/:id error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
