import React from "react";
import {
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Easing,
} from "remotion";

export interface AnimatedTextProps {
    text: string;
    startFrame?: number;
    duration?: number;
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    className?: string;
    direction?: "up" | "down" | "left" | "right";
    exitFrame?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
    text,
    startFrame = 0,
    duration = 30,
    fontSize = 64,
    fontWeight = 700,
    color = "#ffffff",
    className = "",
    direction = "up",
    exitFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const localFrame = frame - startFrame;

    // Entry animation
    const entryProgress = spring({
        frame: localFrame,
        fps,
        config: { damping: 200 },
        durationInFrames: duration,
    });

    // Exit animation (if exitFrame provided)
    const exitProgress = exitFrame
        ? spring({
            frame: frame - exitFrame,
            fps,
            config: { damping: 200 },
            durationInFrames: 20,
        })
        : 0;

    const opacity = Math.min(1, entryProgress) - exitProgress;

    // Direction-based movement
    const movement = 50;
    let translateX = 0;
    let translateY = 0;

    switch (direction) {
        case "up":
            translateY = interpolate(entryProgress, [0, 1], [movement, 0]);
            break;
        case "down":
            translateY = interpolate(entryProgress, [0, 1], [-movement, 0]);
            break;
        case "left":
            translateX = interpolate(entryProgress, [0, 1], [movement, 0]);
            break;
        case "right":
            translateX = interpolate(entryProgress, [0, 1], [-movement, 0]);
            break;
    }

    if (localFrame < 0) return null;

    return (
        <div
            className={className}
            style={{
                fontSize,
                fontWeight,
                color,
                opacity: Math.max(0, opacity),
                transform: `translate(${translateX}px, ${translateY}px)`,
                fontFamily: "Inter, system-ui, sans-serif",
                textAlign: "center",
            }}
        >
            {text}
        </div>
    );
};
