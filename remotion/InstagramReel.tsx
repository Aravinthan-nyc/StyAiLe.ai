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

// Import all clips
import { Clip1_Problem } from "./reels/Clip1_Problem";
import { Clip2_Upload } from "./reels/Clip2_Upload";
import { Clip3_AIAssistant } from "./reels/Clip3_AIAssistant";
import { Clip4_Scenarios } from "./reels/Clip4_Scenarios";
import { Clip5_CTA } from "./reels/Clip5_CTA";

/**
 * Instagram Reel - 60-Second Product Demo
 * 
 * Timeline (at 60fps):
 * - Clip 1: The Problem          0-300 frames      (0-5s)
 * - Clip 2: Upload Workflow    300-900 frames      (5-15s)
 * - Clip 3: AI Assistant       900-1800 frames     (15-30s)
 * - Clip 4: Real Scenarios    1800-2700 frames     (30-45s)
 * - Clip 5: CTA               2700-3600 frames     (45-60s)
 * 
 * Total: 3600 frames = 60 seconds at 60fps
 */

export const InstagramReel: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Clip durations in frames
    const clipDurations = {
        problem: 300,        // 5s
        upload: 600,         // 10s
        aiAssistant: 900,    // 15s
        scenarios: 900,      // 15s
        cta: 900,            // 15s
    };

    // Transition duration
    const transitionDuration = 25;

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#000000",
                fontFamily: "Inter, system-ui, sans-serif",
            }}
        >
            <TransitionSeries>
                {/* Clip 1: The Problem (0-5s) */}
                <TransitionSeries.Sequence durationInFrames={clipDurations.problem}>
                    <Clip1_Problem />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionDuration })}
                />

                {/* Clip 2: Upload Workflow (5-15s) */}
                <TransitionSeries.Sequence durationInFrames={clipDurations.upload}>
                    <Clip2_Upload />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionDuration })}
                />

                {/* Clip 3: AI Assistant (15-30s) */}
                <TransitionSeries.Sequence durationInFrames={clipDurations.aiAssistant}>
                    <Clip3_AIAssistant />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionDuration })}
                />

                {/* Clip 4: Real-Life Scenarios (30-45s) */}
                <TransitionSeries.Sequence durationInFrames={clipDurations.scenarios}>
                    <Clip4_Scenarios />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionDuration })}
                />

                {/* Clip 5: Call to Action (45-60s) */}
                <TransitionSeries.Sequence durationInFrames={clipDurations.cta}>
                    <Clip5_CTA />
                </TransitionSeries.Sequence>
            </TransitionSeries>
        </AbsoluteFill>
    );
};
