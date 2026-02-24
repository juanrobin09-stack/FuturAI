import { Trophy, Star, Users, Rocket } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  users: Users,
  rocket: Rocket,
};

interface BadgeDisplayProps {
  badge: {
    name: string;
    description: string;
    icon: string;
  };
  size?: "sm" | "md";
}

export default function BadgeDisplay({ badge, size = "md" }: BadgeDisplayProps) {
  const Icon = iconMap[badge.icon] || Star;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20 ${
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
      title={badge.description}
    >
      <Icon className={`text-accent-400 ${size === "sm" ? "w-3 h-3" : "w-4 h-4"}`} />
      <span className="font-medium text-primary-300">{badge.name}</span>
    </div>
  );
}
