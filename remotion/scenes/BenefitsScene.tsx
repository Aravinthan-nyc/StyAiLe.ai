import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Sequence,
} from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { CameraMove } from "../components/CameraMove";

const benefits = [
    { text: "Never wear the wrong outfit", frame: 0 },
    { text: "AI that understands your style", frame: 150 },
    { text: "Your wardrobe, elevated", frame: 300 },
];

export const BenefitsScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Scene: 2400-3000 frames (40-50s at 60fps = 600 frames)
    // Benefits text with subtle UI parallax

    // Background elements (subtle UI ghost)
    const bgOpacity = interpolate(frame, [0, 50, 550, 600], [0, 0.08, 0.08, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            {/* Subtle background UI ghost */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: bgOpacity,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CameraMove type="panUp" startFrame={0} duration={600} intensity={0.5}>
                    <div
                        style={{
                            width: 300,
                            height: 500,
                            borderRadius: 40,
                            border: "2px solid rgba(255,255,255,0.3)",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 15,
                            padding: 20,
                        }}
                    >
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    aspectRatio: "4/5",
                                    backgroundColor: "rgba(255,255,255,0.1)",
                                    borderRadius: 16,
                                }}
                            />
                        ))}
                    </div>
                </CameraMove>
            </div>

            {/* Benefits text - center stage */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 40,
                }}
            >
                {benefits.map((benefit, index) => {
                    const isActive = frame >= benefit.frame && frame < benefit.frame + 140;
                    const localFrame = frame - benefit.frame;

                    if (localFrame < 0 || localFrame > 150) return null;

                    const entrance = spring({
                        frame: localFrame,
                        fps,
                        config: { damping: 200 },
                        durationInFrames: 30,
                    });

                    const exit = localFrame > 110
                        ? spring({
                            frame: localFrame - 110,
                            fps,
                            config: { damping: 200 },
                            durationInFrames: 30,
                        })
                        : 0;

                    const opacity = entrance - exit;
                    const y = interpolate(entrance, [0, 1], [40, 0]) + interpolate(exit, [0, 1], [0, -30]);

                    return (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                opacity: Math.max(0, opacity),
                                transform: `translateY(${y}px)`,
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: 52,
                                    fontWeight: 700,
                                    color: "#ffffff",
                                    fontFamily: "Inter, system-ui, sans-serif",
                                    textAlign: "center",
                                    margin: 0,
                                    lineHeight: 1.3,
                                    maxWidth: 700,
                                    textShadow: "0 0 80px rgba(255,255,255,0.3)",
                                }}
                            >
                                {benefit.text}
                            </h2>
                        </div>
                    );
                })}
            </div>

            {/* Subtle gradient overlays */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 300,
                    background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)",
                    pointerEvents: "none",
                }}
            />
        </AbsoluteFill>
    );
};
