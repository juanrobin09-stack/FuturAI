"use client";

import ChallengeEntryForm from "@/components/ChallengeEntryForm";
import ChallengeEntryVote from "@/components/ChallengeEntryVote";

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
  isVoting,
  userProjects,
}: ChallengeDetailClientProps) {
  if (!isOpen && !isVoting) return null;

  return (
    <>
      {isOpen && (
        <ChallengeEntryForm
          challengeId={challengeId}
          userProjects={userProjects}
        />
      )}
    </>
  );
}
