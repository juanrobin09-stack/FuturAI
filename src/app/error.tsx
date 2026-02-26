"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">
        Une erreur est survenue
      </h2>
      <p className="text-gray-400 text-sm mb-6 text-center max-w-md">
        La page n&apos;a pas pu se charger correctement. Essayez de recharger.
      </p>
      <button
        onClick={reset}
        className="btn-primary flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Recharger la page
      </button>
    </div>
  );
}
