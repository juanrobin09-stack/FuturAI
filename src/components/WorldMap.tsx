"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getCategoryColor, getCategoryLabel } from "@/lib/utils";
import { useLanguage } from "@/i18n";
import { Loader2 } from "lucide-react";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface MapIdea {
  id: string;
  title: string;
  category: string;
  country: string | null;
  latitude: number;
  longitude: number;
  author: { username: string };
  score: number;
}

interface WorldMapProps {
  ideas?: MapIdea[];
}

export default function WorldMap({ ideas: propIdeas }: WorldMapProps) {
  const { t } = useLanguage();
  const [ideas, setIdeas] = useState<MapIdea[]>(propIdeas || []);
  const [loading, setLoading] = useState(!propIdeas);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!propIdeas) {
      fetch("/api/ideas?hasLocation=true")
        .then((r) => r.json())
        .then((data) => {
          setIdeas(data.ideas || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [propIdeas]);

  if (!mounted || loading) {
    return (
      <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-gray-800/50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: "#111827" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {ideas.map((idea) => (
          <CircleMarker
            key={idea.id}
            center={[idea.latitude, idea.longitude]}
            radius={8 + Math.min(idea.score, 20)}
            pathOptions={{
              color: getCategoryColor(idea.category),
              fillColor: getCategoryColor(idea.category),
              fillOpacity: 0.6,
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-sm mb-1">{idea.title}</h3>
                <p className="text-xs text-gray-300 mb-2">
                  {t.common.by} {idea.author.username}
                  {idea.country && ` - ${idea.country}`}
                </p>
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${getCategoryColor(idea.category)}30`,
                      color: getCategoryColor(idea.category),
                    }}
                  >
                    {getCategoryLabel(idea.category, t.categories)}
                  </span>
                  <span className="text-xs font-bold text-primary-300">
                    {idea.score} {t.ideas.votes}
                  </span>
                </div>
                <a
                  href={`/ideas/${idea.id}`}
                  className="block mt-2 text-xs text-primary-400 hover:underline"
                >
                  {t.common.viewDetails} &rarr;
                </a>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
