import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Img,
    Sequence,
    staticFile,
} from "remotion";
import { SpringReveal } from "../components/SpringReveal";

// Items that will snap to organized positions
const organizedItems = [
    { id: 1, emoji: "👕", x: 0.25, y: 0.35 },
    { id: 2, emoji: "👖", x: 0.5, y: 0.35 },
    { id: 3, emoji: "👟", x: 0.75, y: 0.35 },
    { id: 4, emoji: "👗", x: 0.25, y: 0.55 },
    { id: 5, emoji: "🧥", x: 0.5, y: 0.55 },
    { id: 6, emoji: "👜", x: 0.75, y: 0.55 },
];

export const ResolutionScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // Scene: 720-1080 frames (12-18s at 60fps)
    // Everything snaps to center, brand appears

    // Items snap into organized grid
    const snapProgress = spring({
        frame,
        fps,
        config: { damping: 15, stiffness: 80 },
        durationInFrames: 60,
    });

    // Logo reveal (starts after items settle)
    const logoDelay = 90;
    const logoProgress = spring({
        frame: frame - logoDelay,
        fps,
        config: { damping: 10, stiffness: 100 },
    });

    // Tagline (after logo)
    const taglineProgress = spring({
        frame: frame - logoDelay - 30,
        fps,
        config: { damping: 200 },
    });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#000000",
            }}
        >
            {/* Organized items grid */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: interpolate(frame, [0, 30], [1, 0.15], {
                        extrapolateRight: "clamp",
                    }),
                }}
            >
                {organizedItems.map((item, index) => {
                    const itemProgress = spring({
                        frame: frame - index * 5,
                        fps,
                        config: { damping: 12, stiffness: 100 },
                    });

                    return (
                        <div
                            key={item.id}
                            style={{
                                position: "absolute",
                                left: `${item.x * 100}%`,
                                top: `${item.y * 100}%`,
                                transform: `translate(-50%, -50%) scale(${itemProgress})`,
                                opacity: itemProgress,
                            }}
                        >
                            <div
                                style={{
                                    width: 100,
                                    height: 100,
                                    backgroundColor: "rgba(255,255,255,0.1)",
                                    borderRadius: 20,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 48,
                                    border: "1px solid rgba(255,255,255,0.1)",
                                }}
                            >
                                {item.emoji}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Brand reveal - centered */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* Logo with overshoot scale */}
                <div
                    style={{
                        opacity: Math.max(0, logoProgress),
                        transform: `scale(${interpolate(
                            logoProgress,
                            [0, 0.8, 1],
                            [0.8, 1.05, 1]
                        )})`,
                    }}
                >
                    <div
                        style={{
                            width: 180,
                            height: 180,
                            borderRadius: 40,
                            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.1)",
                        }}
                    >
                        <span style={{ fontSize: 80 }}>✨</span>
                    </div>
                </div>

                {/* App name */}
                <div
                    style={{
                        marginTop: 40,
                        opacity: Math.max(0, logoProgress - 0.3),
                        transform: `translateY(${interpolate(
                            logoProgress,
                            [0.3, 1],
                            [20, 0],
                            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                        )}px)`,
                    }}
                >
                    <h1
                        style={{
                            fontSize: 72,
                            fontWeight: 700,
                            color: "#ffffff",
                            fontFamily: "Inter, system-ui, sans-serif",
                            margin: 0,
                            textShadow: "0 0 60px rgba(255,255,255,0.3)",
                        }}
                    >
                        Sty<span style={{ opacity: 0.6 }}>Ai</span>Le
                        <span style={{ opacity: 0.4, fontSize: 48 }}>.ai</span>
                    </h1>
                </div>

                {/* Tagline */}
                <div
                    style={{
                        marginTop: 20,
                        opacity: Math.max(0, taglineProgress),
                        transform: `translateY(${interpolate(
                            taglineProgress,
                            [0, 1],
                            [10, 0]
                        )}px)`,
                    }}
                >
                    <p
                        style={{
                            fontSize: 22,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.5)",
                            fontFamily: "Inter, system-ui, sans-serif",
                            margin: 0,
                            letterSpacing: 6,
                            textTransform: "uppercase",
                        }}
                    >
                        Your AI Wardrobe
                    </p>
                </div>
            </div>
        </AbsoluteFill>
    );
};
