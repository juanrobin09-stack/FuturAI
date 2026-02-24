"use client";

import { useState } from "react";
import { Database, Download, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";
import toast from "react-hot-toast";

export default function DataPage() {
  const { t } = useLanguage();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/user/data-export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "futureai-data-export.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(t.dataPage.exportSuccess);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        toast.success(t.dataPage.deleteSuccess);
        window.location.href = "/";
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">{t.dataPage.title}</span>
          </h1>
          <p className="text-gray-400 mt-2">{t.dataPage.subtitle}</p>
        </div>

        {/* Export */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Download className="w-5 h-5 text-primary-400" />
            {t.dataPage.exportTitle}
          </h2>
          <p className="text-sm text-gray-400 mb-4">{t.dataPage.exportDesc}</p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary flex items-center gap-2"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting ? t.dataPage.exporting : t.dataPage.exportButton}
          </button>
        </div>

        {/* Delete */}
        <div className="card border-red-500/20">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3 text-red-400">
            <Trash2 className="w-5 h-5" />
            {t.dataPage.deleteTitle}
          </h2>
          <p className="text-sm text-gray-400 mb-4">{t.dataPage.deleteDesc}</p>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm"
            >
              {t.dataPage.deleteButton}
            </button>
          ) : (
            <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{t.dataPage.confirmDelete}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all text-sm flex items-center gap-2"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {deleting ? t.dataPage.deleting : t.dataPage.confirmDeleteButton}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="btn-ghost text-sm"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
