import { useState } from "react";
import { FURNITURE_CATALOG, CATEGORIES } from "./FurnitureCatalog";

const formatSize = (item) => {
    const width = item.widthMeters ?? (item.width != null ? item.width / 100 : 1);
    const depth = item.heightMeters ?? (item.height != null ? item.height / 100 : 1);
    return `${width.toFixed(2)}×${depth.toFixed(2)}m`;
};

export default function ObjectsTab({ onSelectCatalogItem }) {
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredItems = FURNITURE_CATALOG.filter(item => {
        const matchesCategory = item.category === activeCategory;
        const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

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
            </div>
        </li>
    );
}
