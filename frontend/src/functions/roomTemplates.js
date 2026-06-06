export const BUILTIN_ROOM_TEMPLATES = [
    {
        id: "2-room-split",
        name: "2-Room Split",
        category: "basic",
        icon: "⬜",
        description: "Split outline into 2 equal rooms",
        generate: (outline) => {
            return {
                dividers: [
                    { x1: 0.5, y1: 0, x2: 0.5, y2: 1 }
                ],
                rooms: [
                    { name: "Room 1", x: 0, y: 0, width: 0.5, height: 1 },
                    { name: "Room 2", x: 0.5, y: 0, width: 0.5, height: 1 }
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
            return {
                dividers: [
                    { x1: 0.5, y1: 0, x2: 0.5, y2: 1 },
                    { x1: 0, y1: 0.5, x2: 1, y2: 0.5 }
                ],
                rooms: [
                    { name: "Room 1", x: 0, y: 0, width: 0.5, height: 0.5 },
                    { name: "Room 2", x: 0.5, y: 0, width: 0.5, height: 0.5 },
                    { name: "Room 3", x: 0, y: 0.5, width: 0.5, height: 0.5 },
                    { name: "Room 4", x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
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
            return {
                dividers: [
                    { x1: 0.6, y1: 0, x2: 0.6, y2: 0.5 },
                    { x1: 0, y1: 0.5, x2: 0.6, y2: 0.5 }
                ],
                rooms: [
                    { name: "Main Room", x: 0, y: 0, width: 0.6, height: 0.5 },
                    { name: "Side Room", x: 0.6, y: 0, width: 0.4, height: 1 },
                    { name: "Bottom Room", x: 0, y: 0.5, width: 0.6, height: 0.5 }
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
            return {
                dividers: [
                    { x1: 0.5, y1: 0, x2: 0.5, y2: 1 },
                    { x1: 0, y1: 0.6, x2: 0.5, y2: 0.6 }
                ],
                rooms: [
                    { name: "Bedroom 1", x: 0, y: 0, width: 0.5, height: 0.6, roomType: "bedroom" },
                    { name: "Bedroom 2", x: 0.5, y: 0, width: 0.5, height: 0.6, roomType: "bedroom" },
                    { name: "Living Room", x: 0, y: 0.6, width: 1, height: 0.4, roomType: "living_room" }
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
            return {
                dividers: [
                    { x1: 0.33, y1: 0, x2: 0.33, y2: 0.6 },
                    { x1: 0.66, y1: 0, x2: 0.66, y2: 0.6 },
                    { x1: 0, y1: 0.6, x2: 1, y2: 0.6 }
                ],
                rooms: [
                    { name: "Bedroom 1", x: 0, y: 0, width: 0.33, height: 0.6, roomType: "bedroom" },
                    { name: "Bedroom 2", x: 0.33, y: 0, width: 0.33, height: 0.6, roomType: "bedroom" },
                    { name: "Bedroom 3", x: 0.66, y: 0, width: 0.34, height: 0.6, roomType: "bedroom" },
                    { name: "Living Room", x: 0, y: 0.6, width: 1, height: 0.4, roomType: "living_room" }
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
            return {
                dividers: [
                    { x1: 0.5, y1: 0, x2: 0.5, y2: 0.6 },
                    { x1: 0, y1: 0.3, x2: 0.5, y2: 0.3 },
                    { x1: 0.5, y1: 0.3, x2: 1, y2: 0.3 },
                    { x1: 0, y1: 0.6, x2: 1, y2: 0.6 }
                ],
                rooms: [
                    { name: "Bedroom 1", x: 0, y: 0, width: 0.5, height: 0.3, roomType: "bedroom" },
                    { name: "Bedroom 2", x: 0.5, y: 0, width: 0.5, height: 0.3, roomType: "bedroom" },
                    { name: "Bedroom 3", x: 0, y: 0.3, width: 0.5, height: 0.3, roomType: "bedroom" },
                    { name: "Bedroom 4", x: 0.5, y: 0.3, width: 0.5, height: 0.3, roomType: "bedroom" },
                    { name: "Living Room", x: 0, y: 0.6, width: 1, height: 0.4, roomType: "living_room" }
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