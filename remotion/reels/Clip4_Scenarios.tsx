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
import { mockOutfitSuggestions, getOutfitItems } from "../utils/mockData";

/**
 * Clip 4: Real-Life Scenarios (30-45s, 900 frames)
 * Show 3 contexts: morning rush, casual outing, special occasion
 * Each scenario: 300 frames
 */
export const Clip4_Scenarios: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Determine which scenario is active
    const scenario1 = frame < 300; // Morning rush (Work)
    const scenario2 = frame >= 300 && frame < 600; // Casual outing
    const scenario3 = frame >= 600; // Special occasion (Party)

    const currentScenario = scenario1 ? "work" : scenario2 ? "casual" : "party";
    const scenarioStartFrame = scenario1 ? 0 : scenario2 ? 300 : 600;

    // Transition between scenarios
    const transitionProgress = spring({
        frame: frame - scenarioStartFrame,
        fps,
        config: { damping: 20, stiffness: 100 },
    });

    // Get outfit for current scenario
    const outfit = mockOutfitSuggestions[currentScenario as keyof typeof mockOutfitSuggestions][0];
    const outfitItems = getOutfitItems(outfit);

    // Scenario metadata
    const scenarioData = {
        work: {
            title: "Morning Rush",
            occasion: "Work",
            caption: "Running late? Let the app decide.",
        },
        casual: {
            title: "Casual Outing",
            occasion: "Casual",
            caption: "Going out? You're covered.",
        },
        party: {
            title: "Special Occasion",
            occasion: "Party",
            caption: "Something important? Wear with confidence.",
        },
    };

    const current = scenarioData[currentScenario as keyof typeof scenarioData];

    return (
        <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            <AppWrapper>
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        opacity: transitionProgress,
                        transform: `scale(${interpolate(transitionProgress, [0, 1], [0.95, 1])})`,
                    }}
                >
                    {/* Stylist View with current scenario */}
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

                    <div style={{ padding: 30 }}>
                        {/* Occasion chips - current one selected */}
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                marginBottom: 40,
                                flexWrap: "wrap",
                            }}
                        >
                            {["Work", "Casual", "Date", "Party"].map((occasion) => {
                                const isSelected = occasion === current.occasion;

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
                                        }}
                                    >
                                        {occasion}
                                    </div>
                                );
                            })}
                        </div>

                        {/* AI Response */}
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
                                {outfit.reasoning}
                            </p>
                        </div>

                        {/* Outfit visualization */}
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
                                        frame: frame - scenarioStartFrame - 20 - i * 10,
                                        fps,
                                        config: { damping: 12, stiffness: 100 },
                                    });

                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                width: outfitItems.length === 2 ? 220 : 180,
                                                opacity: Math.max(0, itemEntrance),
                                                transform: `scale(${itemEntrance})`,
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
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
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

            {/* Text overlays for each scenario */}
            <Sequence from={0} durationInFrames={300}>
                <ReelCaption
                    text={scenarioData.work.caption}
                    startFrame={30}
                    position="center"
                    size="medium"
                    exitFrame={270}
                />
            </Sequence>

            <Sequence from={300} durationInFrames={300}>
                <ReelCaption
                    text={scenarioData.casual.caption}
                    startFrame={0}
                    position="center"
                    size="medium"
                    exitFrame={270}
                />
            </Sequence>

            <Sequence from={600} durationInFrames={300}>
                <ReelCaption
                    text={scenarioData.party.caption}
                    startFrame={0}
                    position="center"
                    size="medium"
                    exitFrame={250}
                />
            </Sequence>

            {/* Final message */}
            <Sequence from={850} durationInFrames={50}>
                <ReelCaption
                    text="One app. Every outfit decision."
                    startFrame={0}
                    position="center"
                    size="large"
                />
            </Sequence>
        </AbsoluteFill>
    );
};
