"use client";

import { useState, useEffect } from "react";
import { Shield, Scale, Eye, FileCheck, Clock, Users, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n";

interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  performedBy: { id: string; username: string; role: string };
  createdAt: string;
}

const ACTION_LABELS: Record<string, { en: string; fr: string; icon: string }> = {
  role_change: { en: "Role Changed", fr: "Role modifie", icon: "👤" },
  challenge_created: { en: "Challenge Created", fr: "Challenge cree", icon: "🏆" },
  evaluation_submitted: { en: "Evaluation Submitted", fr: "Evaluation soumise", icon: "📝" },
  user_verified: { en: "User Verified", fr: "Utilisateur verifie", icon: "✅" },
  user_deleted: { en: "User Deleted", fr: "Utilisateur supprime", icon: "🗑️" },
  conflict_declared: { en: "Conflict Declared", fr: "Conflit declare", icon: "⚖️" },
};

export default function GovernancePage() {
  const { t, locale } = useLanguage();
  const isFr = locale === "fr";
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/governance/audit-log?limit=30")
      .then((r) => r.json())
      .then((data) => setAuditLogs(data.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pillars = [
    {
      icon: Eye,
      title: isFr ? "Transparence Totale" : "Full Transparency",
      description: isFr
        ? "Toute evaluation, decision et changement de role est consigne dans un registre public immuable."
        : "Every evaluation, decision, and role change is recorded in a public, immutable audit log.",
    },
    {
      icon: Scale,
      title: isFr ? "Evaluation Equitable" : "Fair Evaluation",
      description: isFr
        ? "Les experts declarent les conflits d'interet. Les evaluations institutionnelles sont ponderees 1.5x, les volontaires 1.0x."
        : "Experts declare conflicts of interest. Institutional evaluations are weighted 1.5x, volunteers 1.0x.",
    },
    {
      icon: Shield,
      title: isFr ? "Protection des Donnees" : "Data Protection",
      description: isFr
        ? "Conforme RGPD. Export de donnees complet, suppression sur demande, consentement explicite requis."
        : "GDPR compliant. Full data export, deletion on request, explicit consent required.",
    },
    {
      icon: Users,
      title: isFr ? "Gouvernance Ouverte" : "Open Governance",
      description: isFr
        ? "Les roles (NGO, Recherche, Municipalite) sont verifies par l'equipe d'administration. Tout changement est audite."
        : "Roles (NGO, Research, Municipality) are verified by the admin team. Every change is audited.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-primary-400" />
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
            {isFr ? "Gouvernance & Confiance" : "Governance & Trust"}
          </h1>
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto">
          {isFr
            ? "FutureAI fonctionne selon des principes de transparence, d'equite et de responsabilite."
            : "FutureAI operates on principles of transparency, fairness, and accountability."}
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pillars.map((pillar, i) => (
          <motion.div
            key={pillar.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card"
          >
            <pillar.icon className="w-6 h-6 text-primary-400 mb-3" />
            <h3 className="font-semibold mb-2">{pillar.title}</h3>
            <p className="text-sm text-gray-400">{pillar.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Ethical AI Statement */}
      <div className="card border-primary-500/20">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <FileCheck className="w-5 h-5 text-primary-400" />
          {isFr ? "Declaration Ethique IA" : "Ethical AI Statement"}
        </h2>
        <div className="text-sm text-gray-300 space-y-2">
          <p>
            {isFr
              ? "FutureAI s'engage a utiliser l'intelligence artificielle de maniere responsable et ethique :"
              : "FutureAI is committed to using artificial intelligence responsibly and ethically:"}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>{isFr ? "Aucune decision automatisee sans supervision humaine" : "No automated decisions without human oversight"}</li>
            <li>{isFr ? "Les cles API appartiennent aux utilisateurs — aucune donnee ne transite par nos serveurs" : "API keys belong to users — no data flows through our servers"}</li>
            <li>{isFr ? "Tous les algorithmes de scoring sont publics et verifiables" : "All scoring algorithms are public and verifiable"}</li>
            <li>{isFr ? "Aucune discrimination dans l'acces ou l'evaluation" : "No discrimination in access or evaluation"}</li>
            <li>{isFr ? "Droit a l'oubli garanti (suppression complete des donnees)" : "Right to be forgotten guaranteed (complete data deletion)"}</li>
          </ul>
        </div>
      </div>

      {/* Conflict of Interest */}
      <div className="card">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-accent-400" />
          {isFr ? "Conflits d'Interet" : "Conflict of Interest"}
        </h2>
        <p className="text-sm text-gray-400 mb-3">
          {isFr
            ? "Les membres du panel expert sont tenus de declarer tout conflit d'interet avant d'evaluer une soumission. Les declarations sont publiques et associees au challenge concerne."
            : "Expert panel members are required to declare any conflict of interest before evaluating a submission. Declarations are public and associated with the relevant challenge."}
        </p>
        <p className="text-sm text-gray-400">
          {isFr
            ? "Toute evaluation ou le conflit est declare est marquee dans le rapport d'export."
            : "Any evaluation where a conflict is declared is flagged in the export report."}
        </p>
      </div>

      {/* Public Audit Log */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-400" />
          {isFr ? "Registre d'Audit Public" : "Public Audit Log"}
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="space-y-2">
            {auditLogs.map((log) => {
              const actionConf = ACTION_LABELS[log.action] || { en: log.action, fr: log.action, icon: "📋" };
              return (
                <div key={log.id} className="card py-3 flex items-center gap-3">
                  <span className="text-lg">{actionConf.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {isFr ? actionConf.fr : actionConf.en}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.performedBy.username} · {log.targetType}/{log.targetId.slice(0, 8)}...
                      · {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-8">
            <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {isFr ? "Aucune entree dans le registre pour le moment." : "No audit log entries yet."}
            </p>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-4 text-sm">
        <a href="/public-methodology" className="text-primary-400 hover:text-primary-300 transition-colors">
          {isFr ? "Methodologie de notation →" : "Scoring methodology →"}
        </a>
        <a href="/privacy" className="text-primary-400 hover:text-primary-300 transition-colors">
          {isFr ? "Politique de confidentialite →" : "Privacy policy →"}
        </a>
        <a href="/data" className="text-primary-400 hover:text-primary-300 transition-colors">
          {isFr ? "Exporter mes donnees →" : "Export my data →"}
        </a>
      </div>
    </div>
  );
}
