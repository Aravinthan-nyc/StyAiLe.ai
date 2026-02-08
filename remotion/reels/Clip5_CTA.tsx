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
 * Clip 5: Call to Action (45-60s, 900 frames)
 * Final outfit result → brand statement → CTA
 */
export const Clip5_CTA: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Timeline:
    // 0-250: Show final outfit result
    // 250-450: Transition to brand message
    // 450-650: Logo reveal
    // 650-900: CTA + static end card

    const showOutfit = frame < 250;
    const showBrandTransition = frame >= 250 && frame < 450;
    const showLogo = frame >= 450;
    const showCTA = frame >= 650;

    const brandTransition = spring({
        frame: frame - 250,
        fps,
        config: { damping: 200 },
    });

    const logoEntrance = spring({
        frame: frame - 450,
        fps,
        config: { damping: 12, stiffness: 100 },
    });

    const ctaEntrance = spring({
        frame: frame - 650,
        fps,
        config: { damping: 200 },
    });

    // Get work outfit for final display
    const finalOutfit = mockOutfitSuggestions.work[0];
    const outfitItems = getOutfitItems(finalOutfit);

    return (
        <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            {/* Final outfit result */}
            {showOutfit && (
                <AppWrapper>
                    <div
                        style={{
                            padding: "80px 30px",
                            opacity: interpolate(frame, [200, 250], [1, 0], {
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                            }),
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.03)",
                                padding: 30,
                                borderRadius: 30,
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                marginBottom: 30,
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 22,
                                    color: "rgba(255, 255, 255, 0.5)",
                                    margin: 0,
                                    marginBottom: 24,
                                    textTransform: "uppercase",
                                    letterSpacing: 1,
                                    fontWeight: 600,
                                    textAlign: "center",
                                }}
                            >
                                Your Outfit
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 20,
                                    justifyContent: "center",
                                }}
                            >
                                {outfitItems.map((item) => (
                                    <div key={item.id} style={{ width: 220 }}>
                                        <div
                                            style={{
                                                aspectRatio: "3/4",
                                                borderRadius: 20,
                                                overflow: "hidden",
                                                marginBottom: 16,
                                                border: "2px solid rgba(255, 255, 255, 0.1)",
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
                                                fontSize: 16,
                                                color: "#ffffff",
                                                margin: 0,
                                                fontWeight: 600,
                                                textAlign: "center",
                                            }}
                                        >
                                            {item.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </AppWrapper>
            )}

            {/* Brand transition and logo */}
            {showLogo && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 40,
                        opacity: Math.max(0, logoEntrance),
                    }}
                >
                    {/* Logo */}
                    <div
                        style={{
                            width: 140,
                            height: 140,
                            borderRadius: 35,
                            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow:
                                "0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            transform: `scale(${interpolate(
                                logoEntrance,
                                [0, 0.8, 1],
                                [0.8, 1.05, 1]
                            )})`,
                        }}
                    >
                        <span style={{ fontSize: 48, fontWeight: 800, color: "#ffffff" }}>S</span>
                    </div>

                    {/* App name */}
                    <h1
                        style={{
                            fontSize: 64,
                            fontWeight: 700,
                            color: "#ffffff",
                            fontFamily: "'Outfit', 'SF Pro Display', system-ui, sans-serif",
                            margin: 0,
                            transform: `translateY(${interpolate(
                                logoEntrance,
                                [0, 1],
                                [30, 0]
                            )}px)`,
                        }}
                    >
                        Sty<span style={{ opacity: 0.6 }}>Ai</span>Le
                        <span style={{ opacity: 0.4, fontSize: 36 }}>.ai</span>
                    </h1>

                    {/* Tagline */}
                    {showCTA && (
                        <p
                            style={{
                                fontSize: 26,
                                color: "rgba(255, 255, 255, 0.6)",
                                fontFamily: "Inter, system-ui, sans-serif",
                                margin: 0,
                                opacity: Math.max(0, ctaEntrance),
                                transform: `translateY(${interpolate(
                                    ctaEntrance,
                                    [0, 1],
                                    [20, 0]
                                )}px)`,
                            }}
                        >
                            Your AI-powered wardrobe assistant
                        </p>
                    )}

                    {/* CTA Button */}
                    {showCTA && (
                        <button
                            style={{
                                backgroundColor: "#ffffff",
                                color: "#000000",
                                border: "none",
                                borderRadius: 40,
                                padding: "22px 60px",
                                fontSize: 26,
                                fontWeight: 700,
                                fontFamily: "Inter, system-ui, sans-serif",
                                marginTop: 20,
                                boxShadow:
                                    "0 20px 60px rgba(255,255,255,0.2), 0 0 0 1px rgba(255,255,255,0.1)",
                                opacity: Math.max(0, ctaEntrance - 0.3),
                                transform: `scale(${interpolate(
                                    ctaEntrance,
                                    [0.3, 1],
                                    [0.9, 1],
                                    { extrapolateLeft: "clamp" }
                                )})`,
                                cursor: "pointer",
                            }}
                        >
                            Download the App
                        </button>
                    )}
                </div>
            )}

            {/* Text overlays */}
            <Sequence from={100} durationInFrames={150}>
                <ReelCaption
                    text="You don't have to decide anymore."
                    startFrame={0}
                    position="center"
                    size="medium"
                    exitFrame={130}
                />
            </Sequence>

            <Sequence from={250} durationInFrames={200}>
                <ReelCaption
                    text="Your wardrobe. Smarter decisions."
                    startFrame={0}
                    position="center"
                    size="large"
                    exitFrame={180}
                />
            </Sequence>
        </AbsoluteFill>
    );
};
