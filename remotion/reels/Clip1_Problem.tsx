import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Sequence,
} from "remotion";
import { ReelCaption } from "../components/ReelCaption";

/**
 * Clip 1: The Problem (0-5s, 300 frames)
 * Emotional hook - outfit indecision
 * Abstract minimal visuals, no UI components
 */
export const Clip1_Problem: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Quick flashes of black/white contrast
    const flashCount = 8;
    const flashDuration = 3;
    const flashInterval = 25;

    // Calculate which flash we're in
    const currentFlash = Math.floor(frame / flashInterval);
    const flashLocalFrame = frame % flashInterval;

    // Flash brightness (quick pulses)
    const flashBrightness =
        flashLocalFrame < flashDuration && currentFlash < flashCount
            ? interpolate(flashLocalFrame, [0, flashDuration], [0.15, 0], {
                extrapolateRight: "clamp",
            })
            : 0;

    return (
        <AbsoluteFill style={{ backgroundColor: "#000000" }}>
            {/* Flash overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "#ffffff",
                    opacity: flashBrightness,
                }}
            />

            {/* Vignette for focus */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%)",
                }}
            />

            {/* Text sequence */}
            <Sequence from={30} durationInFrames={90}>
                <ReelCaption
                    text="I don't know what to wear."
                    startFrame={0}
                    position="center"
                    size="large"
                    exitFrame={70}
                />
            </Sequence>

            <Sequence from={100} durationInFrames={80}>
                <ReelCaption
                    text="Every day."
                    startFrame={0}
                    position="center"
                    size="medium"
                    exitFrame={60}
                />
            </Sequence>

            <Sequence from={180} durationInFrames={100}>
                <ReelCaption
                    text="Here's how we fix it."
                    startFrame={0}
                    position="center"
                    size="medium"
                />
            </Sequence>
        </AbsoluteFill>
    );
};
