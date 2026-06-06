export function exportGeoJSON(outlines, options = {}) {
    if (!outlines || outlines.length === 0) {
        return JSON.stringify({ type: "FeatureCollection", features: [] }, null, 2);
    }

    const features = outlines.map(outline => {
        let coordinates = [];

        if (Array.isArray(outline.pointsGeo) && outline.pointsGeo.length >= 3) {
            coordinates = outline.pointsGeo.map(([lat, lng]) => [lng, lat]);
            if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
                coordinates.push([...coordinates[0]]);
            }
        } else if (Array.isArray(outline.points) && outline.points.length >= 3) {
            coordinates = outline.points.map(([x, y]) => [x, y]);
            if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
                coordinates.push([...coordinates[0]]);
            }
        } else if (outline.lat != null && outline.lng != null && outline.widthMeters && outline.heightMeters) {
            const halfW = outline.widthMeters / 2;
            const halfH = outline.heightMeters / 2;
            coordinates = [
                [outline.lng - halfW / 111320 / Math.cos(outline.lat * Math.PI / 180), outline.lat - halfH / 111320],
                [outline.lng + halfW / 111320 / Math.cos(outline.lat * Math.PI / 180), outline.lat - halfH / 111320],
                [outline.lng + halfW / 111320 / Math.cos(outline.lat * Math.PI / 180), outline.lat + halfH / 111320],
                [outline.lng - halfW / 111320 / Math.cos(outline.lat * Math.PI / 180), outline.lat + halfH / 111320],
                [outline.lng - halfW / 111320 / Math.cos(outline.lat * Math.PI / 180), outline.lat - halfH / 111320]
            ];
        } else if (outline.x != null && outline.y != null && outline.width && outline.height) {
            coordinates = [
                [outline.x, outline.y],
                [outline.x + outline.width, outline.y],
                [outline.x + outline.width, outline.y + outline.height],
                [outline.x, outline.y + outline.height],
                [outline.x, outline.y]
            ];
        }

        if (coordinates.length < 4) {
            return null;
        }

        return {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [coordinates]
            },
            properties: {
                name: outline.name || outline.type || "outline",
                type: outline.type || "polygon",
                fill: outline.fill || "#6366f1",
                stroke: outline.stroke || "#00d4ff",
                strokeWidth: outline.strokeWidth || 2,
                opacity: outline.opacity ?? 1,
                widthMeters: outline.widthMeters,
                heightMeters: outline.heightMeters,
            }
        };
    }).filter(Boolean);

    return JSON.stringify({ type: "FeatureCollection", features }, null, 2);
}

