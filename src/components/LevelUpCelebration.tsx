"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp } from "lucide-react";
import confetti from "canvas-confetti";

interface LevelUpCelebrationProps {
  show: boolean;
  level: number;
  levelName: string;
  onClose: () => void;
}

export default function LevelUpCelebration({
  show,
  level,
  levelName,
  onClose,
}: LevelUpCelebrationProps) {
  useEffect(() => {
    if (show) {
      // Fire celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#0d9488", "#f97316", "#fbbf24", "#a855f7"],
      });

      const timer = setTimeout(onClose, 3000);
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black pointer-events-auto"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
            className="relative text-center pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-4"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center mx-auto shadow-2xl shadow-accent-500/30">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-accent-400 text-sm font-medium tracking-wider uppercase mb-2">
                Level Up!
              </p>
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: [0.5, 1.1, 1] }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <span className="text-6xl font-black gradient-text">{level}</span>
              </motion.div>
              <p className="text-xl font-bold text-white mt-2">{levelName}</p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
