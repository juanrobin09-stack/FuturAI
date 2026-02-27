/**
 * Calculate profile completion percentage.
 * 5 fields = 20% each: username, bio, country, avatarUrl, socialLink (github OR linkedin)
 */
export function getProfileCompletion(user: {
  username?: string | null;
  bio?: string | null;
  country?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
}): { percent: number; missing: string[]; complete: boolean } {
  const fields: { key: string; filled: boolean }[] = [
    { key: "username", filled: !!user.username && user.username !== "DemoUser" },
    { key: "bio", filled: !!user.bio },
    { key: "country", filled: !!user.country },
    { key: "avatarUrl", filled: !!user.avatarUrl },
    { key: "socialLink", filled: !!user.githubUrl || !!user.linkedinUrl },
  ];

  const filledCount = fields.filter((f) => f.filled).length;
  const missing = fields.filter((f) => !f.filled).map((f) => f.key);

  return {
    percent: Math.round((filledCount / fields.length) * 100),
    missing,
    complete: filledCount === fields.length,
  };
}
