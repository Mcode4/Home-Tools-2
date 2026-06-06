# Pinned-To-Map Outline Rendering

## Goal

Outline-stage shapes are pinned to a real map location. Their center follows the MapLibre projection for the saved latitude and longitude, and their size represents a real-world footprint on the map.

This means:

- Zooming out should make the outline smaller on screen.
- Zooming in should make the outline larger on screen.
- The outline should continue covering the same building, lot, or project footprint on the map.
- A fixed screen-pixel size is incorrect for map-pinned outlines because it makes the footprint grow when zooming out.

## Shape Data Contract

Map-pinned outline shapes should store geographic and metric data:

- `lat`, `lng`: geographic center of the outline.
- `widthMeters`, `heightMeters`: real-world dimensions for rectangles and regular shapes.
- `radiusMeters`: real-world radius for circles and regular polygons.
- `points`: geographic polygon vertices as `[lat, lng]` pairs for custom polygons.

Screen-space fields such as `x`, `y`, `width`, `height`, and `radius` are derived render values while the map is visible. They should not be treated as the persistent source of truth for map-pinned outlines.

`x` and `y` are not size fields. They are screen-position fields for non-map rendering. When an outline is pinned to the map, the editable position should be `lat` and `lng`; `widthMeters` and `heightMeters` are the editable size fields.

## Rendering Flow

`RenderComponent` creates a projection from the active MapLibre map:

1. Project `lat` and `lng` to a screen-space center.
2. Ask MapLibre for the current horizontal and vertical meters-per-pixel at that center.
3. Render the Konva shape at `center - size / 2`.
4. Recompute the projected center and pixel dimensions when the map moves or zooms.

This keeps the map footprint stable while allowing the on-screen size to change naturally with zoom.

Width and height must be converted independently. Do not use one shared zoom scalar for both axes; that lets rectangular outlines drift toward a square at zoom extremes.

## Legacy Pixel Shapes

Some outlines may only have `width`, `height`, or `radius` from earlier implementations. These are converted once into meter dimensions using the current map zoom and cached in `RenderComponent`.

After a drag or transform, the updated shape writes back `widthMeters`, `heightMeters`, and `radiusMeters`, and removes stale pixel dimensions.

If an outline still has `x` and `y` but no `lat` and `lng`, `RenderPage` migrates it to pinned geometry once the map is available. The property panel should then show `Lat`, `Lng`, `Width (m)`, and `Height (m)`.

## Editing Rules

When dragging a map-pinned outline:

- Recompute `lat` and `lng` from the new screen center.
- Preserve or write metric dimensions.

When resizing a map-pinned outline:

- Convert the resized screen width and height to meters at the new center latitude.
- Write the metric dimensions to the outline.
- Remove stale `width`, `height`, or `radius` pixel values.

When editing custom polygons:

- Store polygon vertices as geographic `[lat, lng]` pairs.
- Reproject vertices on every map zoom.

## Failure Mode To Avoid

Do not freeze outline size in screen pixels while the map is visible. A fixed 150px by 293px rectangle will cover a small area when zoomed in and a much larger area when zoomed out, which makes the outline's real size dependent on map zoom.

## Sections Base Layout

In the Sections stage, every outline gets a system base layout for the selected level. The base layout is still stored as `type: "room"` so divider and wall tools can hit-test it, but it carries `sectionRole: "base"` and `outlineType` so it renders with the exact outline geometry instead of defaulting to a rectangle.

Base layouts and divider lines are system structures, not user-facing room children. The tree should show divided and combined rooms under an outline, while divider lines remain available to tool logic for selecting, moving, and combining.

Section interiors are rendered through an outline-shaped clip. Split rooms may be rectangular subdivisions internally, but their visible fill, dividers, and wall pads must not paint outside the outline boundary.

Divider lines created on a pinned map should store geographic endpoint pairs in `pointsGeo` and reproject those endpoints on map zoom or pan. Raw `x1`, `y1`, `x2`, and `y2` are render-space coordinates, not stable map-space source fields.

## Objects Stage

Objects follow the same pinned-to-map rule as outlines and rooms. A placed object should store:

- `lat`, `lng`: geographic center of the object.
- `widthMeters`, `heightMeters`: real-world footprint dimensions.
- `heightMeters3d`: real-world vertical height for 3D rendering.
- `floor_id`, `room_id`: the level/room constraint where the object belongs.

Catalog dimensions are expressed as real furniture dimensions, not canvas pixels. The current built-in catalog keeps legacy centimeter fields (`width`, `height`, `height3d`) for display compatibility, but the placement source of truth is the meter fields derived from those values.

When the map is visible, object screen-space `x`, `y`, `width`, and `height` are render values derived from `lat`, `lng`, and meter dimensions at the current map zoom. They should not be used as the persistent size source. This prevents a bed, table, or appliance from becoming room-sized simply because it was placed at a far zoom level.

When dragging an object, write back a new `lat` and `lng` from the dragged center, preserve `widthMeters`, `heightMeters`, and `heightMeters3d`, and keep the object clamped to its room. When editing size in the properties panel, update the meter fields.
