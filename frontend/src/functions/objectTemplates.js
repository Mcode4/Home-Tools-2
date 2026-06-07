export const BUILTIN_OBJECT_TEMPLATES = [
    {
        id: "bedroom-set",
        name: "Bedroom Set",
        category: "Bedroom",
        icon: "🛏️",
        description: "Bed + nightstand + dresser",
        generate: (outline) => {
            const cx = outline.x + outline.width / 2;
            const cy = outline.y + outline.height / 2;
            return [
                { id: `bed-${Date.now()}`, type: "bed-double", x: cx, y: cy - 50, fill: "#8B7355" },
                { id: `nightstand-${Date.now()}`, type: "nightstand", x: cx + 100, y: cy - 50, fill: "#6B5B45" },
                { id: `dresser-${Date.now()}`, type: "dresser", x: cx, y: cy + 80, fill: "#7B6B55" },
            ];
        }
    },
    {
        id: "kitchen-layout",
        name: "Kitchen Layout",
        category: "Kitchen",
        icon: "🍳",
        description: "Counter + stove + fridge",
        generate: (outline) => {
            const cx = outline.x + outline.width / 2;
            const cy = outline.y + outline.height / 2;
            return [
                { id: `counter-${Date.now()}`, type: "counter", x: cx - 100, y: cy, fill: "#9CA3AF" },
                { id: `stove-${Date.now()}`, type: "stove", x: cx, y: cy, fill: "#374151" },
                { id: `fridge-${Date.now()}`, type: "fridge", x: cx + 100, y: cy, fill: "#D1D5DB" },
            ];
        }
    },
    {
        id: "living-room",
        name: "Living Room",
        category: "Living Room",
        icon: "🛋️",
        description: "Sofa + coffee table + TV stand",
        generate: (outline) => {
            const cx = outline.x + outline.width / 2;
            const cy = outline.y + outline.height / 2;
            return [
                { id: `sofa-${Date.now()}`, type: "sofa-3seat", x: cx, y: cy - 60, fill: "#6B7280" },
                { id: `coffee-${Date.now()}`, type: "coffee-table", x: cx, y: cy + 30, fill: "#8B7355" },
                { id: `tv-${Date.now()}`, type: "tv-stand", x: cx, y: cy + 100, fill: "#4B5563" },
            ];
        }
    },
    {
        id: "office-setup",
        name: "Office Setup",
        category: "Office",
        icon: "🖥️",
        description: "Desk + chair + bookshelf",
        generate: (outline) => {
            const cx = outline.x + outline.width / 2;
            const cy = outline.y + outline.height / 2;
            return [
                { id: `desk-${Date.now()}`, type: "desk", x: cx, y: cy - 30, fill: "#6B5B45" },
                { id: `chair-${Date.now()}`, type: "office-chair", x: cx, y: cy + 30, fill: "#374151" },
                { id: `shelf-${Date.now()}`, type: "bookshelf", x: cx + 120, y: cy, fill: "#5C4033" },
            ];
        }
    },
    {
        id: "bathroom-set",
        name: "Bathroom Set",
        category: "Bathroom",
        icon: "🛁",
        description: "Vanity + toilet + shower",
        generate: (outline) => {
            const cx = outline.x + outline.width / 2;
            const cy = outline.y + outline.height / 2;
            return [
                { id: `vanity-${Date.now()}`, type: "sink-vanity", x: cx - 80, y: cy, fill: "#9CA3AF" },
                { id: `toilet-${Date.now()}`, type: "toilet", x: cx + 80, y: cy, fill: "#F3F4F6" },
                { id: `shower-${Date.now()}`, type: "shower", x: cx + 80, y: cy + 80, fill: "#D1D5DB" },
            ];
        }
    },
    {
        id: "dining-set",
        name: "Dining Set",
        category: "Kitchen",
        icon: "🪑",
        description: "Table + 4 chairs",
        generate: (outline) => {
            const cx = outline.x + outline.width / 2;
            const cy = outline.y + outline.height / 2;
            return [
                { id: `table-${Date.now()}`, type: "dining-table", x: cx, y: cy, fill: "#8B7355" },
                { id: `chair1-${Date.now()}`, type: "dining-chair", x: cx - 100, y: cy, fill: "#8B7355" },
                { id: `chair2-${Date.now()}`, type: "dining-chair", x: cx + 100, y: cy, fill: "#8B7355" },
                { id: `chair3-${Date.now()}`, type: "dining-chair", x: cx, y: cy - 70, fill: "#8B7355" },
                { id: `chair4-${Date.now()}`, type: "dining-chair", x: cx, y: cy + 70, fill: "#8B7355" },
            ];
        }
    },
];

export function generateObjectTemplate(templateId, outline) {
    const template = BUILTIN_OBJECT_TEMPLATES.find(t => t.id === templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);
    return template.generate(outline);
}