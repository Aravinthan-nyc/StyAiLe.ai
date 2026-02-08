import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Img,
} from "remotion";

// Mock wardrobe items for the chaos scene
const chaosItems = [
    { id: 1, emoji: "👕", color: "#3b82f6", rotation: -15 },
    { id: 2, emoji: "👖", color: "#8b5cf6", rotation: 12 },
    { id: 3, emoji: "👗", color: "#ec4899", rotation: -8 },
    { id: 4, emoji: "🧥", color: "#f59e0b", rotation: 20 },
    { id: 5, emoji: "👟", color: "#10b981", rotation: -25 },
    { id: 6, emoji: "👜", color: "#ef4444", rotation: 15 },
    { id: 7, emoji: "🧢", color: "#6366f1", rotation: -10 },
    { id: 8, emoji: "👔", color: "#14b8a6", rotation: 8 },
];

interface ChaosItemProps {
    emoji: string;
    color: string;
    rotation: number;
    index: number;
    startFrame: number;
}

const ChaosItem: React.FC<ChaosItemProps> = ({
    emoji,
    color,
    rotation,
    index,
    startFrame,
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    const localFrame = frame - startFrame;
    if (localFrame < 0) return null;

    // Fast entry with slight overshoot
    const entryProgress = spring({
        frame: localFrame,
        fps,
        config: { damping: 12, stiffness: 150 },
    });

    // Random-ish positions (deterministic based on index)
    const positions = [
        { x: 0.2, y: 0.25 },
        { x: 0.75, y: 0.2 },
        { x: 0.15, y: 0.5 },
        { x: 0.8, y: 0.45 },
        { x: 0.3, y: 0.7 },
        { x: 0.7, y: 0.75 },
        { x: 0.5, y: 0.35 },
        { x: 0.45, y: 0.6 },
    ];

    const pos = positions[index % positions.length];

    // Entry from random directions
    const entryX = index % 2 === 0 ? -200 : 200;
    const entryY = index % 3 === 0 ? -200 : 200;

    const x = interpolate(entryProgress, [0, 1], [entryX, 0]);
    const y = interpolate(entryProgress, [0, 1], [entryY, 0]);
    const scale = interpolate(entryProgress, [0, 1], [0.3, 1]);
    const rot = interpolate(entryProgress, [0, 1], [rotation * 3, rotation]);

    // Floating animation after entry
    const floatOffset = Math.sin((frame + index * 20) * 0.05) * 10;

    return (
        <div
            style={{
                position: "absolute",
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                transform: `translate(-50%, -50%) translate(${x}px, ${y + floatOffset}px) scale(${scale}) rotate(${rot}deg)`,
                opacity: entryProgress,
            }}
        >
            <div
                style={{
                    width: 140,
                    height: 140,
                    backgroundColor: color,
                    borderRadius: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 64,
                    boxShadow: `0 20px 60px ${color}50`,
                }}
            >
                {emoji}
            </div>
        </div>
    );
};

export const ChaosScene: React.FC = () => {
    const frame = useCurrentFrame();

    // Scene: 180-720 frames (3-12s at 60fps)
    // Fast entries, overlapping motion, confusion

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#000000",
            }}
        >
            {/* Subtle background glow */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 600,
                    height: 600,
                    background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
                    transform: "translate(-50%, -50%)",
                }}
            />

            {/* Chaotic items entering */}
            {chaosItems.map((item, index) => (
                <ChaosItem
                    key={item.id}
                    emoji={item.emoji}
                    color={item.color}
                    rotation={item.rotation}
                    index={index}
                    startFrame={index * 40} // Staggered entries
                />
            ))}
        </AbsoluteFill>
    );
};
