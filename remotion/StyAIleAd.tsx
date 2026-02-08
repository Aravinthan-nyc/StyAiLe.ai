import React from "react";
import {
    AbsoluteFill,
    Sequence,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import {
    TransitionSeries,
    linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

// Import all scenes
import { OpeningHook } from "./scenes/OpeningHook";
import { ChaosScene } from "./scenes/ChaosScene";
import { ResolutionScene } from "./scenes/ResolutionScene";
import { WardrobeDemo } from "./scenes/WardrobeDemo";
import { StylistDemo } from "./scenes/StylistDemo";
import { BenefitsScene } from "./scenes/BenefitsScene";
import { CTAScene } from "./scenes/CTAScene";
import { OutroScene } from "./scenes/OutroScene";

/**
 * StyAIle.ai 60-Second Cinematic Ad
 * 
 * Timeline (at 60fps):
 * - Scene 1: Opening Hook      0-180 frames     (0-3s)
 * - Scene 2: Chaos            180-720 frames    (3-12s)
 * - Scene 3: Resolution       720-1080 frames   (12-18s)
 * - Scene 4: Wardrobe Demo   1080-1800 frames   (18-30s)
 * - Scene 5: Stylist Demo    1800-2400 frames   (30-40s)
 * - Scene 6: Benefits        2400-3000 frames   (40-50s)
 * - Scene 7: CTA             3000-3540 frames   (50-59s)
 * - Scene 8: Outro           3540-3600 frames   (59-60s)
 * 
 * Total: 3600 frames = 60 seconds at 60fps
 */

export const StyAIleAd: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Scene durations in frames
    const sceneDurations = {
        openingHook: 180,      // 3s
        chaos: 540,            // 9s
        resolution: 360,       // 6s
        wardrobeDemo: 720,     // 12s
        stylistDemo: 600,      // 10s
        benefits: 600,         // 10s
        cta: 540,              // 9s
        outro: 60,             // 1s
    };

    // Transition duration
    const transitionDuration = 20;

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#000000",
                fontFamily: "Inter, system-ui, sans-serif",
            }}
        >
            <TransitionSeries>
                {/* Scene 1: Opening Hook (0-3s) */}
                <TransitionSeries.Sequence durationInFrames={sceneDurations.openingHook}>
                    <OpeningHook />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionDuration })}
                />

                {/* Scene 2: Chaos (3-12s) */}
                <TransitionSeries.Sequence durationInFrames={sceneDurations.chaos}>
                    <ChaosScene />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionDuration })}
                />

                {/* Scene 3: Resolution / Brand Reveal (12-18s) */}
                <TransitionSeries.Sequence durationInFrames={sceneDurations.resolution}>
                    <ResolutionScene />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionDuration })}
                />

                {/* Scene 4: Wardrobe Demo (18-30s) */}
                <TransitionSeries.Sequence durationInFrames={sceneDurations.wardrobeDemo}>
                    <WardrobeDemo />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionDuration })}
                />

                {/* Scene 5: Stylist Demo (30-40s) */}
                <TransitionSeries.Sequence durationInFrames={sceneDurations.stylistDemo}>
                    <StylistDemo />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionDuration })}
                />

                {/* Scene 6: Benefits (40-50s) */}
                <TransitionSeries.Sequence durationInFrames={sceneDurations.benefits}>
                    <BenefitsScene />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionDuration })}
                />

                {/* Scene 7: CTA (50-59s) */}
                <TransitionSeries.Sequence durationInFrames={sceneDurations.cta}>
                    <CTAScene />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionDuration })}
                />

                {/* Scene 8: Outro (59-60s) */}
                <TransitionSeries.Sequence durationInFrames={sceneDurations.outro}>
                    <OutroScene />
                </TransitionSeries.Sequence>
            </TransitionSeries>
        </AbsoluteFill>
    );
};
