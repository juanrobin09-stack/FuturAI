import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/challenges - List challenges with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const category = searchParams.get("category");
    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (category) where.impactArea = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const challenges = await prisma.challenge.findMany({
      where,
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const serialized = challenges.map((challenge) => ({
      ...challenge,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      createdAt: challenge.createdAt.toISOString(),
    }));

    return NextResponse.json({ challenges: serialized });
  } catch (error) {
    console.error("GET /api/challenges error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/challenges - Create a new challenge (requires auth)
export async function POST(req: NextRequest) {
  try {
    await getCurrentUser();

    const body = await req.json();
    const {
      title, description, category, type, prize, startDate, endDate,
      measurableGoal, evaluationCriteria, impactArea, sdgAlignment, context,
      // V7 fields
      measurableOutcome, geographicScope, estimatedBudget,
      implementationPartnerNeeded, verificationMethod,
    } = body;

    if (!title?.trim() || !description?.trim() || !endDate) {
      return NextResponse.json(
        { error: "Titre, description et date de fin requis" },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category || null,
        type: type || "weekly",
        prize: prize || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: new Date(endDate),
        measurableGoal: measurableGoal?.trim() || null,
        evaluationCriteria: evaluationCriteria?.trim() || null,
        impactArea: impactArea || null,
        sdgAlignment: sdgAlignment?.trim() || null,
        context: context?.trim() || null,
        // V7 fields
        measurableOutcome: measurableOutcome?.trim() || null,
        geographicScope: geographicScope || null,
        estimatedBudget: estimatedBudget?.trim() || null,
        implementationPartnerNeeded: implementationPartnerNeeded === true,
        verificationMethod: verificationMethod?.trim() || null,
      },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...challenge,
        startDate: challenge.startDate.toISOString(),
        endDate: challenge.endDate.toISOString(),
        createdAt: challenge.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/challenges error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
