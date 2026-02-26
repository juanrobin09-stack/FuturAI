"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, X, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/i18n";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";

interface DeleteSessionButtonProps {
  sessionId: string;
}

export default function DeleteSessionButton({ sessionId }: DeleteSessionButtonProps) {
  const { locale } = useLanguage();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/sandbox/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error");
      }
      toast.success(locale === "fr" ? "Session supprimee" : "Session deleted");
      router.push("/arena");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      toast.error(message);
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Delete trigger */}
      {!showConfirm && (
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          {locale === "fr" ? "Supprimer cette session" : "Delete this session"}
        </button>
      )}

      {/* Inline confirmation */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl bg-red-500/5 border border-red-500/20 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">
                  {locale === "fr" ? "Supprimer cette session ?" : "Delete this session?"}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  {locale === "fr"
                    ? "Cette action est irreversible. Toutes les versions et les commentaires seront perdus."
                    : "This action cannot be undone. All versions and comments will be lost."}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {locale === "fr" ? "Supprimer" : "Delete"}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={deleting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                    {locale === "fr" ? "Annuler" : "Cancel"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
