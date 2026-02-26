"use client";

import { motion } from "framer-motion";
import { type ReactNode, useState, useEffect } from "react";

export default function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before mount, render content immediately (visible) to avoid black screen
  // After mount, Framer Motion handles the animation safely
  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0.01, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ willChange: "opacity, transform" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
