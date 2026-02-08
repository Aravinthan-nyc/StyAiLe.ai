import React from "react";
import {
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";

export interface CameraMoveProps {
    children: React.ReactNode;
    type?: "focus" | "pullback" | "panLeft" | "panRight" | "panUp" | "panDown";
    startFrame?: number;
    duration?: number;
    intensity?: number;
}

export const CameraMove: React.FC<CameraMoveProps> = ({
    children,
    type = "focus",
    startFrame = 0,
    duration = 60,
    intensity = 1,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const localFrame = frame - startFrame;
    if (localFrame < 0) {
        return <>{children}</>;
    }

    const progress = spring({
        frame: localFrame,
        fps,
        config: { damping: 200 },
        durationInFrames: duration,
    });

    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    switch (type) {
        case "focus":
            // Scale 1 → 1.08 (zoom in)
            scale = interpolate(progress, [0, 1], [1, 1 + 0.08 * intensity]);
            break;
        case "pullback":
            // Scale 1.15 → 1 (zoom out)
            scale = interpolate(progress, [0, 1], [1 + 0.15 * intensity, 1]);
            break;
        case "panLeft":
            translateX = interpolate(progress, [0, 1], [0, -50 * intensity]);
            break;
        case "panRight":
            translateX = interpolate(progress, [0, 1], [0, 50 * intensity]);
            break;
        case "panUp":
            translateY = interpolate(progress, [0, 1], [0, -30 * intensity]);
            break;
        case "panDown":
            translateY = interpolate(progress, [0, 1], [0, 30 * intensity]);
            break;
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                transformOrigin: "center center",
            }}
        >
            {children}
        </div>
    );
};
