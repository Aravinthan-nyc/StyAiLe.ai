import React from "react";
import {
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Img,
} from "remotion";

export interface AnimatedItemProps {
    imageUrl: string;
    name: string;
    category: string;
    accentColor: string;
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({
    imageUrl,
    name,
    category,
    accentColor,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Scale animation
    const scale = spring({
        frame,
        fps,
        from: 0.5,
        to: 1,
        config: {
            damping: 10,
            stiffness: 80,
        },
    });

    // Opacity animation
    const opacity = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
    });

    // Slide up animation
    const translateY = spring({
        frame,
        fps,
        from: 30,
        to: 0,
        config: {
            damping: 12,
            stiffness: 100,
        },
    });

    return (
        <div
            style={{
                width: 280,
                backgroundColor: "#2d2d44",
                borderRadius: 16,
                overflow: "hidden",
                opacity,
                transform: `scale(${scale}) translateY(${translateY}px)`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${accentColor}20`,
            }}
        >
            {/* Image Container */}
            <div
                style={{
                    width: "100%",
                    height: 280,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {imageUrl ? (
                    <Img
                        src={imageUrl}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "#3d3d5c",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <span style={{ fontSize: 48, opacity: 0.5 }}>👕</span>
                    </div>
                )}

                {/* Category Badge */}
                <div
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        backgroundColor: accentColor,
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 20,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                    }}
                >
                    {category}
                </div>
            </div>

            {/* Item Name */}
            <div
                style={{
                    padding: 16,
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontSize: 18,
                        fontWeight: 600,
                        color: "#ffffff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {name}
                </h3>
            </div>
        </div>
    );
};
