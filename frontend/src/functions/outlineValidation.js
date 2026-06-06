import * as turf from "@turf/turf";

export function outlineToTurfPolygon(outline) {
    if (!outline) return null;

    let coordinates = [];

    if (Array.isArray(outline.points) && outline.points.length >= 3) {
        coordinates = outline.points.map(([x, y]) => [x, y]);
        if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
            coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
            coordinates.push([...coordinates[0]]);
        }
    } else if (outline.lat != null && outline.lng != null && outline.widthMeters && outline.heightMeters) {
        const halfW = outline.widthMeters / 2;
        const halfH = outline.heightMeters / 2;
        const degPerMeter = 1 / 111320;
        const cosLat = Math.cos(outline.lat * Math.PI / 180);
        coordinates = [
            [outline.lng - halfW * degPerMeter / cosLat, outline.lat - halfH * degPerMeter],
            [outline.lng + halfW * degPerMeter / cosLat, outline.lat - halfH * degPerMeter],
            [outline.lng + halfW * degPerMeter / cosLat, outline.lat + halfH * degPerMeter],
            [outline.lng - halfW * degPerMeter / cosLat, outline.lat + halfH * degPerMeter],
            [outline.lng - halfW * degPerMeter / cosLat, outline.lat - halfH * degPerMeter]
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

    if (coordinates.length < 4) return null;

    try {
        return turf.polygon([coordinates]);
    } catch (e) {
        return null;
    }
}

export function getOutlineArea(outline) {
    if (!outline) return 0;

    if (outline.lat != null && outline.lng != null && outline.widthMeters && outline.heightMeters) {
        return outline.widthMeters * outline.heightMeters;
    }

    const feature = outlineToTurfPolygon(outline);
    if (!feature) return 0;

    try {
        return turf.area(feature);
    } catch (e) {
        return 0;
    }
}

export function getOutlinePerimeter(outline) {
    if (!outline) return 0;

    if (outline.lat != null && outline.lng != null && outline.widthMeters && outline.heightMeters) {
        return 2 * (outline.widthMeters + outline.heightMeters);
    }

    const feature = outlineToTurfPolygon(outline);
    if (!feature) return 0;

    try {
        return turf.length(feature, { units: 'meters' });
    } catch (e) {
        return 0;
    }
}

function checkSelfIntersections(outline) {
    const warnings = [];
    const feature = outlineToTurfPolygon(outline);
    if (!feature) return warnings;

    try {
        const kinks = turf.kinks(feature);
        if (kinks && kinks.selfIntersections && kinks.selfIntersections.length > 0) {
            warnings.push({
                type: "self-intersection",
                outlineId: outline.id,
                message: `Polygon self-intersects at ${kinks.selfIntersections.length} point(s)`,
                severity: "error"
            });
        }
    } catch (e) {
        // turf.kinks may fail on degenerate polygons
    }

    return warnings;
}

function checkOverlaps(outlines) {
    const warnings = [];

    for (let i = 0; i < outlines.length; i++) {
        for (let j = i + 1; j < outlines.length; j++) {
            const featureA = outlineToTurfPolygon(outlines[i]);
            const featureB = outlineToTurfPolygon(outlines[j]);
            if (!featureA || !featureB) continue;

            try {
                const isOverlap = turf.booleanOverlap(featureA, featureB);
                const isDisjoint = turf.booleanDisjoint(featureA, featureB);

                if (isOverlap || !isDisjoint) {
                    warnings.push({
                        type: "overlap",
                        outlineId: [outlines[i].id, outlines[j].id],
                        message: `Outlines "${outlines[i].name || i}" and "${outlines[j].name || j}" overlap`,
                        severity: "warning"
                    });
                }
            } catch (e) {
                // turf boolean ops may fail on degenerate polygons
            }
        }
    }

    return warnings;
}

function checkMinSize(outlines, minArea) {
    const warnings = [];

    outlines.forEach(outline => {
        const area = getOutlineArea(outline);
        if (area < minArea) {
            warnings.push({
                type: "min-size",
                outlineId: outline.id,
                message: `Outline area (${area.toFixed(1)} sq m) below minimum (${minArea} sq m)`,
                severity: "warning"
            });
        }
    });

    return warnings;
}

export function validateOutlines(outlines, options = {}) {
    const { minArea = 1, checkOverlaps: shouldCheckOverlaps = true } = options;

    if (!outlines || outlines.length === 0) {
        return { isValid: true, warnings: [], measurements: [] };
    }

    let warnings = [];

    warnings = warnings.concat(
        outlines.flatMap(outline => checkSelfIntersections(outline))
    );

    if (shouldCheckOverlaps && outlines.length >= 2) {
        warnings = warnings.concat(checkOverlaps(outlines));
    }

    warnings = warnings.concat(checkMinSize(outlines, minArea));

    const measurements = outlines.map(outline => ({
        outlineId: outline.id,
        area: getOutlineArea(outline),
        perimeter: getOutlinePerimeter(outline),
    }));

    const isValid = warnings.filter(w => w.severity === "error").length === 0;

    return { isValid, warnings, measurements };
}

export function metersToUnit(meters, unit = "metric") {
    if (unit === "imperial") {
        return { value: meters * 3.28084, label: "ft" };
    }
    return { value: meters, label: "m" };
}

export function metersToAreaUnit(metersSq, unit = "metric") {
    if (unit === "imperial") {
        return { value: metersSq * 10.7639, label: "sq ft" };
    }
    return { value: metersSq, label: "sq m" };
}

export function checkEdgeSnap(outlineA, outlines, threshold = 10) {
    if (!outlineA || !Array.isArray(outlineA.points)) return null;

    const otherOutlines = outlines.filter(o => o.id !== outlineA.id);
    let bestDist = Infinity;
    let bestSnap = null;

    for (const other of otherOutlines) {
        if (!Array.isArray(other.points)) continue;

        for (const vA of outlineA.points) {
            for (const vB of other.points) {
                const dist = Math.hypot(vA[0] - vB[0], vA[1] - vB[1]);
                if (dist < bestDist && dist < threshold) {
                    bestDist = dist;
                    bestSnap = { snapPoint: vB, targetOutlineId: other.id };
                }
            }
        }
    }

    return bestSnap;
}

export function checkAlignmentGuides(outline, outlines) {
    const guides = [];
    if (!outline) return guides;

    const centerA = getCenter(outline);
    if (!centerA) return guides;

    const otherOutlines = outlines.filter(o => o.id !== outline.id);

    for (const other of otherOutlines) {
        const centerB = getCenter(other);
        if (!centerB) continue;

        const tolerance = 5;

        if (Math.abs(centerA[0] - centerB[0]) < tolerance) {
            guides.push({ type: "center", axis: "x", value: centerA[0], fromOutlineId: outline.id, toOutlineId: other.id });
        }
        if (Math.abs(centerA[1] - centerB[1]) < tolerance) {
            guides.push({ type: "center", axis: "y", value: centerA[1], fromOutlineId: outline.id, toOutlineId: other.id });
        }
    }

    return guides;
}

function getCenter(outline) {
    if (Array.isArray(outline.points) && outline.points.length >= 3) {
        let cx = 0, cy = 0;
        outline.points.forEach(([x, y]) => { cx += x; cy += y; });
        return [cx / outline.points.length, cy / outline.points.length];
    }
    if (outline.x != null && outline.y != null && outline.width && outline.height) {
        return [outline.x + outline.width / 2, outline.y + outline.height / 2];
    }
    if (outline.lat != null && outline.lng != null) {
        return [outline.lat, outline.lng];
    }
    return null;
}