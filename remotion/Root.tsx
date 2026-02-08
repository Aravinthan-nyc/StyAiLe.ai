import React from "react";
import { Composition } from "remotion";
import { OutfitShowcase } from "./compositions/OutfitShowcase";
import { StyAIleAd } from "./StyAIleAd";
import { InstagramReel } from "./InstagramReel";

export const RemotionRoot: React.FC = () => {
    return (
        <>
            {/* Instagram Reel - Real UI Product Demo (9:16 vertical) */}
            <Composition
                id="InstagramReel"
                component={InstagramReel}
                durationInFrames={3600}
                fps={60}
                width={1080}
                height={1920}
            />

            {/* 60-Second Cinematic Ad - 9:16 vertical format */}
            <Composition
                id="StyAIleAd"
                component={StyAIleAd}
                durationInFrames={3600}
                fps={60}
                width={1080}
                height={1920}
            />

            {/* Original outfit showcase composition */}
            <Composition
                id="OutfitShowcase"
                component={OutfitShowcase}
                durationInFrames={300}
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    title: "Summer Collection",
                    items: [],
                    backgroundColor: "#1a1a2e",
                    accentColor: "#00d9ff",
                }}
            />
        </>
    );
};
