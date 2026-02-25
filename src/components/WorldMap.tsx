"use client";

import { useEffect, useState } from "react";
import { getCategoryColor, getCategoryLabel } from "@/lib/utils";
import { useLanguage } from "@/i18n";
import { Loader2 } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/* Force Leaflet to recalculate tiles after the container is visible */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200);
    const ro = new ResizeObserver(() => map.invalidateSize());
    if (map.getContainer()) ro.observe(map.getContainer());
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [map]);
  return null;
}

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
    <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden rounded-2xl">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: "#111827", height: "100%", width: "100%" }}
      >
        <MapResizer />
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
