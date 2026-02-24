"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Users, Rocket, Zap, Target, Award, Flame, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  users: Users,
  rocket: Rocket,
  zap: Zap,
  target: Target,
  award: Award,
  flame: Flame,
  sparkles: Sparkles,
  "thumbs-up": Star,
  code: Zap,
};

interface BadgeUnlockToastProps {
  show: boolean;
  badgeName: string;
  badgeIcon: string;
  badgeDescription?: string;
  onClose: () => void;
}

export default function BadgeUnlockToast({
  show,
  badgeName,
  badgeIcon,
  badgeDescription,
  onClose,
}: BadgeUnlockToastProps) {
  const Icon = iconMap[badgeIcon] || Star;

  useEffect(() => {
    if (show) {
      // Fire confetti
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#0d9488", "#f97316", "#fbbf24"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#0d9488", "#f97316", "#fbbf24"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black pointer-events-auto"
            onClick={onClose}
          />

          {/* Badge card */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              mass: 1,
            }}
            className="relative pointer-events-auto"
          >
            <div className="text-center">
              {/* Sparkle ring */}
              <div className="relative inline-block mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "conic-gradient(from 0deg, transparent, #f97316, transparent, #0d9488, transparent)",
                    padding: "3px",
                    WebkitMask: "radial-gradient(circle, transparent 60%, black 61%)",
                    mask: "radial-gradient(circle, transparent 60%, black 61%)",
                    width: "120px",
                    height: "120px",
                    margin: "-10px",
                  }}
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-500/30 to-primary-500/30 flex items-center justify-center border-2 border-accent-500/50"
                >
                  <Icon className="w-12 h-12 text-accent-400" />
                </motion.div>
              </div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-accent-400 text-sm font-medium tracking-wider uppercase mb-1">
                  Badge Unlocked!
                </p>
                <h2 className="text-2xl font-bold gradient-text mb-2">
                  {badgeName}
                </h2>
                {badgeDescription && (
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    {badgeDescription}
                  </p>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
