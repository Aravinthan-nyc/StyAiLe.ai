import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Sequence,
} from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { TapRipple, TapPulse } from "../components/TapRipple";
import { CameraMove } from "../components/CameraMove";

// Mock wardrobe items
const wardrobeItems = [
    { id: 1, name: "Blue Oxford Shirt", category: "TOP", color: "#3b82f6" },
    { id: 2, name: "Black Slim Jeans", category: "BOTTOM", color: "#1f2937" },
    { id: 3, name: "Summer Dress", category: "DRESS", color: "#ec4899" },
    { id: 4, name: "Leather Jacket", category: "OUTERWEAR", color: "#78350f" },
    { id: 5, name: "White Sneakers", category: "SHOES", color: "#f3f4f6" },
    { id: 6, name: "Canvas Tote", category: "ACCESSORY", color: "#84cc16" },
];

const categories = ["All", "Top", "Bottom", "Dress", "Shoes"];

export const WardrobeDemo: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Scene: 1080-1800 frames (18-30s at 60fps = 720 frames)
    // Phone appears, wardrobe demo, tap animations

    // Phone entrance
    const phoneEntrance = spring({
        frame,
        fps,
        config: { damping: 20, stiffness: 80 },
        durationInFrames: 45,
    });

    // Category tab switch simulation (around frame 200)
    const categorySwitch = frame > 200 && frame < 280;
    const activeCategory = frame < 200 ? 0 : frame < 400 ? 1 : frame < 550 ? 2 : 0;

    // Item tap simulation (frame 350-400)
    const showItemTap = frame > 350 && frame < 420;
    const tappedItemIndex = 2;

    // Scroll simulation
    const scrollOffset = interpolate(frame, [100, 300, 500], [0, -100, -50], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            <CameraMove type="focus" startFrame={0} duration={200} intensity={0.3}>
                {/* Phone with app */}
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        opacity: phoneEntrance,
                        transform: `scale(${interpolate(phoneEntrance, [0, 1], [0.9, 1])})`,
                    }}
                >
                    <PhoneFrame scale={0.88}>
                        {/* App Content - Wardrobe View simulation */}
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#050505",
                                padding: 20,
                                paddingTop: 60,
                                overflow: "hidden",
                            }}
                        >
                            {/* Header */}
                            <div style={{ marginBottom: 24 }}>
                                <h1
                                    style={{
                                        fontSize: 32,
                                        fontWeight: 700,
                                        color: "#ffffff",
                                        margin: 0,
                                        fontFamily: "Inter, system-ui, sans-serif",
                                    }}
                                >
                                    Wardrobe
                                </h1>
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: "rgba(255,255,255,0.4)",
                                        margin: 0,
                                        marginTop: 4,
                                        letterSpacing: 1,
                                    }}
                                >
                                    {wardrobeItems.length} ITEMS COLLECTED
                                </p>
                            </div>

                            {/* Category tabs */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    marginBottom: 20,
                                    overflow: "hidden",
                                }}
                            >
                                {categories.map((cat, i) => (
                                    <div
                                        key={cat}
                                        style={{
                                            padding: "10px 18px",
                                            borderRadius: 20,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            backgroundColor: i === activeCategory ? "#ffffff" : "rgba(255,255,255,0.05)",
                                            color: i === activeCategory ? "#000000" : "rgba(255,255,255,0.5)",
                                            fontFamily: "Inter, system-ui, sans-serif",
                                            transition: "all 0.3s",
                                        }}
                                    >
                                        {cat}
                                    </div>
                                ))}
                            </div>

                            {/* Items grid */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 16,
                                    transform: `translateY(${scrollOffset}px)`,
                                }}
                            >
                                {wardrobeItems.map((item, index) => {
                                    const itemEntrance = spring({
                                        frame: frame - 45 - index * 8,
                                        fps,
                                        config: { damping: 15, stiffness: 100 },
                                    });

                                    const isTapped = showItemTap && index === tappedItemIndex;
                                    const tapScale = isTapped
                                        ? interpolate(frame - 350, [0, 10, 20], [1, 0.95, 1.02], {
                                            extrapolateRight: "clamp",
                                        })
                                        : 1;

                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                aspectRatio: "4/5",
                                                borderRadius: 24,
                                                overflow: "hidden",
                                                backgroundColor: "rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.05)",
                                                opacity: Math.max(0, itemEntrance),
                                                transform: `scale(${itemEntrance * tapScale}) translateY(${interpolate(
                                                    itemEntrance,
                                                    [0, 1],
                                                    [30, 0]
                                                )}px)`,
                                                position: "relative",
                                            }}
                                        >
                                            {/* Color block as placeholder image */}
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    backgroundColor: item.color,
                                                    display: "flex",
                                                    alignItems: "flex-end",
                                                    padding: 12,
                                                }}
                                            >
                                                <div>
                                                    <p
                                                        style={{
                                                            fontSize: 12,
                                                            color: "#ffffff",
                                                            margin: 0,
                                                            fontWeight: 500,
                                                            fontFamily: "Inter, system-ui, sans-serif",
                                                            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                                                        }}
                                                    >
                                                        {item.name}
                                                    </p>
                                                    <p
                                                        style={{
                                                            fontSize: 10,
                                                            color: "rgba(255,255,255,0.7)",
                                                            margin: 0,
                                                            marginTop: 2,
                                                            fontFamily: "Inter, system-ui, sans-serif",
                                                        }}
                                                    >
                                                        {item.category}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Tap ripple */}
                                            {isTapped && <TapRipple x={50} y={50} startFrame={350} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bottom navigation */}
                        <div
                            style={{
                                position: "absolute",
                                bottom: 20,
                                left: 20,
                                right: 20,
                                height: 70,
                                backgroundColor: "rgba(30,30,30,0.9)",
                                borderRadius: 35,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-around",
                                padding: "0 20px",
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}
                        >
                            {["👕", "➕", "✨", "⚙️"].map((icon, i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 25,
                                        backgroundColor: i === 0 ? "#ffffff" : "transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 22,
                                    }}
                                >
                                    {icon}
                                </div>
                            ))}
                        </div>
                    </PhoneFrame>
                </div>
            </CameraMove>
        </AbsoluteFill>
    );
};
