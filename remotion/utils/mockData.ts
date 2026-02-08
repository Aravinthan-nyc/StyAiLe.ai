import { WardrobeItem, ClothingCategory, OutfitSuggestion } from "../../types";
import whiteStripShirt from "./white-strip-shirt.png";
import wideBlackJeans from "./wide-high-black-jeans.png";
import greenTshirt from "./green-tshirt.png";
import lightBlueJeans from "./light-blue-jeans.png";

/**
 * Mock wardrobe items for realistic demonstrations
 */
export const mockWardrobeItems: WardrobeItem[] = [
    {
        id: "1",
        description: "White Striped Shirt",
        category: ClothingCategory.TOP,
        colors: ["white", "blue"],
        tags: ["striped", "formal"],
        occasions: ["work", "casual"],
        mood: ["professional"],
        timing: ["morning", "afternoon"],
        season: ["all-season"],
        imageData: whiteStripShirt,
        createdAt: Date.now(),
    },
    {
        id: "2",
        description: "Wide High Black Jeans",
        category: ClothingCategory.BOTTOM,
        colors: ["black"],
        tags: ["denim", "wide-leg"],
        occasions: ["casual", "work"],
        mood: ["professional", "relaxed"],
        timing: ["morning", "afternoon", "evening"],
        season: ["all-season"],
        imageData: wideBlackJeans,
        createdAt: Date.now(),
    },
    {
        id: "3",
        description: "Green T-Shirt",
        category: ClothingCategory.TOP,
        colors: ["green"],
        tags: ["cotton", "basic"],
        occasions: ["casual"],
        mood: ["relaxed"],
        timing: ["morning", "afternoon"],
        season: ["summer", "spring"],
        imageData: greenTshirt,
        createdAt: Date.now(),
    },
    {
        id: "4",
        description: "Light Blue Jeans",
        category: ClothingCategory.BOTTOM,
        colors: ["blue", "light"],
        tags: ["denim", "casual"],
        occasions: ["casual"],
        mood: ["relaxed"],
        timing: ["morning", "afternoon"],
        season: ["all-season"],
        imageData: lightBlueJeans,
        createdAt: Date.now(),
    },
];

/**
 * Mock AI outfit suggestions
 */
export const mockOutfitSuggestions: Record<string, OutfitSuggestion[]> = {
    work: [
        {
            id: "work-1",
            name: "Office Professional",
            itemIds: ["1", "2"], // White Shirt + Black Jeans
            score: 0.95,
            reasoning: "The White Striped Shirt paired with Wide High Black Jeans creates a balanced, professional silhouette suitable for the office.",
            occasion: "work",
        },
    ],
    casual: [
        {
            id: "casual-1",
            name: "Relaxed Weekend",
            itemIds: ["3", "4"], // Green T-Shirt + Light Blue Jeans
            score: 0.92,
            reasoning: "A classic Green T-Shirt with Light Blue Jeans offers a comfortable and stylish look for a relaxed day out.",
            occasion: "casual",
        },
    ],
    party: [
        {
            id: "party-1",
            name: "Smart Casual Evening",
            itemIds: ["1", "2"], // White Shirt + Black Jeans
            score: 0.88,
            reasoning: "Elevate the White Striped Shirt with Black Jeans for a smart-casual evening look.",
            occasion: "party",
        },
    ],
};

/**
 * Helper to get full item objects for an outfit
 */
export const getOutfitItems = (outfit: OutfitSuggestion): WardrobeItem[] => {
    return outfit.itemIds
        .map((id) => mockWardrobeItems.find((item) => item.id === id))
        .filter((item): item is WardrobeItem => item !== undefined);
};
