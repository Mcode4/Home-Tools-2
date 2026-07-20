export const getMarkdownTemplate = (persona, label) => {
    const templates = {
        inspection: INSPECTION_TEMPLATES,
        builder: BUILD_TEMPLATES,
        renovation: RENOVATION_TEMPLATES
    };
    
    const items = templates[persona]?.[label] || [];
    if (items.length === 0) return `# ${label}\n\nStart typing here...`;
    
    return `# ${label} Checklist\n\n${items.map(item => `- [ ] ${item}`).join("\n")}\n\n---\n**Notes:**\n`;
};

export const INSPECTION_TEMPLATES = {
    exterior: [
        "Change locks - front door",
        "Clean front door area",
        "Paint front door",
        "Front door light bulb/fixture",
        "Door number installed",
        "Clean patio",
        "Change patio door lock"
    ],
    bedroom: [
        "Doorknob locks working",
        "Doorstopper installed",
        "Closet shelves - secure",
        "Ceiling fan - working",
        "Windows - locks",
        "Blinds - condition",
        "Flooring - carpet/vinyl"
    ],
    bath: [
        "Countertop caulk",
        "Faucet - dripping/leaking",
        "Toilet - seat/bolts/caulking",
        "Bathtub - shower head/diverter",
        "Bathroom - towel racks/toilet paper holder",
        "Fart fan - working/clean"
    ],
    kitchen: [
        "Countertop - caulking",
        "Kitchen sink faucet - leaking/sprayer",
        "Garbage disposal - working",
        "Cabinets - doors/drawers/knobs",
        "Stove - burners/oven light",
        "Dishwasher - run cycle",
        "Refrigerator - light/shelves"
    ],
    laundry: [
        "Washer/Dryer - run cycle/leaks",
        "Circuit breaker box - secure",
        "Baseboards - water damage"
    ]
};

export const BUILD_TEMPLATES = {
    foundation: [
        "Slab level verification",
        "Plumbing rough-in pressure test",
        "Termite treatment application",
        "Vapor barrier integrity"
    ],
    framing: [
        "Stud spacing (16\" OC)",
        "Header spans verification",
        "Truss installation/blocking",
        "Sheathing/Nail pattern"
    ],
    electrical: [
        "Panel location/Clearance",
        "Circuit labeling",
        "GFCI placement verification",
        "Box securement"
    ]
};

export const RENOVATION_TEMPLATES = {
    demolition: [
        "Haul off debris",
        "Floor prep/Leveling",
        "Wall removal - structural check",
        "Utility capping"
    ],
    finishing: [
        "Paint - 2 coats minimum",
        "Trim - cope joints",
        "Hardware - uniform finish",
        "Touch-up final walk"
    ]
};

export const STATUS_OPTIONS = [
    { value: "okay", label: "✅ OKAY" },
    { value: "repair", label: "🔧 REPAIR" },
    { value: "replace", label: "♻️ REPLACE" }
];
