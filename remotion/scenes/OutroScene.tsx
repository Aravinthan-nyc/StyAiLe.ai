import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
} from "remotion";

export const OutroScene: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Scene: 3540-3600 frames (59-60s at 60fps = 60 frames)
    // Logo hold → fade to black

    // Fade to black over last 45 frames
    const fadeStart = 15;
    const fadeOut = interpolate(frame, [fadeStart, durationInFrames], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            {/* Centered logo */}
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: fadeOut,
                }}
            >
                {/* Logo icon */}
                <div
                    style={{
                        width: 100,
                        height: 100,
                        borderRadius: 25,
                        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        marginBottom: 24,
                    }}
                >
                    <span style={{ fontSize: 48 }}>✨</span>
                </div>

                {/* App name */}
                <h1
                    style={{
                        fontSize: 48,
                        fontWeight: 700,
                        color: "#ffffff",
                        fontFamily: "Inter, system-ui, sans-serif",
                        margin: 0,
                    }}
                >
                    Sty<span style={{ opacity: 0.6 }}>Ai</span>Le
                    <span style={{ opacity: 0.4, fontSize: 32 }}>.ai</span>
                </h1>
            </div>
        </AbsoluteFill>
    );
};
