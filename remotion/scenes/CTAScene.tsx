import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";
import { CameraMove } from "../components/CameraMove";

export const CTAScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Scene: 3000-3540 frames (50-59s at 60fps = 540 frames)
    // CTA with button pulse, subtle zoom out

    // Button entrance
    const buttonEntrance = spring({
        frame,
        fps,
        config: { damping: 10, stiffness: 80 },
        durationInFrames: 60,
    });

    // Single button pulse around frame 200
    const pulseFrame = 200;
    const isPulsing = frame >= pulseFrame && frame < pulseFrame + 40;
    const pulseProgress = isPulsing
        ? spring({
            frame: frame - pulseFrame,
            fps,
            config: { damping: 8, stiffness: 200 },
        })
        : 0;

    const buttonScale = buttonEntrance + (isPulsing ? pulseProgress * 0.03 : 0);

    // Text entrance
    const textEntrance = spring({
        frame: frame - 30,
        fps,
        config: { damping: 200 },
        durationInFrames: 40,
    });

    // Subtitle entrance
    const subtitleEntrance = spring({
        frame: frame - 100,
        fps,
        config: { damping: 200 },
    });

    return (
        <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            <CameraMove type="pullback" startFrame={0} duration={540} intensity={0.3}>
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 40,
                    }}
                >
                    {/* App icon */}
                    <div
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: 30,
                            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            marginBottom: 40,
                            opacity: buttonEntrance,
                            transform: `scale(${buttonEntrance})`,
                        }}
                    >
                        <span style={{ fontSize: 56 }}>✨</span>
                    </div>

                    {/* Main CTA text */}
                    <h1
                        style={{
                            fontSize: 64,
                            fontWeight: 700,
                            color: "#ffffff",
                            fontFamily: "Inter, system-ui, sans-serif",
                            textAlign: "center",
                            margin: 0,
                            marginBottom: 16,
                            opacity: Math.max(0, textEntrance),
                            transform: `translateY(${interpolate(textEntrance, [0, 1], [30, 0])}px)`,
                        }}
                    >
                        Sty<span style={{ opacity: 0.6 }}>Ai</span>Le.ai
                    </h1>

                    {/* Subtitle */}
                    <p
                        style={{
                            fontSize: 22,
                            color: "rgba(255,255,255,0.6)",
                            fontFamily: "Inter, system-ui, sans-serif",
                            textAlign: "center",
                            margin: 0,
                            marginBottom: 50,
                            opacity: Math.max(0, subtitleEntrance),
                            transform: `translateY(${interpolate(subtitleEntrance, [0, 1], [20, 0])}px)`,
                        }}
                    >
                        Your AI-powered wardrobe assistant
                    </p>

                    {/* CTA Button */}
                    <div
                        style={{
                            opacity: buttonEntrance,
                            transform: `scale(${Math.min(1.03, buttonScale)})`,
                        }}
                    >
                        <button
                            style={{
                                backgroundColor: "#ffffff",
                                color: "#000000",
                                border: "none",
                                borderRadius: 40,
                                padding: "22px 60px",
                                fontSize: 20,
                                fontWeight: 700,
                                fontFamily: "Inter, system-ui, sans-serif",
                                cursor: "pointer",
                                boxShadow: "0 20px 60px rgba(255,255,255,0.2), 0 0 0 1px rgba(255,255,255,0.1)",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <span>Download Now</span>
                            <span style={{ fontSize: 24 }}>→</span>
                        </button>
                    </div>

                    {/* App store badges hint */}
                    <div
                        style={{
                            display: "flex",
                            gap: 20,
                            marginTop: 40,
                            opacity: Math.max(0, subtitleEntrance - 0.3),
                        }}
                    >
                        <div
                            style={{
                                padding: "12px 24px",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.1)",
                                fontSize: 14,
                                color: "rgba(255,255,255,0.6)",
                                fontFamily: "Inter, system-ui, sans-serif",
                            }}
                        >
                            🍎 App Store
                        </div>
                        <div
                            style={{
                                padding: "12px 24px",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.1)",
                                fontSize: 14,
                                color: "rgba(255,255,255,0.6)",
                                fontFamily: "Inter, system-ui, sans-serif",
                            }}
                        >
                            🤖 Play Store
                        </div>
                    </div>
                </div>
            </CameraMove>
        </AbsoluteFill>
    );
};
