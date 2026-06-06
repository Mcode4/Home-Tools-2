export const BUILTIN_ROOM_TEMPLATES = [
    {
        id: "2-room-split",
        name: "2-Room Split",
        category: "basic",
        icon: "⬜",
        description: "Split outline into 2 equal rooms",
        generate: (outline) => {
            const { x, y, width, height } = outline;
            return {
                dividers: [
                    { x1: x + width / 2, y1: y, x2: x + width / 2, y2: y + height }
                ],
                rooms: [
                    { name: "Room 1", x, y, width: width / 2, height },
                    { name: "Room 2", x: x + width / 2, y, width: width / 2, height }
                ]
            };
        }
    },
    {
        id: "4-room-grid",
        name: "4-Room Grid",
        category: "basic",
        icon: "⊞",
        description: "Split outline into 4 equal rooms",
        generate: (outline) => {
            const { x, y, width, height } = outline;
            return {
                dividers: [
                    { x1: x + width / 2, y1: y, x2: x + width / 2, y2: y + height },
                    { x1: x, y1: y + height / 2, x2: x + width, y2: y + height / 2 }
                ],
                rooms: [
                    { name: "Room 1", x, y, width: width / 2, height: height / 2 },
                    { name: "Room 2", x: x + width / 2, y, width: width / 2, height: height / 2 },
                    { name: "Room 3", x, y: y + height / 2, width: width / 2, height: height / 2 },
                    { name: "Room 4", x: x + width / 2, y: y + height / 2, width: width / 2, height: height / 2 }
                ]
            };
        }
    },
    {
        id: "l-shape",
        name: "L-Shape",
        category: "basic",
        icon: "⌐",
        description: "L-shaped divider layout",
        generate: (outline) => {
            const { x, y, width, height } = outline;
            return {
                dividers: [
                    { x1: x + width * 0.6, y1: y, x2: x + width * 0.6, y2: y + height * 0.5 },
                    { x1: x, y1: y + height * 0.5, x2: x + width * 0.6, y2: y + height * 0.5 }
                ],
                rooms: [
                    { name: "Main Room", x, y, width: width * 0.6, height: height * 0.5 },
                    { name: "Side Room", x: x + width * 0.6, y, width: width * 0.4, height },
                    { name: "Bottom Room", x, y: y + height * 0.5, width: width * 0.6, height: height * 0.5 }
                ]
            };
        }
    },
    {
        id: "2-bedroom",
        name: "2-Bedroom",
        category: "residential",
        icon: "🏠",
        description: "2 bedroom + living",
        generate: (outline) => {
            const { x, y, width, height } = outline;
            return {
                dividers: [
                    { x1: x + width * 0.5, y1: y, x2: x + width * 0.5, y2: y + height },
                    { x1: x, y1: y + height * 0.6, x2: x + width * 0.5, y2: y + height * 0.6 }
                ],
                rooms: [
                    { name: "Bedroom 1", x, y, width: width * 0.5, height: height * 0.6, roomType: "bedroom" },
                    { name: "Bedroom 2", x: x + width * 0.5, y, width: width * 0.5, height: height * 0.6, roomType: "bedroom" },
                    { name: "Living Room", x, y: y + height * 0.6, width: width, height: height * 0.4, roomType: "living_room" }
                ]
            };
        }
    },
    {
        id: "3-bedroom",
        name: "3-Bedroom",
        category: "residential",
        icon: "🏡",
        description: "3 bedroom + living",
        generate: (outline) => {
            const { x, y, width, height } = outline;
            return {
                dividers: [
                    { x1: x + width * 0.33, y1: y, x2: x + width * 0.33, y2: y + height * 0.6 },
                    { x1: x + width * 0.66, y1: y, x2: x + width * 0.66, y2: y + height * 0.6 },
                    { x1: x, y1: y + height * 0.6, x2: x + width, y2: y + height * 0.6 }
                ],
                rooms: [
                    { name: "Bedroom 1", x, y, width: width * 0.33, height: height * 0.6, roomType: "bedroom" },
                    { name: "Bedroom 2", x: x + width * 0.33, y, width: width * 0.33, height: height * 0.6, roomType: "bedroom" },
                    { name: "Bedroom 3", x: x + width * 0.66, y, width: width * 0.34, height: height * 0.6, roomType: "bedroom" },
                    { name: "Living Room", x, y: y + height * 0.6, width: width, height: height * 0.4, roomType: "living_room" }
                ]
            };
        }
    },
    {
        id: "4-bedroom",
        name: "4-Bedroom",
        category: "residential",
        icon: "🏘",
        description: "4 bedroom + living",
        generate: (outline) => {
            const { x, y, width, height } = outline;
            return {
                dividers: [
                    { x1: x + width * 0.5, y1: y, x2: x + width * 0.5, y2: y + height * 0.6 },
                    { x1: x, y1: y + height * 0.3, x2: x + width * 0.5, y2: y + height * 0.3 },
                    { x1: x + width * 0.5, y1: y + height * 0.3, x2: x + width, y2: y + height * 0.3 },
                    { x1: x, y1: y + height * 0.6, x2: x + width, y2: y + height * 0.6 }
                ],
                rooms: [
                    { name: "Bedroom 1", x, y, width: width * 0.5, height: height * 0.3, roomType: "bedroom" },
                    { name: "Bedroom 2", x: x + width * 0.5, y, width: width * 0.5, height: height * 0.3, roomType: "bedroom" },
                    { name: "Bedroom 3", x, y: y + height * 0.3, width: width * 0.5, height: height * 0.3, roomType: "bedroom" },
                    { name: "Bedroom 4", x: x + width * 0.5, y: y + height * 0.3, width: width * 0.5, height: height * 0.3, roomType: "bedroom" },
                    { name: "Living Room", x, y: y + height * 0.6, width: width, height: height * 0.4, roomType: "living_room" }
                ]
            };
        }
    }
];

export function generateRoomTemplate(templateId, outline) {
    const template = BUILTIN_ROOM_TEMPLATES.find(t => t.id === templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);
    return template.generate(outline);
}