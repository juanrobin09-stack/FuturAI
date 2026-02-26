"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";
import toast from "react-hot-toast";

interface DeleteSessionButtonProps {
  sessionId: string;
}

export default function DeleteSessionButton({ sessionId }: DeleteSessionButtonProps) {
  const { locale } = useLanguage();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const msg = locale === "fr"
      ? "Supprimer cette session ? Cette action est irreversible."
      : "Delete this session? This action cannot be undone.";
    if (!confirm(msg)) return;

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
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
    >
      {deleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
      {locale === "fr" ? "Supprimer cette session" : "Delete this session"}
    </button>
  );
}
