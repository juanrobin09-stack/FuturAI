import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://futurai.space";

  // ─── Static pages ────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/ideas`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/challenges`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/arena`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/forum`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/map`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/manifesto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // ─── Dynamic: Ideas ──────────────────────────────────
  let ideaPages: MetadataRoute.Sitemap = [];
  try {
    const ideas = await prisma.idea.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
    ideaPages = ideas.map((idea) => ({
      url: `${baseUrl}/ideas/${idea.id}`,
      lastModified: idea.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {}

  // ─── Dynamic: Projects ───────────────────────────────
  let projectPages: MetadataRoute.Sitemap = [];
  try {
    const projects = await prisma.project.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
    projectPages = projects.map((project) => ({
      url: `${baseUrl}/projects/${project.id}`,
      lastModified: project.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {}

  // ─── Dynamic: Challenges ─────────────────────────────
  let challengePages: MetadataRoute.Sitemap = [];
  try {
    const challenges = await prisma.challenge.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    challengePages = challenges.map((c) => ({
      url: `${baseUrl}/challenges/${c.id}`,
      lastModified: c.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {}

  return [...staticPages, ...ideaPages, ...projectPages, ...challengePages];
}
