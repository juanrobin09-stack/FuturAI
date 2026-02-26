"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  ExternalLink,
  Radio,
  Lock,
  Video,
  Sparkles,
  ArrowRight,
  MapPin,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/i18n";
import PageTransition from "@/components/animations/PageTransition";
import {
  getUpcomingEvents,
  getPastEvents,
  isEventLive,
  getPlatformLabel,
  getPlatformIcon,
  type FutureAIEvent,
} from "@/lib/events";

function formatEventDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEventTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeUntil(dateStr: string, locale: string): string {
  const now = new Date();
  const event = new Date(dateStr);
  const diff = event.getTime() - now.getTime();

  if (diff <= 0) return "";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return locale === "fr" ? `Dans ${days}j ${hours}h` : `In ${days}d ${hours}h`;
  }
  return locale === "fr" ? `Dans ${hours}h` : `In ${hours}h`;
}

/* ─── Event Card ───────────────────────────────────────── */

function EventCard({
  event,
  locale,
  t,
  isPast,
}: {
  event: FutureAIEvent;
  locale: string;
  t: Record<string, string>;
  isPast: boolean;
}) {
  const live = isEventLive(event);
  const title = locale === "fr" ? event.title.fr : event.title.en;
  const description = locale === "fr" ? event.description.fr : event.description.en;
  const timeUntil = !isPast ? getTimeUntil(event.date, locale) : "";

  return (
    <div
      className={`relative group rounded-2xl border transition-all duration-300 ${
        live
          ? "border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10"
          : isPast
          ? "border-white/5 bg-white/[0.02] opacity-60"
          : "border-white/10 bg-white/[0.03] hover:border-primary-500/30 hover:bg-white/[0.05]"
      }`}
    >
      {/* Live indicator */}
      {live && (
        <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 animate-pulse">
          <Radio className="w-3 h-3" />
          {t.live}
        </div>
      )}

      <div className="p-6 sm:p-8">
        {/* Top row: date + badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{formatEventDate(event.date, locale)}</span>
          </div>
          <span className="text-gray-600">|</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            {formatEventTime(event.date, locale)} ({event.duration} {t.minutes})
          </div>

          {!isPast && timeUntil && (
            <span className="ml-auto text-xs font-medium text-primary-400 bg-primary-500/10 px-2.5 py-0.5 rounded-full">
              {timeUntil}
            </span>
          )}

          {isPast && (
            <span className="ml-auto text-xs font-medium text-gray-500 bg-white/5 px-2.5 py-0.5 rounded-full">
              {t.ended}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={`text-lg sm:text-xl font-bold mb-3 ${
            isPast ? "text-gray-400" : "text-white"
          }`}
        >
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed mb-5">{description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/5"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-5">
          <div className="flex items-center gap-1.5">
            <span>{getPlatformIcon(event.platform)}</span>
            {getPlatformLabel(event.platform)}
          </div>
          <div className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" />
            {t.formatOnline}
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {t.free}
          </div>
          {event.maxSpots && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {t.spotsTotal.replace("{n}", String(event.maxSpots))}
            </div>
          )}
        </div>

        {/* Host */}
        <div className="text-xs text-gray-500 mb-6">
          {t.host} <span className="text-gray-300 font-medium">{event.host}</span>
        </div>

        {/* Action */}
        {!isPast ? (
          event.joinUrl ? (
            <a
              href={event.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                live
                  ? "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/25"
                  : "bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white shadow-lg shadow-primary-500/25"
              }`}
            >
              {live ? <Radio className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
              {t.join}
              <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white/5 text-gray-400 border border-white/10 cursor-default">
              <Lock className="w-4 h-4" />
              {locale === "fr" ? "Lien bientot disponible" : "Link coming soon"}
            </div>
          )
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-gray-500 bg-white/[0.03] border border-white/5">
            <Lock className="w-3.5 h-3.5" />
            {t.pastNoReplay}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────── */

export default function EventsPage() {
  const { t, locale } = useLanguage();
  const [upcoming, setUpcoming] = useState<FutureAIEvent[]>([]);
  const [past, setPast] = useState<FutureAIEvent[]>([]);

  useEffect(() => {
    setUpcoming(getUpcomingEvents());
    setPast(getPastEvents());

    // Refresh every 30s to update live status / countdown
    const interval = setInterval(() => {
      setUpcoming(getUpcomingEvents());
      setPast(getPastEvents());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const et = t.events;

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            {et.exclusive}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            {et.title}{" "}
            <span className="gradient-text">{et.titleHighlight}</span>
          </h1>

          <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
            {et.subtitle}
          </p>

          {/* Next session countdown */}
          {upcoming.length > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm">
              <Calendar className="w-4 h-4 text-primary-400" />
              <span className="text-gray-400">{et.nextSession} :</span>
              <span className="text-white font-medium capitalize">
                {formatEventDate(upcoming[0].date, locale)}
              </span>
              <span className="text-primary-400 font-medium">
                {formatEventTime(upcoming[0].date, locale)}
              </span>
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <section className="mb-16">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-400" />
            {et.upcoming}
            {upcoming.length > 0 && (
              <span className="text-xs text-gray-500 font-normal ml-2">
                ({upcoming.length})
              </span>
            )}
          </h2>

          {upcoming.length > 0 ? (
            <div className="space-y-6">
              {upcoming.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  locale={locale}
                  t={et}
                  isPast={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.02]">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium mb-2">{et.noUpcoming}</p>
              <p className="text-sm text-gray-500">{et.noUpcomingHint}</p>
            </div>
          )}
        </section>

        {/* Past Sessions */}
        {past.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-400 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              {et.past}
              <span className="text-xs text-gray-600 font-normal ml-2">
                ({past.length})
              </span>
            </h2>

            <div className="space-y-4">
              {past.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  locale={locale}
                  t={et}
                  isPast={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* CTA bottom */}
        <div className="mt-16 text-center py-10 rounded-2xl border border-white/5 bg-gradient-to-br from-primary-500/5 to-accent-500/5">
          <Sparkles className="w-8 h-8 text-primary-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {locale === "fr"
              ? "Vous voulez proposer un sujet ?"
              : "Want to suggest a topic?"}
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
            {locale === "fr"
              ? "Rejoignez la plateforme et partagez vos idees de sessions avec la communaute."
              : "Join the platform and share your session ideas with the community."}
          </p>
          <a
            href="/ideas/submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white font-semibold text-sm transition-all shadow-lg shadow-primary-500/25"
          >
            {locale === "fr" ? "Proposer un sujet" : "Suggest a topic"}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </PageTransition>
  );
}
