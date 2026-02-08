import React from "react";
import {
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";

export interface ReelCaptionProps {
    text: string;
    startFrame?: number;
    duration?: number;
    position?: "top" | "center" | "bottom";
    size?: "small" | "medium" | "large";
    exitFrame?: number;
}

/**
 * Minimal text caption component optimized for Instagram Reels
 * Uses SF Pro Display / Outfit font for premium feel
 * No emojis, clean and readable
 */
export const ReelCaption: React.FC<ReelCaptionProps> = ({
    text,
    startFrame = 0,
    duration = 60,
    position = "center",
    size = "medium",
    exitFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const localFrame = frame - startFrame;
    if (localFrame < 0) return null;

    // Entry animation
    const entryProgress = spring({
        frame: localFrame,
        fps,
        config: { damping: 200 },
        durationInFrames: 20,
    });

    // Exit animation
    const exitProgress = exitFrame
        ? spring({
            frame: frame - exitFrame,
            fps,
            config: { damping: 200 },
            durationInFrames: 15,
        })
        : 0;

    const opacity = Math.min(1, entryProgress) - exitProgress;
    const translateY = interpolate(
        entryProgress,
        [0, 1],
        [40, 0],
        { extrapolateRight: "clamp" }
    );

    // Position mapping
    const containerStyles: Record<string, React.CSSProperties> = {
        top: { alignItems: "flex-start", paddingTop: 180 },
        center: { alignItems: "center" },
        bottom: { alignItems: "flex-end", paddingBottom: 180 },
    };

    // Size mapping - LARGER sizes for mobile readability
    const sizeMap = {
        small: 40,
        medium: 56,
        large: 72,
    };

    return (
        <>
            {/* Google Font import */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}
            </style>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 80px",
                    opacity: Math.max(0, opacity),
                    ...containerStyles[position],
                }}
            >
                <p
                    style={{
                        fontSize: sizeMap[size],
                        fontWeight: 700,
                        color: "#ffffff",
                        margin: 0,
                        fontFamily: "'Outfit', 'SF Pro Display', system-ui, sans-serif",
                        lineHeight: 1.2,
                        textAlign: "center",
                        textShadow: "0 6px 30px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.5)",
                        transform: `translateY(${translateY}px)`,
                        letterSpacing: "-0.02em",
                    }}
                >
                    {text}
                </p>
            </div>
        </>
    );
};