export function exportSVG(outlines, options = {}) {
    if (!outlines || outlines.length === 0) {
        return '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>';
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    outlines.forEach(outline => {
        if (Array.isArray(outline.points) && outline.points.length >= 2) {
            outline.points.forEach(([x, y]) => {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            });
        } else if (outline.x != null && outline.y != null && outline.width && outline.height) {
            minX = Math.min(minX, outline.x);
            minY = Math.min(minY, outline.y);
            maxX = Math.max(maxX, outline.x + outline.width);
            maxY = Math.max(maxY, outline.y + outline.height);
        } else if (outline.lat != null && outline.lng != null && outline.widthMeters && outline.heightMeters) {
            const halfW = outline.widthMeters / 2;
            const halfH = outline.heightMeters / 2;
            minX = Math.min(minX, -halfW);
            minY = Math.min(minY, -halfH);
            maxX = Math.max(maxX, halfW);
            maxY = Math.max(maxY, halfH);
        }
    });

    if (minX === Infinity) {
        return '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>';
    }

    const padding = 0.1;
    const width = maxX - minX;
    const height = maxY - minY;
    const viewBoxX = minX - width * padding;
    const viewBoxY = minY - height * padding;
    const viewBoxWidth = width * (1 + 2 * padding);
    const viewBoxHeight = height * (1 + 2 * padding);

    const svgElements = outlines.map(outline => {
        const fill = outline.fill || "#6366f1";
        const stroke = outline.stroke || "#00d4ff";
        const strokeWidth = outline.strokeWidth || 2;
        const opacity = outline.opacity ?? 1;

        if (outline.type === "circle" || outline.type === "circle") {
            const cx = outline.x != null ? outline.x + (outline.width || 100) / 2 : 0;
            const cy = outline.y != null ? outline.y + (outline.height || 100) / 2 : 0;
            const r = outline.radius || (outline.width || 100) / 2;
            return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
        } else if (outline.type === "rectangle" || (!outline.sides && !Array.isArray(outline.points) && outline.width && outline.height)) {
            const x = outline.x || 0;
            const y = outline.y || 0;
            const w = outline.width || 100;
            const h = outline.height || 100;
            return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
        } else if (Array.isArray(outline.points) && outline.points.length >= 3) {
            const pointsStr = outline.points.map(([x, y]) => `${x},${y}`).join(" ");
            return `<polygon points="${pointsStr}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
        }
        return "";
    }).filter(Boolean).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" width="${viewBoxWidth}" height="${viewBoxHeight}">
${svgElements}
</svg>`;
}

export async function exportPDF(outlines, options = {}) {
    try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        const drawWidth = pageWidth - 2 * margin;
        const drawHeight = pageHeight - 2 * margin;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        outlines.forEach(outline => {
            if (Array.isArray(outline.points) && outline.points.length >= 2) {
                outline.points.forEach(([x, y]) => {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                });
            } else if (outline.x != null && outline.y != null && outline.width && outline.height) {
                minX = Math.min(minX, outline.x);
                minY = Math.min(minY, outline.y);
                maxX = Math.max(maxX, outline.x + outline.width);
                maxY = Math.max(maxY, outline.y + outline.height);
            }
        });

        if (minX === Infinity) {
            return new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
        }

        const scale = Math.min(drawWidth / (maxX - minX), drawHeight / (maxY - minY)) * 0.9;
        const offsetX = margin + (drawWidth - (maxX - minX) * scale) / 2;
        const offsetY = margin + (drawHeight - (maxY - minY) * scale) / 2;

        if (options?.title) {
            doc.setFontSize(16);
            doc.text(options.title, pageWidth / 2, 20, { align: 'center' });
        }

        outlines.forEach(outline => {
            const fill = outline.fill || "#6366f1";
            const stroke = outline.stroke || "#00d4ff";
            const strokeWidth = (outline.strokeWidth || 2) * scale;

            doc.setFillColor(fill);
            doc.setDrawColor(stroke);
            doc.setLineWidth(strokeWidth);

            if (outline.type === "circle") {
                const cx = offsetX + (outline.x + (outline.width || 100) / 2) * scale;
                const cy = offsetY + (outline.y + (outline.height || 100) / 2) * scale;
                const r = (outline.radius || (outline.width || 100) / 2) * scale;
                doc.circle(cx, cy, r, 'FD');
            } else if (outline.type === "rectangle" || (!outline.sides && !Array.isArray(outline.points) && outline.width && outline.height)) {
                const x = offsetX + (outline.x || 0) * scale;
                const y = offsetY + (outline.y || 0) * scale;
                const w = (outline.width || 100) * scale;
                const h = (outline.height || 100) * scale;
                doc.rect(x, y, w, h, 'FD');
            } else if (Array.isArray(outline.points) && outline.points.length >= 3) {
                const points = outline.points.map(([x, y]) => [
                    offsetX + x * scale,
                    offsetY + y * scale
                ]);
                doc.poly(points, 'FD');
            }
        });

        return doc.output('blob');
    } catch (e) {
        console.error("PDF export failed:", e);
        return new Blob([JSON.stringify({ error: "PDF export failed", details: String(e) })], { type: 'application/json' });
    }
}

export function parseGeoJSON(jsonString) {
    try {
        const data = typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
        if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
            throw new Error("Invalid GeoJSON: not a FeatureCollection");
        }

        const outlines = [];

        data.features.forEach((feature, index) => {
            if (!feature.geometry || feature.geometry.type !== "Polygon") {
                return;
            }

            const coords = feature.geometry.coordinates[0];
            if (!Array.isArray(coords) || coords.length < 4) {
                return;
            }

            const points = coords.slice(0, -1).map(([lng, lat]) => [lat, lng]);

            const props = feature.properties || {};
            const outline = {
                id: `template-${Date.now()}-${index}`,
                name: props.name || `Imported ${index + 1}`,
                type: "polygon",
                points,
                fill: props.fill || "#6366f1",
                stroke: props.stroke || "#00d4ff",
                strokeWidth: props.strokeWidth || 2,
                opacity: props.opacity ?? 1,
                widthMeters: props.widthMeters,
                heightMeters: props.heightMeters,
            };

            if (props.lat != null && props.lng != null) {
                outline.lat = props.lat;
                outline.lng = props.lng;
            }

            outlines.push(outline);
        });

        return outlines;
    } catch (e) {
        console.error("GeoJSON parse failed:", e);
        return [];
    }
}

export async function parseDXF(dxfString) {
    try {
        const DxfParser = (await import('dxf-parser')).default;
        const parser = new DxfParser();
        const dxf = parser.parseSync(dxfString);

        const outlines = [];
        let templateIndex = 0;

        if (dxf.entities) {
            dxf.entities.forEach(entity => {
                if ((entity.type === "LWPOLYLINE" || entity.type === "POLYLINE") && entity.vertices && entity.vertices.length >= 3) {
                    const points = entity.vertices.map(v => [v.x, v.y]);
                    const isClosed = entity.closed || (points[0][0] === points[points.length - 1][0] && points[0][1] === points[points.length - 1][1]);
                    const outlinePoints = isClosed ? points.slice(0, -1) : points;

                    const outline = {
                        id: `dxf-${Date.now()}-${templateIndex++}`,
                        name: `DXF Import ${templateIndex}`,
                        type: "polygon",
                        points: outlinePoints,
                        fill: "#6366f1",
                        stroke: "#00d4ff",
                        strokeWidth: 2,
                        opacity: 1,
                    };
                    outlines.push(outline);
                }
            });
        }

        return outlines;
    } catch (e) {
        console.error("DXF parse failed:", e);
        return [];
    }
}