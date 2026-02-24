interface FutureAILogoProps {
  size?: number;
  className?: string;
}

export default function FutureAILogo({
  size = 36,
  className = "",
}: FutureAILogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="FutureAI"
      role="img"
    >
      <defs>
        <linearGradient
          id="fai-g"
          x1="4"
          y1="4"
          x2="44"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      {/* Three orbital arcs — globe + AI nexus */}
      <ellipse
        cx="24"
        cy="24"
        rx="20"
        ry="8"
        stroke="url(#fai-g)"
        strokeWidth="2"
      />
      <ellipse
        cx="24"
        cy="24"
        rx="20"
        ry="8"
        stroke="url(#fai-g)"
        strokeWidth="2"
        transform="rotate(60 24 24)"
      />
      <ellipse
        cx="24"
        cy="24"
        rx="20"
        ry="8"
        stroke="url(#fai-g)"
        strokeWidth="2"
        transform="rotate(120 24 24)"
      />
      {/* Central core */}
      <circle cx="24" cy="24" r="5" fill="url(#fai-g)" />
    </svg>
  );
}
