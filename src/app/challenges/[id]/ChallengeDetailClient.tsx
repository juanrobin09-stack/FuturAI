"use client";

import ChallengeEntryForm from "@/components/ChallengeEntryForm";

interface UserProject {
  id: string;
  title: string;
}

interface ChallengeDetailClientProps {
  challengeId: string;
  isOpen: boolean;
  isVoting: boolean;
  userProjects: UserProject[];
}

export default function ChallengeDetailClient({
  challengeId,
  isOpen,
  userProjects,
}: ChallengeDetailClientProps) {
  if (!isOpen) return null;

  return (
    <ChallengeEntryForm
      challengeId={challengeId}
      userProjects={userProjects}
    />
  );
}
