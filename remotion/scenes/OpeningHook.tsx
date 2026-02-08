import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Sequence,
} from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { CameraMove } from "../components/CameraMove";

export const OpeningHook: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Scene: 0-180 frames (0-3s at 60fps)
    // Dead black → bold statement → fade out

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <CameraMove type="focus" startFrame={60} duration={100} intensity={0.5}>
                <Sequence from={60} durationInFrames={100}>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 20,
                            padding: 40,
                        }}
                    >
                        <AnimatedText
                            text="What if your closet"
                            startFrame={0}
                            fontSize={56}
                            fontWeight={300}
                            color="rgba(255,255,255,0.6)"
                            exitFrame={80}
                        />
                        <AnimatedText
                            text="knew your style?"
                            startFrame={15}
                            fontSize={72}
                            fontWeight={700}
                            color="#ffffff"
                            exitFrame={85}
                        />
                    </div>
                </Sequence>
            </CameraMove>
        </AbsoluteFill>
    );
};
