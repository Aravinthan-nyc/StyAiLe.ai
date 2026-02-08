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
import { mockWardrobeItems } from "../utils/mockData";
import { AppView, ClothingCategory } from "../../types";

/**
 * Clip 2: Upload Workflow (5-15s, 600 frames)
 * Show real app workflow: WardrobeView → AddItemView → capture → item added
 */
export const Clip2_Upload: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Timeline:
    // 0-150: Empty wardrobe state
    // 150-200: Transition to add item screen
    // 200-350: Camera interface simulation
    // 350-400: Analyzing animation
    // 400-600: Item appears in wardrobe grid

    const showEmptyState = frame < 150;
    const showAddItemView = frame >= 150 && frame < 400;
    const showCameraCapture = frame >= 200 && frame < 350;
    const showAnalyzing = frame >= 350 && frame < 400;
    const showItemAdded = frame >= 400;

    // Transition animation
    const addItemTransition = spring({
        frame: frame - 150,
        fps,
        config: { damping: 20, stiffness: 100 },
    });

    const itemAddedTransition = spring({
        frame: frame - 400,
        fps,
        config: { damping: 15, stiffness: 100 },
    });

    return (
        <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            <AppWrapper>
                {/* Empty Wardrobe State */}
                {showEmptyState && (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 40,
                        }}
                    >
                        <div
                            className="glass-card"
                            style={{
                                padding: 50,
                                borderRadius: 30,
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: 80,
                                    height: 80,
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    borderRadius: 40,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 30px",
                                    fontSize: 40,
                                }}
                            >
                                +
                            </div>
                            <h2
                                style={{
                                    fontSize: 42,
                                    fontWeight: 700,
                                    color: "#ffffff",
                                    margin: 0,
                                    marginBottom: 12,
                                }}
                            >
                                Wardrobe Empty
                            </h2>
                            <p
                                style={{
                                    fontSize: 18,
                                    color: "rgba(255, 255, 255, 0.5)",
                                    margin: 0,
                                    marginBottom: 40,
                                }}
                            >
                                Add your favorite pieces
                            </p>
                            <button
                                style={{
                                    padding: "18px 40px",
                                    backgroundColor: "#ffffff",
                                    color: "#000000",
                                    border: "none",
                                    borderRadius: 30,
                                    fontSize: 18,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                + Add First Item
                            </button>
                        </div>
                    </div>
                )}

                {/* Add Item / Camera View */}
                {showAddItemView && (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            transform: `translateY(${interpolate(
                                addItemTransition,
                                [0, 1],
                                [100, 0],
                                { extrapolateLeft: "clamp" }
                            )}%)`,
                            opacity: addItemTransition,
                        }}
                    >
                        {/* Camera interface simulation */}
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#1a1a1a",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    padding: "60px 30px 30px",
                                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                                }}
                            >
                                <h2
                                    style={{
                                        fontSize: 28,
                                        fontWeight: 700,
                                        color: "#ffffff",
                                        margin: 0,
                                    }}
                                >
                                    Add Item
                                </h2>
                            </div>

                            {/* Camera viewfinder */}
                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 40,
                                }}
                            >
                                <div
                                    style={{
                                        width: "80%",
                                        aspectRatio: "3/4",
                                        backgroundColor: "#2a2a2a",
                                        borderRadius: 30,
                                        border: "3px solid rgba(255, 255, 255, 0.2)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                >
                                    {/* Show the actual shirt image being captured */}
                                    <img
                                        src={mockWardrobeItems[0].imageData}
                                        alt="Capturing shirt"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />

                                    {/* Capture flash effect */}
                                    {showCameraCapture && frame >= 280 && frame < 290 && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                backgroundColor: "#ffffff",
                                                opacity: interpolate(frame - 280, [0, 10], [0, 1], {
                                                    extrapolateRight: "clamp",
                                                }),
                                            }}
                                        />
                                    )}

                                    {/* Analyzing state */}
                                    {showAnalyzing && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                backgroundColor: "rgba(0, 0, 0, 0.8)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexDirection: "column",
                                                gap: 20,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 50,
                                                    height: 50,
                                                    border: "4px solid rgba(255, 255, 255, 0.2)",
                                                    borderTopColor: "#ffffff",
                                                    borderRadius: "50%",
                                                    animation: "spin 1s linear infinite",
                                                }}
                                            />
                                            <p
                                                style={{
                                                    fontSize: 18,
                                                    color: "#ffffff",
                                                    margin: 0,
                                                }}
                                            >
                                                Analyzing...
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Capture button */}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 100,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: 40,
                                            backgroundColor: frame < 280 ? "#ffffff" : "rgba(255, 255, 255, 0.3)",
                                            border: "5px solid rgba(255, 255, 255, 0.3)",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Item Added to Wardrobe */}
                {showItemAdded && (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            opacity: itemAddedTransition,
                        }}
                    >
                        {/* Simulated wardrobe grid with new item */}
                        <div style={{ padding: "80px 30px" }}>
                            <div style={{ marginBottom: 30 }}>
                                <h1
                                    style={{
                                        fontSize: 48,
                                        fontWeight: 700,
                                        color: "#ffffff",
                                        margin: 0,
                                    }}
                                >
                                    Wardrobe
                                </h1>
                                <p
                                    style={{
                                        fontSize: 20,
                                        color: "rgba(255, 255, 255, 0.4)",
                                        margin: 0,
                                        marginTop: 8,
                                    }}
                                >
                                    1 ITEM COLLECTED
                                </p>
                            </div>

                            {/* Grid with new item */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 20,
                                }}
                            >
                                <div
                                    className="glass-card"
                                    style={{
                                        aspectRatio: "4/5",
                                        borderRadius: 24,
                                        overflow: "hidden",
                                        transform: `scale(${interpolate(
                                            itemAddedTransition,
                                            [0, 0.8, 1],
                                            [0.8, 1.05, 1]
                                        )})`,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            position: "relative",
                                        }}
                                    >
                                        <img
                                            src={mockWardrobeItems[0].imageData}
                                            alt={mockWardrobeItems[0].description}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: "absolute",
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                padding: 16,
                                                background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                                            }}
                                        >
                                            <div>
                                                <p
                                                    style={{
                                                        fontSize: 22,
                                                        color: "#ffffff",
                                                        margin: 0,
                                                        fontWeight: 600,
                                                        textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                                                    }}
                                                >
                                                    {mockWardrobeItems[0].description}
                                                </p>
                                                <p
                                                    style={{
                                                        fontSize: 14,
                                                        color: "rgba(255, 255, 255, 0.8)",
                                                        margin: 0,
                                                        marginTop: 4,
                                                        textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                                                    }}
                                                >
                                                    {mockWardrobeItems[0].category}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AppWrapper>

            {/* Text overlays */}
            <Sequence from={0} durationInFrames={200}>
                <ReelCaption
                    text="Upload what you own."
                    startFrame={30}
                    position="bottom"
                    size="medium"
                    exitFrame={180}
                />
            </Sequence>

            <Sequence from={200} durationInFrames={200}>
                <ReelCaption
                    text="Tops. Bottoms. Accessories."
                    startFrame={0}
                    position="bottom"
                    size="small"
                    exitFrame={180}
                />
            </Sequence>

            <Sequence from={400} durationInFrames={200}>
                <ReelCaption
                    text="Everything stays organized."
                    startFrame={0}
                    position="center"
                    size="medium"
                />
            </Sequence>

            {/* Add spin animation for loading spinner */}
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
