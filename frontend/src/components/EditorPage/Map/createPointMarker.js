    const createPointMarker = useCallback((lng, lat, tool) => {
        const markerId = `temp-${tool.type}-${Date.now()}`;
        const newObj = {
            id: markerId,
            type: tool.type,
            name: tool.name || "",
            icon: tool.icon || null,
            lng,
            lat,
            source: "canvas"
        };
        createdCanvasObject(newObj);
    }, [createdCanvasObject]);
