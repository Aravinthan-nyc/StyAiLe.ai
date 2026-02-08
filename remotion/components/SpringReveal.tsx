import React from "react";
import {
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";

export interface SpringRevealProps {
    children: React.ReactNode;
    startFrame?: number;
    type?: "scale" | "fade" | "slideUp" | "slideDown" | "scaleRotate";
    config?: {
        damping?: number;
        stiffness?: number;
        mass?: number;
    };
}

export const SpringReveal: React.FC<SpringRevealProps> = ({
    children,
    startFrame = 0,
    type = "scale",
    config = { damping: 12, stiffness: 100 },
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const localFrame = frame - startFrame;
    if (localFrame < 0) return null;

    const progress = spring({
        frame: localFrame,
        fps,
        config,
    });

    let style: React.CSSProperties = {};

    switch (type) {
        case "scale":
            style = {
                opacity: progress,
                transform: `scale(${interpolate(progress, [0, 1], [0.5, 1])})`,
            };
            break;
        case "fade":
            style = { opacity: progress };
            break;
        case "slideUp":
            style = {
                opacity: progress,
                transform: `translateY(${interpolate(progress, [0, 1], [50, 0])}px)`,
            };
            break;
        case "slideDown":
            style = {
                opacity: progress,
                transform: `translateY(${interpolate(progress, [0, 1], [-50, 0])}px)`,
            };
            break;
        case "scaleRotate":
            style = {
                opacity: progress,
                transform: `scale(${interpolate(progress, [0, 1], [0.3, 1])}) rotate(${interpolate(progress, [0, 1], [-15, 0])}deg)`,
            };
            break;
    }

    return <div style={style}>{children}</div>;
};
