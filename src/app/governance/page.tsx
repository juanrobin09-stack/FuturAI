"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Scale,
  Eye,
  FileCheck,
  Clock,
  Users,
  AlertTriangle,
  Loader2,
  Vote,
  Landmark,
  BookOpen,
  Handshake,
  ChevronDown,
  ChevronUp,
  Gavel,
  Globe,
  GraduationCap,
  Building2,
  UserCheck,
  Workflow,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n";
import Link from "next/link";

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
  role_change: { en: "Role Changed", fr: "R\u00f4le modifi\u00e9", icon: "\ud83d\udc64" },
  challenge_created: { en: "Challenge Created", fr: "Challenge cr\u00e9\u00e9", icon: "\ud83c\udfc6" },
  evaluation_submitted: { en: "Evaluation Submitted", fr: "\u00c9valuation soumise", icon: "\ud83d\udcdd" },
  user_verified: { en: "User Verified", fr: "Utilisateur v\u00e9rifi\u00e9", icon: "\u2705" },
  user_deleted: { en: "User Deleted", fr: "Utilisateur supprim\u00e9", icon: "\ud83d\uddd1\ufe0f" },
  conflict_declared: { en: "Conflict Declared", fr: "Conflit d\u00e9clar\u00e9", icon: "\u2696\ufe0f" },
};

function ExpandableSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary-400 shrink-0" />
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-4 text-sm text-gray-400 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GovernancePage() {
  const { locale } = useLanguage();
  const fr = locale === "fr";
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
      title: fr ? "Transparence Totale" : "Full Transparency",
      description: fr
        ? "Toute \u00e9valuation, d\u00e9cision et changement de r\u00f4le est consign\u00e9 dans un registre public immuable. Chaque action d\u2019un administrateur ou expert est tra\u00e7\u00e9e."
        : "Every evaluation, decision, and role change is recorded in a public, immutable audit log. Every admin or expert action is traceable.",
    },
    {
      icon: Scale,
      title: fr ? "\u00c9valuation \u00c9quitable" : "Fair Evaluation",
      description: fr
        ? "Les experts d\u00e9clarent les conflits d\u2019int\u00e9r\u00eat. Les \u00e9valuations institutionnelles sont pond\u00e9r\u00e9es 1.5x, les volontaires 1.0x. Aucune \u00e9valuation anonyme."
        : "Experts declare conflicts of interest. Institutional evaluations are weighted 1.5x, volunteers 1.0x. No anonymous evaluations.",
    },
    {
      icon: Shield,
      title: fr ? "Protection des Donn\u00e9es" : "Data Protection",
      description: fr
        ? "Conforme RGPD. Export de donn\u00e9es complet, suppression sur demande, consentement explicite requis. Cl\u00e9s API chiffr\u00e9es AES-256."
        : "GDPR compliant. Full data export, deletion on request, explicit consent required. API keys encrypted with AES-256.",
    },
    {
      icon: Users,
      title: fr ? "Gouvernance Ouverte" : "Open Governance",
      description: fr
        ? "Les r\u00f4les (ONG, Recherche, Municipalit\u00e9) sont v\u00e9rifi\u00e9s par l\u2019\u00e9quipe d\u2019administration. Tout changement est audit\u00e9 et visible publiquement."
        : "Roles (NGO, Research, Municipality) are verified by the admin team. Every change is audited and publicly visible.",
    },
  ];

  const roles = [
    {
      icon: Users,
      role: fr ? "Utilisateur" : "User",
      tag: "USER",
      description: fr
        ? "Tout inscrit. Peut soumettre des id\u00e9es, cr\u00e9er des projets, rejoindre des challenges, commenter et voter."
        : "Any registered member. Can submit ideas, create projects, join challenges, comment, and vote.",
    },
    {
      icon: GraduationCap,
      role: fr ? "Expert Volontaire" : "Volunteer Expert",
      tag: "EXPERT_VOLUNTEER",
      description: fr
        ? "Professionnel reconnu qui \u00e9value b\u00e9n\u00e9volement les soumissions aux challenges. Pond\u00e9ration 1.0x. Doit d\u00e9clarer les conflits d\u2019int\u00e9r\u00eat."
        : "Recognized professional who evaluates challenge submissions voluntarily. Weight 1.0x. Must declare conflicts of interest.",
    },
    {
      icon: Building2,
      role: fr ? "Expert Institutionnel" : "Institutional Expert",
      tag: "EXPERT_INSTITUTION",
      description: fr
        ? "Repr\u00e9sentant d\u2019une institution (universit\u00e9, ONG, labo). \u00c9valuations pond\u00e9r\u00e9es 1.5x. V\u00e9rification d\u2019affiliation requise."
        : "Representative of an institution (university, NGO, lab). Evaluations weighted 1.5x. Affiliation verification required.",
    },
    {
      icon: UserCheck,
      role: fr ? "Administrateur" : "Administrator",
      tag: "ADMIN",
      description: fr
        ? "G\u00e8re les r\u00f4les, v\u00e9rifie les comptes, mod\u00e8re les contenus. Toutes les actions sont consign\u00e9es dans le registre d\u2019audit."
        : "Manages roles, verifies accounts, moderates content. All actions are logged in the audit registry.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <Landmark className="w-8 h-8 text-primary-400" />
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
            {fr ? "Gouvernance & Confiance" : "Governance & Trust"}
          </h1>
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          {fr
            ? "FutureAI est gouvern\u00e9 par des principes de transparence, d\u2019\u00e9quit\u00e9 et de responsabilit\u00e9 collective. Chaque d\u00e9cision est tra\u00e7able, chaque r\u00f4le est v\u00e9rifiable."
            : "FutureAI is governed by principles of transparency, fairness, and collective accountability. Every decision is traceable, every role is verifiable."}
        </p>
      </motion.div>

      {/* Pillars */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-400" />
          {fr ? "Nos 4 Piliers" : "Our 4 Pillars"}
        </h2>
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
      </section>

      {/* Decision-Making Framework */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Workflow className="w-5 h-5 text-primary-400" />
          {fr ? "Cadre D\u00e9cisionnel" : "Decision-Making Framework"}
        </h2>
        <div className="card">
          <p className="text-sm text-gray-400 mb-4">
            {fr
              ? "Les d\u00e9cisions sur FutureAI suivent un processus structur\u00e9 en 4 \u00e9tapes pour garantir l\u2019\u00e9quit\u00e9 et la transparence."
              : "Decisions on FutureAI follow a structured 4-step process to ensure fairness and transparency."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                step: "01",
                title: fr ? "Proposition" : "Proposal",
                desc: fr
                  ? "Tout membre peut soumettre une id\u00e9e, un projet ou un challenge."
                  : "Any member can submit an idea, project, or challenge.",
              },
              {
                step: "02",
                title: fr ? "\u00c9valuation" : "Evaluation",
                desc: fr
                  ? "Les experts du panel \u00e9valuent selon des crit\u00e8res publics et standardis\u00e9s."
                  : "Panel experts evaluate using public, standardized criteria.",
              },
              {
                step: "03",
                title: fr ? "Vote Communautaire" : "Community Vote",
                desc: fr
                  ? "La communaut\u00e9 vote et commente. Le score final int\u00e8gre experts + communaut\u00e9."
                  : "The community votes and comments. The final score integrates experts + community.",
              },
              {
                step: "04",
                title: fr ? "Mise en \u0152uvre" : "Implementation",
                desc: fr
                  ? "Les projets s\u00e9lectionn\u00e9s re\u00e7oivent visibilit\u00e9, contributeurs et suivi d\u2019impact."
                  : "Selected projects receive visibility, contributors, and impact tracking.",
              },
            ].map((item) => (
              <div key={item.step} className="relative p-3 bg-gray-800/30 rounded-lg border border-white/5">
                <span className="text-2xl font-bold text-primary-500/30">{item.step}</span>
                <h4 className="font-medium text-white mt-1">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Roles */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-400" />
          {fr ? "R\u00f4les & Responsabilit\u00e9s" : "Roles & Responsibilities"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roles.map((r, i) => (
            <motion.div
              key={r.tag}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card"
            >
              <div className="flex items-center gap-3 mb-2">
                <r.icon className="w-5 h-5 text-primary-400" />
                <h3 className="font-semibold text-white">{r.role}</h3>
                <span className="text-[10px] bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded-full">
                  {r.tag}
                </span>
              </div>
              <p className="text-sm text-gray-400">{r.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Detailed Governance Sections (expandable) */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-400" />
          {fr ? "R\u00e8gles D\u00e9taill\u00e9es" : "Detailed Rules"}
        </h2>

        <ExpandableSection
          icon={FileCheck}
          title={fr ? "D\u00e9claration \u00c9thique IA" : "Ethical AI Statement"}
          defaultOpen
        >
          <p>
            {fr
              ? "FutureAI s\u2019engage \u00e0 utiliser l\u2019intelligence artificielle de mani\u00e8re responsable et \u00e9thique :"
              : "FutureAI is committed to using artificial intelligence responsibly and ethically:"}
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              {fr
                ? "Aucune d\u00e9cision automatis\u00e9e sans supervision humaine"
                : "No automated decisions without human oversight"}
            </li>
            <li>
              {fr
                ? "Les cl\u00e9s API appartiennent aux utilisateurs \u2014 aucune donn\u00e9e ne transite par nos serveurs"
                : "API keys belong to users \u2014 no data flows through our servers"}
            </li>
            <li>
              {fr
                ? "Tous les algorithmes de scoring sont publics et v\u00e9rifiables"
                : "All scoring algorithms are public and verifiable"}
            </li>
            <li>
              {fr
                ? "Aucune discrimination dans l\u2019acc\u00e8s ou l\u2019\u00e9valuation"
                : "No discrimination in access or evaluation"}
            </li>
            <li>
              {fr
                ? "Droit \u00e0 l\u2019oubli garanti (suppression compl\u00e8te des donn\u00e9es)"
                : "Right to be forgotten guaranteed (complete data deletion)"}
            </li>
          </ul>
        </ExpandableSection>

        <ExpandableSection
          icon={AlertTriangle}
          title={fr ? "Conflits d\u2019Int\u00e9r\u00eat" : "Conflict of Interest"}
        >
          <p>
            {fr
              ? "Les membres du panel expert sont tenus de d\u00e9clarer tout conflit d\u2019int\u00e9r\u00eat avant d\u2019\u00e9valuer une soumission. Les d\u00e9clarations sont publiques et associ\u00e9es au challenge concern\u00e9."
              : "Expert panel members are required to declare any conflict of interest before evaluating a submission. Declarations are public and associated with the relevant challenge."}
          </p>
          <p>
            {fr
              ? "Toute \u00e9valuation o\u00f9 un conflit est d\u00e9clar\u00e9 est marqu\u00e9e dans le rapport d\u2019export. Les cas incluent :"
              : "Any evaluation where a conflict is declared is flagged in the export report. Cases include:"}
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{fr ? "Lien financier avec le porteur de projet" : "Financial link with the project owner"}</li>
            <li>{fr ? "Appartenance \u00e0 la m\u00eame organisation" : "Membership in the same organization"}</li>
            <li>{fr ? "Relation personnelle connue" : "Known personal relationship"}</li>
            <li>{fr ? "Int\u00e9r\u00eat concurrentiel direct" : "Direct competitive interest"}</li>
          </ul>
        </ExpandableSection>

        <ExpandableSection
          icon={Scale}
          title={fr ? "Processus d\u2019\u00c9valuation" : "Evaluation Process"}
        >
          <p>
            {fr
              ? "Chaque soumission dans un challenge est \u00e9valu\u00e9e par un panel d\u2019experts s\u00e9lectionn\u00e9s. Le processus est le suivant :"
              : "Each challenge submission is evaluated by a selected panel of experts. The process is as follows:"}
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>{fr ? "S\u00e9lection du panel" : "Panel Selection"}</strong> \u2014{" "}
              {fr
                ? "L\u2019administrateur du challenge constitue un panel de 3 \u00e0 7 experts comp\u00e9tents dans le domaine."
                : "The challenge admin assembles a panel of 3 to 7 experts competent in the field."}
            </li>
            <li>
              <strong>{fr ? "D\u00e9claration de conflits" : "Conflict Declaration"}</strong> \u2014{" "}
              {fr
                ? "Chaque expert doit d\u00e9clarer tout conflit d\u2019int\u00e9r\u00eat avant de noter."
                : "Each expert must declare any conflict of interest before scoring."}
            </li>
            <li>
              <strong>{fr ? "Notation individuelle" : "Individual Scoring"}</strong> \u2014{" "}
              {fr
                ? "Les experts notent selon les crit\u00e8res d\u00e9finis (innovation, faisabilit\u00e9, impact, qualit\u00e9 technique)."
                : "Experts score based on defined criteria (innovation, feasibility, impact, technical quality)."}
            </li>
            <li>
              <strong>{fr ? "Pond\u00e9ration" : "Weighting"}</strong> \u2014{" "}
              {fr
                ? "Les notes institutionnelles comptent 1.5x, les notes volontaires 1.0x. La moyenne pond\u00e9r\u00e9e est calcul\u00e9e."
                : "Institutional scores count 1.5x, volunteer scores 1.0x. The weighted average is calculated."}
            </li>
            <li>
              <strong>{fr ? "Publication" : "Publication"}</strong> \u2014{" "}
              {fr
                ? "Les r\u00e9sultats sont publi\u00e9s avec les scores d\u00e9taill\u00e9s. Toutes les \u00e9valuations sont export\u00e9es au format CSV."
                : "Results are published with detailed scores. All evaluations are exportable as CSV."}
            </li>
          </ol>
        </ExpandableSection>

        <ExpandableSection
          icon={Gavel}
          title={fr ? "R\u00e9solution de Litiges" : "Dispute Resolution"}
        >
          <p>
            {fr
              ? "En cas de d\u00e9saccord sur une \u00e9valuation ou une d\u00e9cision de mod\u00e9ration, le processus suivant s\u2019applique :"
              : "In case of disagreement about an evaluation or moderation decision, the following process applies:"}
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>{fr ? "Signalement" : "Report"}</strong> \u2014{" "}
              {fr
                ? "Le membre concern\u00e9 soumet un signalement d\u00e9taill\u00e9 via son profil."
                : "The concerned member submits a detailed report via their profile."}
            </li>
            <li>
              <strong>{fr ? "Revue administrative" : "Admin Review"}</strong> \u2014{" "}
              {fr
                ? "L\u2019\u00e9quipe d\u2019administration examine le signalement sous 72 heures."
                : "The admin team reviews the report within 72 hours."}
            </li>
            <li>
              <strong>{fr ? "M\u00e9diation" : "Mediation"}</strong> \u2014{" "}
              {fr
                ? "Si n\u00e9cessaire, un expert neutre est d\u00e9sign\u00e9 pour r\u00e9\u00e9valuer objectivement."
                : "If needed, a neutral expert is appointed to re-evaluate objectively."}
            </li>
            <li>
              <strong>{fr ? "D\u00e9cision finale" : "Final Decision"}</strong> \u2014{" "}
              {fr
                ? "La d\u00e9cision est consign\u00e9e dans le registre d\u2019audit et communiqu\u00e9e \u00e0 toutes les parties."
                : "The decision is recorded in the audit log and communicated to all parties."}
            </li>
          </ol>
        </ExpandableSection>

        <ExpandableSection
          icon={Globe}
          title={fr ? "\u00c9volution de la Plateforme" : "Platform Evolution"}
        >
          <p>
            {fr
              ? "FutureAI \u00e9volue de mani\u00e8re transparente et participative :"
              : "FutureAI evolves transparently and collaboratively:"}
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              {fr
                ? "La m\u00e9thodologie de notation est publique et ouverte aux commentaires de la communaut\u00e9"
                : "The scoring methodology is public and open to community feedback"}
            </li>
            <li>
              {fr
                ? "Les mises \u00e0 jour majeures sont annonc\u00e9es en avance et document\u00e9es"
                : "Major updates are announced in advance and documented"}
            </li>
            <li>
              {fr
                ? "Le code source de tous les algorithmes de scoring est accessible"
                : "The source code of all scoring algorithms is accessible"}
            </li>
            <li>
              {fr
                ? "Les membres actifs peuvent proposer des am\u00e9liorations via la section id\u00e9es"
                : "Active members can propose improvements via the ideas section"}
            </li>
            <li>
              {fr
                ? "Un tableau d\u2019impact mesure les r\u00e9sultats concrets de la plateforme"
                : "An impact dashboard measures the concrete results of the platform"}
            </li>
          </ul>
        </ExpandableSection>

        <ExpandableSection
          icon={Handshake}
          title={fr ? "Code de Conduite" : "Code of Conduct"}
        >
          <p>
            {fr
              ? "Tous les membres de FutureAI s\u2019engagent \u00e0 respecter les r\u00e8gles suivantes :"
              : "All FutureAI members agree to abide by the following rules:"}
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{fr ? "Respect mutuel dans tous les \u00e9changes" : "Mutual respect in all interactions"}</li>
            <li>
              {fr
                ? "Contributions constructives et argument\u00e9es"
                : "Constructive, well-reasoned contributions"}
            </li>
            <li>
              {fr
                ? "Pas de plagiat \u2014 attribution syst\u00e9matique des sources"
                : "No plagiarism \u2014 systematic attribution of sources"}
            </li>
            <li>
              {fr
                ? "Signalement imm\u00e9diat de tout abus ou conflit d\u2019int\u00e9r\u00eat"
                : "Immediate reporting of any abuse or conflict of interest"}
            </li>
            <li>
              {fr
                ? "Engagement \u00e0 l\u2019impact positif : les projets doivent viser le bien commun"
                : "Commitment to positive impact: projects must aim for the common good"}
            </li>
          </ul>
          <p className="text-xs text-gray-500 pt-2">
            {fr
              ? "Les manquements r\u00e9p\u00e9t\u00e9s au code de conduite peuvent entra\u00eener une suspension temporaire ou d\u00e9finitive."
              : "Repeated violations of the code of conduct may result in temporary or permanent suspension."}
          </p>
        </ExpandableSection>
      </section>

      {/* Public Audit Log */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-400" />
          {fr ? "Registre d\u2019Audit Public" : "Public Audit Log"}
        </h2>
        <p className="text-sm text-gray-500">
          {fr
            ? "Toutes les actions administratives sont consign\u00e9es ici en temps r\u00e9el."
            : "All administrative actions are logged here in real time."}
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="space-y-2">
            {auditLogs.map((log) => {
              const actionConf = ACTION_LABELS[log.action] || {
                en: log.action,
                fr: log.action,
                icon: "\ud83d\udccb",
              };
              return (
                <div key={log.id} className="card py-3 flex items-center gap-3">
                  <span className="text-lg">{actionConf.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {fr ? actionConf.fr : actionConf.en}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.performedBy.username} \u00b7 {log.targetType}/{log.targetId.slice(0, 8)}...
                      \u00b7 {new Date(log.createdAt).toLocaleDateString()}
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
              {fr
                ? "Aucune entr\u00e9e dans le registre pour le moment. Les actions seront enregistr\u00e9es d\u00e8s que la communaut\u00e9 sera active."
                : "No audit log entries yet. Actions will be recorded as soon as the community becomes active."}
            </p>
          </div>
        )}
      </section>

      {/* Links */}
      <section className="flex flex-wrap gap-4 text-sm border-t border-white/5 pt-8">
        <Link href="/public-methodology" className="text-primary-400 hover:text-primary-300 transition-colors">
          {fr ? "M\u00e9thodologie de notation \u2192" : "Scoring methodology \u2192"}
        </Link>
        <Link href="/privacy" className="text-primary-400 hover:text-primary-300 transition-colors">
          {fr ? "Politique de confidentialit\u00e9 \u2192" : "Privacy policy \u2192"}
        </Link>
        <Link href="/data" className="text-primary-400 hover:text-primary-300 transition-colors">
          {fr ? "Exporter mes donn\u00e9es \u2192" : "Export my data \u2192"}
        </Link>
        <Link href="/impact-dashboard" className="text-primary-400 hover:text-primary-300 transition-colors">
          {fr ? "Tableau d\u2019impact \u2192" : "Impact dashboard \u2192"}
        </Link>
        <Link href="/manifesto" className="text-primary-400 hover:text-primary-300 transition-colors">
          {fr ? "Notre manifeste \u2192" : "Our manifesto \u2192"}
        </Link>
      </section>
    </div>
  );
}
