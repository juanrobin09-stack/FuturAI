import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAndAwardBadges } from "@/lib/badges";
import { getCurrentUser, getAuthUserId } from "@/lib/auth";

// GET /api/ideas - List ideas with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const country = searchParams.get("country");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "recent";
    const hasLocation = searchParams.get("hasLocation");

    // Get current user ID for vote tracking (optional, won't fail)
    let currentUserId: string | null = null;
    try {
      const authId = await getAuthUserId();
      if (authId) {
        const user = await getCurrentUser();
        currentUserId = user.id;
      }
    } catch {}

    const where: Record<string, unknown> = {};

    if (category) where.category = category;
    if (country) where.country = { contains: country, mode: "insensitive" };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (hasLocation === "true") {
      where.latitude = { not: null };
      where.longitude = { not: null };
    }

    const ideas = await prisma.idea.findMany({
      where,
      include: {
        author: { select: { username: true, avatarUrl: true } },
        votes: { select: { value: true, userId: true } },
      },
      orderBy: sort === "top" ? { createdAt: "desc" } : { createdAt: "desc" },
      take: 50,
    });

    // Compute scores, user votes, and sort
    const ideasWithScores = ideas
      .map((idea) => ({
        ...idea,
        score: idea.votes.reduce((sum, v) => sum + v.value, 0),
        userVote: currentUserId
          ? (idea.votes.find((v) => v.userId === currentUserId)?.value ?? 0)
          : 0,
        createdAt: idea.createdAt.toISOString(),
        updatedAt: idea.updatedAt.toISOString(),
      }))
      .sort((a, b) => (sort === "top" ? b.score - a.score : 0));

    return NextResponse.json({ ideas: ideasWithScores });
  } catch (error) {
    console.error("GET /api/ideas error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/ideas - Create a new idea
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    const body = await req.json();
    const { title, description, category, country, imageUrl } = body;

    if (!title?.trim() || !description?.trim() || !category) {
      return NextResponse.json(
        { error: "Titre, description et categorie requis" },
        { status: 400 }
      );
    }

    const idea = await prisma.idea.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        country: country || null,
        imageUrl: imageUrl || null,
        authorId: user.id,
      },
      include: {
        author: { select: { username: true } },
      },
    });

    // Log activity for real-time feed
    await prisma.activity
      .create({
        data: {
          type: "contribution",
          message: `${user.username} submitted idea: "${title.trim()}"`,
          metadata: JSON.stringify({ ideaId: idea.id }),
          userId: user.id,
        },
      })
      .catch(() => {});

    // Check for badge awards
    await checkAndAwardBadges(user.id);

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error("POST /api/ideas error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
