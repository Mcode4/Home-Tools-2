import { useState, useRef } from "react";
import { FURNITURE_CATALOG, CATEGORIES } from "./FurnitureCatalog";

const formatSize = (item) => {
    const width = item.widthMeters ?? (item.width != null ? item.width / 100 : 1);
    const depth = item.heightMeters ?? (item.height != null ? item.height / 100 : 1);
    return `${width.toFixed(2)}×${depth.toFixed(2)}m`;
};

export default function ObjectsTab({ onSelectCatalogItem }) {
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
    const [searchQuery, setSearchQuery] = useState("");
    const fileInputRef = useRef(null);

    const filteredItems = FURNITURE_CATALOG.filter(item => {
        const matchesCategory = item.category === activeCategory;
        const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            onSelectCatalogItem?.({
                id: `custom-${Date.now()}`,
                name: file.name.replace(/\.(glb|gltf)$/i, ""),
                category: "Custom",
                width: 100,
                height: 100,
                height3d: 80,
                widthMeters: 1,
                heightMeters: 1,
                heightMeters3d: 0.8,
                fill: "#8B5CF6",
                icon: "📦",
                modelUrl: reader.result,
                isCustom: true,
            });
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    return (
        <li className="menu-item-container">
            <div className="menu-tools-section">
                <h4>Furniture</h4>
                <input
                    type="text"
                    className="input objects-catalog-search"
                    placeholder="Search furniture..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="objects-category-row">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`tb-btn${activeCategory === cat ? " active" : ""}`}
                            onClick={() => { setActiveCategory(cat); setSearchQuery(""); }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <ul className="tool-list objects-catalog-list">
                    {filteredItems.map(item => (
                        <li
                            key={item.id}
                            className="tool-item object-tool-item"
                            onClick={() => onSelectCatalogItem?.(item)}
                            title={`${item.name} — ${formatSize(item)}`}
                        >
                            <span className="object-tool-icon">{item.icon}</span>
                            <span className="object-tool-name">{item.name}</span>
                            <span className="object-tool-size">{formatSize(item)}</span>
                        </li>
                    ))}
                    {filteredItems.length === 0 && (
                        <p className="objects-empty-state">No items found</p>
                    )}
                </ul>
                <div className="objects-upload-row">
                    <button
                        className="tb-btn objects-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        📎 Upload GLB/GLTF
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".glb,.gltf"
                        style={{ display: "none" }}
                        onChange={handleUpload}
                    />
                </div>
            </div>
        </li>
    );
}
