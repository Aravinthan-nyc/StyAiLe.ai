import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Sequence,
} from "remotion";
import { AppWrapper } from "../utils/AppWrapper";
import { ReelCaption } from "../components/ReelCaption";
import { mockWardrobeItems, mockOutfitSuggestions, getOutfitItems } from "../utils/mockData";

/**
 * Clip 3: AI Assistant in Action (15-30s, 900 frames)
 * Demonstrate: open assistant → select context → AI analyzes → outfit generated
 */
export const Clip3_AIAssistant: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Timeline:
    // 0-150: Navigate to assistant (show stylist view)
    // 150-300: Occasion chips appear
    // 300-450: User selects "Work" occasion
    // 450-600: AI analyzing animation
    // 600-900: Outfit cards appear

    const assistantEntrance = spring({
        frame,
        fps,
        config: { damping: 20, stiffness: 100 },
    });

    const showOccasions = frame >= 150;
    const workSelected = frame >= 300;
    const showAnalyzing = frame >= 450 && frame < 600;
    const showOutfitCards = frame >= 600;

    const outfitCardsEntrance = spring({
        frame: frame - 600,
        fps,
        config: { damping: 12, stiffness: 100 },
    });

    // Get the work outfit suggestion
    const workOutfit = mockOutfitSuggestions.work[0];
    const outfitItems = getOutfitItems(workOutfit);

    return (
        <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            <AppWrapper>
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        transform: `translateX(${interpolate(
                            assistantEntrance,
                            [0, 1],
                            [100, 0],
                            { extrapolateLeft: "clamp" }
                        )}%)`,
                        opacity: assistantEntrance,
                    }}
                >
                    {/* Stylist View Header */}
                    <div
                        style={{
                            padding: "60px 30px 30px",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        }}
                    >
                        <h1
                            style={{
                                fontSize: 42,
                                fontWeight: 700,
                                color: "#ffffff",
                                margin: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            AI Stylist
                        </h1>
                    </div>

                    {/* Content area */}
                    <div style={{ padding: 30 }}>
                        {/* Occasion chips */}
                        {showOccasions && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    marginBottom: 40,
                                    flexWrap: "wrap",
                                }}
                            >
                                {["Work", "Casual", "Date", "Party"].map((occasion, i) => {
                                    const chipEntrance = spring({
                                        frame: frame - 150 - i * 10,
                                        fps,
                                        config: { damping: 15, stiffness: 150 },
                                    });

                                    const isSelected = occasion === "Work" && workSelected;

                                    return (
                                        <div
                                            key={occasion}
                                            style={{
                                                padding: "16px 28px",
                                                borderRadius: 24,
                                                backgroundColor: isSelected
                                                    ? "#ffffff"
                                                    : "rgba(255, 255, 255, 0.05)",
                                                color: isSelected ? "#000000" : "rgba(255, 255, 255, 0.6)",
                                                fontSize: 22,
                                                fontWeight: 600,
                                                opacity: Math.max(0, chipEntrance),
                                                transform: `scale(${chipEntrance})`,
                                                transition: "all 0.3s",
                                            }}
                                        >
                                            {occasion}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* AI Analyzing state */}
                        {showAnalyzing && (
                            <div
                                style={{
                                    backgroundColor: "rgba(100, 100, 255, 0.1)",
                                    padding: 30,
                                    borderRadius: 24,
                                    border: "1px solid rgba(100, 100, 255, 0.2)",
                                    textAlign: "center",
                                }}
                            >
                                <div
                                    style={{
                                        width: 60,
                                        height: 60,
                                        border: "4px solid rgba(255, 255, 255, 0.2)",
                                        borderTopColor: "#ffffff",
                                        borderRadius: "50%",
                                        animation: "spin 1s linear infinite",
                                        margin: "0 auto 20px",
                                    }}
                                />
                                <p
                                    style={{
                                        fontSize: 24,
                                        color: "#ffffff",
                                        margin: 0,
                                        fontWeight: 600,
                                    }}
                                >
                                    AI is analyzing your wardrobe...
                                </p>
                            </div>
                        )}

                        {/* Outfit cards */}
                        {showOutfitCards && (
                            <div
                                style={{
                                    opacity: Math.max(0, outfitCardsEntrance),
                                }}
                            >
                                {/* AI Response message */}
                                <div
                                    className="glass-card"
                                    style={{
                                        padding: 24,
                                        borderRadius: 24,
                                        marginBottom: 24,
                                        border: "1px solid rgba(100, 100, 255, 0.2)",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            marginBottom: 12,
                                        }}
                                    >

                                        <span
                                            style={{
                                                fontSize: 14,
                                                color: "rgba(255, 255, 255, 0.5)",
                                                fontWeight: 600,
                                            }}
                                        >
                                            AI Stylist
                                        </span>
                                    </div>
                                    <p
                                        style={{
                                            fontSize: 22,
                                            color: "#ffffff",
                                            margin: 0,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {workOutfit.reasoning}
                                    </p>
                                </div>

                                {/* Outfit items visualization */}
                                <div
                                    style={{
                                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                                        padding: 24,
                                        borderRadius: 24,
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                    }}
                                >
                                    <p
                                        style={{
                                            fontSize: 14,
                                            color: "rgba(255, 255, 255, 0.5)",
                                            margin: 0,
                                            marginBottom: 16,
                                            textTransform: "uppercase",
                                            letterSpacing: 1,
                                            fontWeight: 600,
                                        }}
                                    >
                                        Recommended Outfit
                                    </p>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 16,
                                            justifyContent: "center",
                                        }}
                                    >
                                        {outfitItems.map((item, i) => {
                                            const itemEntrance = spring({
                                                frame: frame - 600 - 30 - i * 15,
                                                fps,
                                                config: { damping: 12, stiffness: 100 },
                                            });

                                            return (
                                                <div
                                                    key={item.id}
                                                    style={{
                                                        width: 180,
                                                        opacity: Math.max(0, itemEntrance),
                                                        transform: `scale(${itemEntrance}) translateY(${interpolate(
                                                            itemEntrance,
                                                            [0, 1],
                                                            [40, 0]
                                                        )}px)`,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            aspectRatio: "3/4",
                                                            borderRadius: 16,
                                                            overflow: "hidden",
                                                            marginBottom: 12,
                                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                                        }}
                                                    >
                                                        <img
                                                            src={item.imageData}
                                                            alt={item.description}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                            }}
                                                        />
                                                    </div>
                                                    <p
                                                        style={{
                                                            fontSize: 14,
                                                            color: "#ffffff",
                                                            margin: 0,
                                                            fontWeight: 600,
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        {item.description}
                                                    </p>
                                                    <p
                                                        style={{
                                                            fontSize: 12,
                                                            color: "rgba(255, 255, 255, 0.5)",
                                                            margin: 0,
                                                            marginTop: 4,
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        {item.category}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom navigation */}
                    <div
                        className="glass-card-strong"
                        style={{
                            position: "absolute",
                            bottom: 30,
                            left: 30,
                            right: 30,
                            height: 80,
                            borderRadius: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-around",
                            padding: "0 20px",
                        }}
                    >
                        {["W", "+", "AI", "S"].map((label, i) => (
                            <div
                                key={i}
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 30,
                                    backgroundColor: i === 2 ? "#ffffff" : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: i === 2 ? "#000000" : "rgba(255,255,255,0.6)",
                                }}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
                </div>
            </AppWrapper>

            {/* Text overlays */}
            <Sequence from={0} durationInFrames={200}>
                <ReelCaption
                    text="Ask the assistant."
                    startFrame={30}
                    position="center"
                    size="medium"
                    exitFrame={180}
                />
            </Sequence>

            <Sequence from={300} durationInFrames={200}>
                <ReelCaption
                    text="AI checks your wardrobe."
                    startFrame={0}
                    position="center"
                    size="medium"
                    exitFrame={180}
                />
            </Sequence>

            <Sequence from={600} durationInFrames={200}>
                <ReelCaption
                    text="Outfit, decided for you."
                    startFrame={0}
                    position="center"
                    size="medium"
                    exitFrame={180}
                />
            </Sequence>

            <Sequence from={800} durationInFrames={100}>
                <ReelCaption
                    text="Just get dressed."
                    startFrame={0}
                    position="center"
                    size="small"
                />
            </Sequence>

            <style>
                {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
            </style>
        </AbsoluteFill>
    );
};
