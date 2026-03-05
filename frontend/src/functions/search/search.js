


export const handleSearchAddress = async (addr) => {
    if(addr.trim().length < 3) return;
    const errors = {}
    let suggestions = []
    
    const controller = new AbortController();
    const abortCtrl = () => controller.abort();

    try {
        const nominatimSearch = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${addr}&format=json&addressdetails=1&limit=5&extratags=1&featuretype=settlement&countrycodes=us`,
            { signal: controller.signal }
        );

        const results = await nominatimSearch.json();
        console.log("SEARCH RESULTS", results);

        // const filtered = results.filter(place =>
        //     ["highway", "building", "place"].includes(place.class)
        // );
        // console.log("FILTERED RESULTS", filtered);
        
        // const formatted = filtered
        //     .map(p => formatPlace(p))
        //     .filter(Boolean);
        // console.log("FORMATTED RESULTS", formatted); 

        const formatted = results
            .map(p => formatPlace(p))
            .filter(Boolean);
        console.log("FORMATTED RESULTS", formatted); 
        
        suggestions = formatted;
    } catch(err) {
        if (err.name !== "AbortError") {
            errors.client = String(err);
            throw new Error(err);
        };
    }
    
    abortCtrl();
    if(suggestions.length) {
        return suggestions
    } else {
        throw new Error("No suggestions");
    };
};

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