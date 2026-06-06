const BUILTIN_TEMPLATES = [
    {
        id: "l-shape",
        name: "L-Shape",
        category: "residential",
        icon: "⌐",
        description: "L-shaped building footprint",
        generate: (params = {}) => {
            const { width = 20, height = 20, wingWidth = 10, wingHeight = 10 } = params;
            const points = [
                [0, 0],
                [width, 0],
                [width, wingHeight],
                [wingWidth, wingHeight],
                [wingWidth, height],
                [0, height]
            ];
            return { points, width, height };
        }
    },
    {
        id: "u-shape",
        name: "U-Shape",
        category: "residential",
        icon: "⊔",
        description: "U-shaped building with courtyard",
        generate: (params = {}) => {
            const { width = 20, height = 20, wingDepth = 8, wingWidth = 6 } = params;
            const points = [
                [0, 0],
                [width, 0],
                [width, wingDepth],
                [wingWidth, wingDepth],
                [wingWidth, height - wingDepth],
                [width, height - wingDepth],
                [width, height],
                [0, height]
            ];
            return { points, width, height };
        }
    },
    {
        id: "t-shape",
        name: "T-Shape",
        category: "commercial",
        icon: "⊤",
        description: "T-shaped building footprint",
        generate: (params = {}) => {
            const { width = 20, height = 20, stemWidth = 8, stemHeight = 12 } = params;
            const stemStart = (width - stemWidth) / 2;
            const points = [
                [0, 0],
                [width, 0],
                [width, stemHeight],
                [stemStart + stemWidth, stemHeight],
                [stemStart + stemWidth, height],
                [stemStart, height],
                [stemStart, stemHeight]
            ];
            return { points, width, height };
        }
    },
    {
        id: "courtyard",
        name: "Courtyard",
        category: "residential",
        icon: "□",
        description: "Rectangular building with central courtyard",
        generate: (params = {}) => {
            const { width = 20, height = 20, courtyardWidth = 8, courtyardHeight = 8 } = params;
            const cw = courtyardWidth;
            const ch = courtyardHeight;
            const left = (width - cw) / 2;
            const top = (height - ch) / 2;
            const right = left + cw;
            const bottom = top + ch;
            const points = [
                [0, 0],
                [width, 0],
                [width, top],
                [right, top],
                [right, bottom],
                [width, bottom],
                [width, height],
                [0, height],
                [0, bottom],
                [left, bottom],
                [left, top],
                [0, top]
            ];
            return { points, width, height };
        }
    }
];

export function generateTemplate(templateId, params = {}) {
    const template = BUILTIN_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
        throw new Error(`Template not found: ${templateId}`);
    }
    return template.generate(params);
}

export { BUILTIN_TEMPLATES };