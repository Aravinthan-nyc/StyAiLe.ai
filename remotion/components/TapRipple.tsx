import React from "react";
import {
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
} from "remotion";

export interface TapRippleProps {
    x?: number;
    y?: number;
    startFrame?: number;
    color?: string;
    size?: number;
}

export const TapRipple: React.FC<TapRippleProps> = ({
    x = 50,
    y = 50,
    startFrame = 0,
    color = "rgba(255, 255, 255, 0.4)",
    size = 80,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const localFrame = frame - startFrame;
    if (localFrame < 0 || localFrame > 30) return null;

    const scale = spring({
        frame: localFrame,
        fps,
        config: { damping: 15, stiffness: 200 },
    });

    const opacity = interpolate(localFrame, [0, 20, 30], [0.6, 0.3, 0], {
        extrapolateRight: "clamp",
    });

    return (
        <div
            style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                borderRadius: "50%",
                backgroundColor: color,
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity,
                pointerEvents: "none",
            }}
        />
    );
};

export interface TapPulseProps {
    children: React.ReactNode;
    startFrame?: number;
    intensity?: number;
}

export const TapPulse: React.FC<TapPulseProps> = ({
    children,
    startFrame = 0,
    intensity = 0.05,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const localFrame = frame - startFrame;
    if (localFrame < 0) {
        return <>{children}</>;
    }

    // Quick scale down then up with overshoot
    const scaleDown = spring({
        frame: localFrame,
        fps,
        config: { damping: 20, stiffness: 300 },
        durationInFrames: 8,
    });

    const scaleUp = spring({
        frame: localFrame - 5,
        fps,
        config: { damping: 8, stiffness: 150 },
        durationInFrames: 15,
    });

    const scale = localFrame < 5
        ? 1 - intensity * scaleDown
        : 1 + intensity * scaleUp - intensity;

    return (
        <div style={{ transform: `scale(${Math.max(0.9, Math.min(1.1, scale))})` }}>
            {children}
        </div>
    );
};
