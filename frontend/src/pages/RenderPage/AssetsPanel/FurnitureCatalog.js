export const CATEGORIES = [
    "Bedroom",
    "Living Room",
    "Kitchen",
    "Bathroom",
    "Office",
    "Outdoor",
];

const dims = (widthCm, depthCm, heightCm) => ({
    width: widthCm,
    height: depthCm,
    height3d: heightCm,
    widthMeters: widthCm / 100,
    heightMeters: depthCm / 100,
    heightMeters3d: heightCm / 100,
});

export const FURNITURE_CATALOG = [
    // Bedroom
    { id: "bed-double", name: "Double Bed", category: "Bedroom", ...dims(160, 200, 45), fill: "#8B7355", icon: "🛏️", modelUrl: null },
    { id: "bed-single", name: "Single Bed", category: "Bedroom", ...dims(100, 200, 40), fill: "#9B8B6B", icon: "🛏️", modelUrl: null },
    { id: "nightstand", name: "Nightstand", category: "Bedroom", ...dims(50, 40, 55), fill: "#6B5B45", icon: "🗄️", modelUrl: null },
    { id: "wardrobe", name: "Wardrobe", category: "Bedroom", ...dims(120, 60, 200), fill: "#5C4033", icon: "🚪", modelUrl: null },
    { id: "dresser", name: "Dresser", category: "Bedroom", ...dims(120, 50, 90), fill: "#7B6B55", icon: "🗄️", modelUrl: null },

    // Living Room
    { id: "sofa-3seat", name: "3-Seat Sofa", category: "Living Room", ...dims(210, 90, 85), fill: "#6B7280", icon: "🛋️", modelUrl: null },
    { id: "sofa-2seat", name: "2-Seat Sofa", category: "Living Room", ...dims(160, 85, 80), fill: "#7B8290", icon: "🛋️", modelUrl: null },
    { id: "armchair", name: "Armchair", category: "Living Room", ...dims(85, 85, 85), fill: "#5B6270", icon: "💺", modelUrl: null },
    { id: "coffee-table", name: "Coffee Table", category: "Living Room", ...dims(120, 60, 40), fill: "#8B7355", icon: "🪑", modelUrl: null },
    { id: "tv-stand", name: "TV Stand", category: "Living Room", ...dims(160, 45, 50), fill: "#4B5563", icon: "📺", modelUrl: null },

    // Kitchen
    { id: "dining-table", name: "Dining Table", category: "Kitchen", ...dims(160, 90, 75), fill: "#8B7355", icon: "🪑", modelUrl: null },
    { id: "kitchen-island", name: "Kitchen Island", category: "Kitchen", ...dims(140, 70, 90), fill: "#6B7280", icon: "🍳", modelUrl: null },
    { id: "counter", name: "Counter", category: "Kitchen", ...dims(180, 60, 90), fill: "#9CA3AF", icon: "🔪", modelUrl: null },
    { id: "fridge", name: "Refrigerator", category: "Kitchen", ...dims(70, 70, 180), fill: "#D1D5DB", icon: "🧊", modelUrl: null },
    { id: "stove", name: "Stove", category: "Kitchen", ...dims(60, 60, 90), fill: "#374151", icon: "🔥", modelUrl: null },

    // Bathroom
    { id: "bathtub", name: "Bathtub", category: "Bathroom", ...dims(170, 75, 55), fill: "#E5E7EB", icon: "🛁", modelUrl: null },
    { id: "shower", name: "Shower", category: "Bathroom", ...dims(90, 90, 210), fill: "#D1D5DB", icon: "🚿", modelUrl: null },
    { id: "toilet", name: "Toilet", category: "Bathroom", ...dims(40, 70, 40), fill: "#F3F4F6", icon: "🚽", modelUrl: null },
    { id: "sink-vanity", name: "Sink Vanity", category: "Bathroom", ...dims(100, 50, 85), fill: "#9CA3AF", icon: "🚰", modelUrl: null },

    // Office
    { id: "desk", name: "Office Desk", category: "Office", ...dims(140, 70, 75), fill: "#6B5B45", icon: "🖥️", modelUrl: null },
    { id: "office-chair", name: "Office Chair", category: "Office", ...dims(60, 60, 90), fill: "#374151", icon: "💺", modelUrl: null },
    { id: "bookshelf", name: "Bookshelf", category: "Office", ...dims(100, 35, 180), fill: "#5C4033", icon: "📚", modelUrl: null },
    { id: "filing-cabinet", name: "Filing Cabinet", category: "Office", ...dims(50, 45, 120), fill: "#6B7280", icon: "🗄️", modelUrl: null },

    // Outdoor
    { id: "patio-table", name: "Patio Table", category: "Outdoor", ...dims(120, 120, 75), fill: "#78716C", icon: "🪑", modelUrl: null },
    { id: "garden-bench", name: "Garden Bench", category: "Outdoor", ...dims(150, 50, 80), fill: "#57534E", icon: "🪑", modelUrl: null },
    { id: "plant-pot", name: "Plant Pot", category: "Outdoor", ...dims(40, 40, 60), fill: "#65A30D", icon: "🪴", modelUrl: null },
    { id: "grill", name: "BBQ Grill", category: "Outdoor", ...dims(80, 60, 100), fill: "#1F2937", icon: "🔥", modelUrl: null },
];
