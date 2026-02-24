"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useLanguage } from "@/i18n";

interface ChallengeCountdownProps {
  endDate: string;
}

export default function ChallengeCountdown({ endDate }: ChallengeCountdownProps) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = Math.max(0, end - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total: diff };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDate]);

  if (timeLeft.total <= 0) {
    return (
      <div className="glass p-4 rounded-xl text-center mb-4">
        <p className="text-sm text-gray-400">{t.challenges.challengeEnded}</p>
      </div>
    );
  }

  const units = [
    { label: t.challenges.days, value: timeLeft.days },
    { label: t.challenges.hours, value: timeLeft.hours },
    { label: t.challenges.min, value: timeLeft.minutes },
    { label: t.challenges.sec, value: timeLeft.seconds },
  ];

  return (
    <div className="glass p-4 rounded-xl mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-accent-400" />
        <span className="text-sm font-medium text-gray-300">{t.challenges.timeRemaining}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {units.map((unit) => (
          <div key={unit.label} className="text-center">
            <div className="bg-gray-800/80 rounded-lg py-2 px-1 border border-white/5">
              <p className="text-xl sm:text-2xl font-bold tabular-nums text-white">
                {String(unit.value).padStart(2, "0")}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{unit.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
