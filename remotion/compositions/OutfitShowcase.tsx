import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Sequence,
    Img,
} from "remotion";
import { AnimatedItem } from "./../components/AnimatedItem";

export interface OutfitItem {
    id: string;
    imageUrl: string;
    name: string;
    category: string;
}

export interface OutfitShowcaseProps {
    title: string;
    items: OutfitItem[];
    backgroundColor: string;
    accentColor: string;
}

export const OutfitShowcase: React.FC<OutfitShowcaseProps> = ({
    title,
    items,
    backgroundColor,
    accentColor,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Title animation
    const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
        extrapolateRight: "clamp",
    });

    const titleY = spring({
        frame,
        fps,
        from: -50,
        to: 0,
        config: {
            damping: 12,
            stiffness: 100,
        },
    });

    // Calculate stagger delay for items
    const itemDelay = 15; // frames between each item

    return (
        <AbsoluteFill
            style={{
                backgroundColor,
                fontFamily: "Inter, system-ui, sans-serif",
            }}
        >
            {/* Title Section */}
            <Sequence from={0}>
                <div
                    style={{
                        position: "absolute",
                        top: 80,
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        opacity: titleOpacity,
                        transform: `translateY(${titleY}px)`,
                    }}
                >
                    <h1
                        style={{
                            fontSize: 64,
                            fontWeight: 700,
                            color: "#ffffff",
                            margin: 0,
                            textShadow: `0 4px 20px ${accentColor}40`,
                        }}
                    >
                        {title}
                    </h1>
                    <div
                        style={{
                            width: 100,
                            height: 4,
                            backgroundColor: accentColor,
                            margin: "20px auto",
                            borderRadius: 2,
                        }}
                    />
                </div>
            </Sequence>

            {/* Items Grid */}
            <div
                style={{
                    position: "absolute",
                    top: 220,
                    left: 40,
                    right: 40,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 20,
                    justifyContent: "center",
                }}
            >
                {items.map((item, index) => (
                    <Sequence key={item.id} from={30 + index * itemDelay}>
                        <AnimatedItem
                            imageUrl={item.imageUrl}
                            name={item.name}
                            category={item.category}
                            accentColor={accentColor}
                        />
                    </Sequence>
                ))}
            </div>

            {/* Outro fade */}
            <Sequence from={durationInFrames - 30}>
                <AbsoluteFill
                    style={{
                        backgroundColor,
                        opacity: interpolate(
                            frame - (durationInFrames - 30),
                            [0, 30],
                            [0, 1],
                            { extrapolateRight: "clamp" }
                        ),
                    }}
                />
            </Sequence>
        </AbsoluteFill>
    );
};
