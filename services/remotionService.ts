/**
 * Remotion Service
 * Provides utilities for rendering videos programmatically
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";

export interface RenderOptions {
    compositionId: string;
    outputPath: string;
    inputProps?: Record<string, unknown>;
    codec?: "h264" | "h265" | "vp8" | "vp9";
    imageFormat?: "jpeg" | "png";
    quality?: number;
}

/**
 * Render a video composition to MP4
 * Note: This runs in Node.js environment, not in browser
 */
export async function renderVideo(options: RenderOptions): Promise<string> {
    const {
        compositionId,
        outputPath,
        inputProps = {},
        codec = "h264",
        imageFormat = "jpeg",
        quality = 80,
    } = options;

    const entryPoint = path.resolve(process.cwd(), "remotion/index.ts");

    console.log("📦 Bundling Remotion project...");
    const bundleLocation = await bundle({
        entryPoint,
        // Remotion will create a temporary directory for the bundle
    });

    console.log("🎬 Selecting composition:", compositionId);
    const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: compositionId,
        inputProps,
    });

    console.log("🎥 Rendering video...");
    await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec,
        outputLocation: outputPath,
        inputProps,
        imageFormat,
        jpegQuality: quality,
        onProgress: ({ progress }) => {
            const percent = Math.round(progress * 100);
            process.stdout.write(`\r⏳ Progress: ${percent}%`);
        },
    });

    console.log("\n✅ Video rendered successfully:", outputPath);
    return outputPath;
}

/**
 * Helper to render an outfit showcase video
 */
export async function renderOutfitShowcase(
    items: Array<{
        id: string;
        imageUrl: string;
        name: string;
        category: string;
    }>,
    outputPath: string,
    options?: {
        title?: string;
        backgroundColor?: string;
        accentColor?: string;
    }
): Promise<string> {
    return renderVideo({
        compositionId: "OutfitShowcase",
        outputPath,
        inputProps: {
            title: options?.title ?? "My Outfit",
            items,
            backgroundColor: options?.backgroundColor ?? "#1a1a2e",
            accentColor: options?.accentColor ?? "#e94560",
        },
    });
}
