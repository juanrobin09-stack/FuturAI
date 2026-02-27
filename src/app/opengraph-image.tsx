import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FutureAI - Global AI Collaboration Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #030712 0%, #111827 50%, #030712 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Gradient accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #14b8a6, #f97316)",
          }}
        />

        {/* Logo circles */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #14b8a6, #f97316)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#030712",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #14b8a6, #f97316)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            background: "linear-gradient(90deg, #14b8a6, #f97316)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 16,
          }}
        >
          FutureAI
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#9ca3af",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Global AI Collaboration Platform
        </div>

        {/* Features pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {["9 AI Providers", "Real-time Collaboration", "Impact Scoring"].map(
            (text) => (
              <div
                key={text}
                style={{
                  padding: "8px 20px",
                  borderRadius: 20,
                  border: "1px solid rgba(20, 184, 166, 0.3)",
                  backgroundColor: "rgba(20, 184, 166, 0.1)",
                  color: "#5eead4",
                  fontSize: 16,
                }}
              >
                {text}
              </div>
            )
          )}
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #f97316, #14b8a6)",
          }}
        />

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 40,
            fontSize: 18,
            color: "#6b7280",
          }}
        >
          futurai.space
        </div>
      </div>
    ),
    { ...size }
  );
}
