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
import { SpringReveal } from "../components/SpringReveal";

// Chat messages simulation
const chatMessages = [
    { type: "user", text: "What should I wear to a job interview?" },
    { type: "ai", text: "Based on your wardrobe, I recommend..." },
];

// Outfit suggestion cards
const outfitSuggestions = [
    { items: ["👔", "👖", "👞"], title: "Professional Look" },
    { items: ["🧥", "👕", "👟"], title: "Smart Casual" },
];

export const StylistDemo: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Scene: 1800-2400 frames (30-40s at 60fps = 600 frames)
    // Navigate to Stylist, show AI chat, outfit cards

    // Navigation tap animation
    const navTapFrame = 30;
    const showNavTap = frame >= navTapFrame && frame < navTapFrame + 30;

    // Screen transition
    const screenTransition = spring({
        frame: frame - 50,
        fps,
        config: { damping: 20, stiffness: 100 },
    });

    // Message appearances
    const msg1Frame = 120;
    const msg2Frame = 200;

    // Outfit cards
    const cardsFrame = 320;

    return (
        <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            <CameraMove type="focus" startFrame={100} duration={300} intensity={0.2}>
                <PhoneFrame scale={0.88}>
                    {/* Stylist View content */}
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "#050505",
                            transform: `translateX(${interpolate(
                                screenTransition,
                                [0, 1],
                                [100, 0]
                            )}%)`,
                            opacity: screenTransition,
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: "60px 20px 20px",
                                borderBottom: "1px solid rgba(255,255,255,0.05)",
                            }}
                        >
                            <h1
                                style={{
                                    fontSize: 28,
                                    fontWeight: 700,
                                    color: "#ffffff",
                                    margin: 0,
                                    fontFamily: "Inter, system-ui, sans-serif",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <span>✨</span> AI Stylist
                            </h1>
                        </div>

                        {/* Chat area */}
                        <div style={{ padding: 20, flex: 1 }}>
                            {/* Occasion chips */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    marginBottom: 24,
                                    flexWrap: "wrap",
                                }}
                            >
                                {["Work", "Casual", "Date", "Party"].map((occasion, i) => {
                                    const chipEntrance = spring({
                                        frame: frame - 80 - i * 10,
                                        fps,
                                        config: { damping: 15, stiffness: 150 },
                                    });

                                    return (
                                        <div
                                            key={occasion}
                                            style={{
                                                padding: "12px 20px",
                                                borderRadius: 20,
                                                backgroundColor: i === 0 ? "#ffffff" : "rgba(255,255,255,0.05)",
                                                color: i === 0 ? "#000000" : "rgba(255,255,255,0.6)",
                                                fontSize: 14,
                                                fontWeight: 600,
                                                fontFamily: "Inter, system-ui, sans-serif",
                                                opacity: Math.max(0, chipEntrance),
                                                transform: `scale(${chipEntrance})`,
                                            }}
                                        >
                                            {occasion}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* User message */}
                            {frame >= msg1Frame && (
                                <SpringReveal startFrame={msg1Frame} type="slideUp">
                                    <div
                                        style={{
                                            backgroundColor: "rgba(255,255,255,0.1)",
                                            padding: 16,
                                            borderRadius: 20,
                                            borderBottomRightRadius: 6,
                                            marginLeft: "20%",
                                            marginBottom: 16,
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontSize: 14,
                                                color: "#ffffff",
                                                margin: 0,
                                                fontFamily: "Inter, system-ui, sans-serif",
                                            }}
                                        >
                                            {chatMessages[0].text}
                                        </p>
                                    </div>
                                </SpringReveal>
                            )}

                            {/* AI response */}
                            {frame >= msg2Frame && (
                                <SpringReveal startFrame={msg2Frame} type="slideUp">
                                    <div
                                        style={{
                                            backgroundColor: "rgba(100,100,255,0.15)",
                                            padding: 16,
                                            borderRadius: 20,
                                            borderBottomLeftRadius: 6,
                                            marginRight: "20%",
                                            marginBottom: 20,
                                            border: "1px solid rgba(100,100,255,0.2)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                marginBottom: 8,
                                            }}
                                        >
                                            <span>✨</span>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: "rgba(255,255,255,0.5)",
                                                    fontFamily: "Inter, system-ui, sans-serif",
                                                }}
                                            >
                                                AI Stylist
                                            </span>
                                        </div>
                                        <p
                                            style={{
                                                fontSize: 14,
                                                color: "#ffffff",
                                                margin: 0,
                                                fontFamily: "Inter, system-ui, sans-serif",
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {chatMessages[1].text}
                                        </p>
                                    </div>
                                </SpringReveal>
                            )}

                            {/* Outfit suggestion cards */}
                            {frame >= cardsFrame && (
                                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                                    {outfitSuggestions.map((outfit, i) => {
                                        const cardEntrance = spring({
                                            frame: frame - cardsFrame - i * 15,
                                            fps,
                                            config: { damping: 12, stiffness: 100 },
                                        });

                                        return (
                                            <div
                                                key={i}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: "rgba(255,255,255,0.05)",
                                                    borderRadius: 20,
                                                    padding: 16,
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    opacity: Math.max(0, cardEntrance),
                                                    transform: `scale(${cardEntrance}) translateY(${interpolate(
                                                        cardEntrance,
                                                        [0, 1],
                                                        [30, 0]
                                                    )}px)`,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 8,
                                                        marginBottom: 12,
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    {outfit.items.map((item, j) => (
                                                        <div
                                                            key={j}
                                                            style={{
                                                                width: 50,
                                                                height: 50,
                                                                backgroundColor: "rgba(255,255,255,0.1)",
                                                                borderRadius: 12,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: 24,
                                                            }}
                                                        >
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                                <p
                                                    style={{
                                                        fontSize: 12,
                                                        color: "rgba(255,255,255,0.8)",
                                                        margin: 0,
                                                        textAlign: "center",
                                                        fontWeight: 600,
                                                        fontFamily: "Inter, system-ui, sans-serif",
                                                    }}
                                                >
                                                    {outfit.title}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
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
                                        backgroundColor: i === 2 ? "#ffffff" : "transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 22,
                                        position: "relative",
                                    }}
                                >
                                    {icon}
                                    {showNavTap && i === 2 && (
                                        <TapRipple x={50} y={50} startFrame={navTapFrame} size={60} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </PhoneFrame>
            </CameraMove>
        </AbsoluteFill>
    );
};
