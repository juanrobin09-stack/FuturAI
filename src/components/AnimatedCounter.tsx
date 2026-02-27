"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: string;
  className?: string;
}

/**
 * Animates a number from 0 to value when it comes into view.
 * Non-numeric values (like "AES-256") are displayed as-is with a fade.
 */
export default function AnimatedCounter({ value, className = "" }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const numericValue = parseInt(value, 10);
  const isNumeric = !isNaN(numericValue) && String(numericValue) === value;

  const [display, setDisplay] = useState(isNumeric ? "0" : value);

  useEffect(() => {
    if (!inView || !isNumeric) {
      if (inView && !isNumeric) setDisplay(value);
      return;
    }
    const duration = 1000;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(String(Math.round(eased * numericValue)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, numericValue, isNumeric, value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
