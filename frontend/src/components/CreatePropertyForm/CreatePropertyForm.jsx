import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../context/Modal";
import { thunkCreateProperty } from "../../redux/properties";
import "./CreatePropertyForm.css";

export default function CreatePropertyForm() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { closeModal } = useModal();
    const [name, setName] = useState('');
    const [address, setAddress] = useState(null);
    const [city, setCity] = useState(null);
    const [county, setCounty] = useState(null);
    const [state, setState] = useState(null);
    const [zip, setZip] = useState(null);
    const [country, setCountry] = useState(null);
    const [lat, setLat] = useState(null);
    const [lng, setLng] = useState(null);
    const [active, setActive] = useState(false);
    const [groupActive, setGroupActive] = useState(null);
    const [group, setGroup] = useState(null);
    const [pinned, setPinned] = useState(false);
    const [err, setErr] = useState({});
    const [searchAddress, setSearchAddress] = useState("")
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsActive, setSuggestionsActive] = useState(false);
    const [displayAddress, setDisplayAddress] = useState(null);

    useEffect(()=> {
        console.log("ACTIVE", active);
    }, [active]);

    useEffect(()=> {
        console.log("SUGGESTIONS", suggestions);
    }, [suggestions]);


    useEffect(()=> {
        if(!searchAddress) {
            setSuggestionsActive(false);
            setSuggestions([]);
            return
        } else {
            setSuggestionsActive(true);
        }
        const searchDelay = setTimeout(()=> {
            handleSearchAddress(searchAddress);
        }, 500);

        return () => {
            clearTimeout(searchDelay);
        };
    }, [searchAddress]);

    const handleSearchAddress = async (addr) => {
        if(addr.trim().length < 3) return;
        setErr({});
        
        const controller = new AbortController();

        try {
            const nominatimSearch = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${addr}&format=json&addressdetails=1&limit=5&extratags=1&featuretype=settlement&countrycodes=us`,
                { signal: controller.signal }
            );

            const results = await nominatimSearch.json();
            console.log("SEARCH RESULTS", results);

            const filtered = results.filter(place =>
                ["highway", "building", "place"].includes(place.class)
            );
            console.log("FILTERED RESULTS", filtered);
            
            const formatted = filtered
                .map(p => formatPlace(p))
                .filter(Boolean);
            console.log("FORMATTED RESULTS", formatted); 
            
            setSuggestions(formatted);
        } catch(err) {
            if (err.name !== "AbortError") {
                setErr({client: String(err)});
                console.error(err);
            };
        }
        return () => controller.abort();
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

    const handleSetAddress = (e, addrObj) => {
        e.preventDefault();
        setSuggestionsActive(false);
        console.log("ADDR OBJECT", addrObj);

        setAddress(addrObj.address ? addrObj.address : null);
        setCity(addrObj.city ? addrObj.city : null);
        setCounty(addrObj.county ? addrObj.county : null);
        setState(addrObj.state ? addrObj.state : null);
        setCountry(addrObj.country ? addrObj.country : null);
        setZip(addrObj.zip ? addrObj.zip : null);
        setLat(addrObj.lat);
        setLng(addrObj.lng);
        setDisplayAddress(addrObj.text);

        if(addrObj.name !== null && addrObj.name.trim() !== "") {
            setName(addrObj.name);
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr({});

        if(!lng || !lat) return;

        try {
            const prop = {
                name,
                lat,
                lng,
                address,
                city,
                county,
                state,
                country,
                zip
            };

            if(active) {
                prop["pinned"] = pinned;
                // Group logic later
            }
            const res = await dispatch(thunkCreateProperty(prop));
            console.log("RESSS CREATE FORM", res);
            if(res.success) {
                closeModal();
                console.log("Success", res)
            } else {
                console.log("FAILED", res);
                setErr({server: res.detail})
            }
        } catch(err) {
            setErr({server: err})
        }
    };

    return (
        <>
        <h2>Create Property</h2>

        <form id="create-prop-form" onSubmit={handleSubmit}>

            <div className="form-group">
                <label htmlFor="create-prop-search">Search Address:</label>
                <input 
                    type="text" 
                    name="address" 
                    id="create-prop-search" 
                    value={searchAddress} 
                    onChange={(e)=> setSearchAddress(e.target.value)}
                />
            </div>

            {suggestionsActive && (
                <ul id="suggestion-bar">
                    {suggestions ? suggestions.map((loc, i) => (
                        <li 
                            key={i} 
                            className="address-choice"  
                            onClick={(e)=> handleSetAddress(e, loc)}>
                            {loc.text}
                        </li>
                    )) : (
                        <li>Search after 3 characters...</li>
                    )}
                </ul>
            )}

            <div className="form-group">
                <label htmlFor="create-prop-name">Name:</label>
                <input 
                    type="text" 
                    name="name" 
                    id="create-prop-name"
                    value={name} 
                    onChange={(e)=> setName(e.target.value)}
                    required
                />
            </div>

            {err.name && (<p>{err.name}</p>)}

            <div className="form-group">
                <label htmlFor="">Address:</label>
                <input 
                    type="text" 
                    name="address" 
                    id="create-prop-address" 
                    value={displayAddress} 
                    required
                    disabled
                />
            </div>
            
            {err.address && (<p>{err.address}</p>)}
            
            <details>
                <summary>Advanced</summary>
                <ul id="extra-create-selection">
                    <li>
                        <input 
                            type="checkbox" 
                            name="group" 
                            id="create-prop-group" 
                            onChange={(e)=> setGroupActive(e.target.checked)} 
                        />
                        Add Group
                        {groupActive && (
                            // Dropdown with all user groups
                            <></>
                        )}
                    </li>
                    <li>
                        <input 
                            type="checkbox" 
                            name="pinned" 
                            id="create-prop-pinned" 
                            checked={pinned} 
                            onChange={(e)=> setPinned(e.target.checked)} 
                        />
                        Pinned
                    </li>
                </ul>
            </details>
            {err.client && (<p>{err.client}</p>)}
            <button 
                type="submit"
                disabled={!address?.length || !name?.length}
            >Submit</button>
        </form>
        </>
        
    )
}
