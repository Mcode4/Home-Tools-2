import { trackEvent } from "./analytics";

export const handleSearchAddress = async (addr) => {
    if(addr.trim().length < 3) return;
    const errors = {}
    let suggestions = []
    
    const controller = new AbortController();
    const abortCtrl = () => controller.abort();

    try {
        const nominatimSearch = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${addr}&format=json&addressdetails=1&limit=5&extratags=1&featuretype=settlement`,
            { signal: controller.signal }
        );

        const results = await nominatimSearch.json();

        const formatted = results
            .map(p => formatPlace(p))
            .filter(Boolean);
        
        suggestions = formatted;
    } catch(err) {
        if (err.name !== "AbortError") {
            abortCtrl();
            errors.client = String(err);
            throw new Error(err);
        };
    }
    
    abortCtrl();
    if(suggestions.length) {
        trackEvent("search_address", { results: suggestions.length });
        return suggestions
    } else {
        trackEvent("search_address", { results: 0 });
        throw new Error("No suggestions");
    };
};

export const reverseLookupAddress = async (lng, lat) => {
    const errors = {}
    
    const controller = new AbortController();
    const abortCtrl = () => controller.abort();

    try {
        const nominatimSearch = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { signal: controller.signal }
        );

        const result = await nominatimSearch.json();

        const formatted = formatPlace(result);

        abortCtrl();
        trackEvent("reverse_lookup", { lat, lng, found: !!formatted });
        return formatted ?? null;
    } catch(err) {
        if (err.name !== "AbortError") {
            abortCtrl();
            errors.client = String(err);
            trackEvent("reverse_lookup", { lat, lng, error: true });
            throw new Error(err);
        };
    }
}

const formatPlace = (place) => {
    if(!place) return null;
    const a = place.address || {};

    const fStreet = [
        a.house_number || a.highway,
        a.road || a.pedestrian || a.cycleway || a.footway
    ].filter(Boolean).join(" ");

    const fCity = 
        a.city ||
        a.town ||
        a.village ||
        a.hamlet ||
        a.suburb ||
        a.city_district ||
        "";

    const fState = a.state || "";
    const fCounty = a.county || "";
    const fCountry = a.country || "";
    const fZip = a.postcode || "";

    const locationObj = {
        name: place.name,
        address: fStreet, 
        city: fCity, 
        state: fState,
        county: fCounty, 
        country: fCountry, 
        zip: fZip,
        lat: place.lat,
        lng: place.lon,
    };

    const textParts = Object.entries(locationObj)
        .filter(([key, val])=> 
            val &&
            key !== "lat" &&
            key !== "lng" &&
            key !== "name"
        )
        .map(([_, val]) => val);
    
    if(!textParts.length) return null;
    // console.log("LOCATION OBJECT MADE:", locationObj);
    return {
        ...locationObj,
        text: textParts.join(", ")
    };
}