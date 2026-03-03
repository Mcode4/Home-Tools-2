import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../context/Modal";
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
    const [active, setActive] = useState(false);
    const [groupActive, setGroupActive] = useState(null);
    const [group, setGroup] = useState(null);
    const [pinned, setPinned] = useState(false);
    const [err, setErr] = useState({});
    const [searchAddress, setSearchAddress] = useState("")
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsActive, setSuggestionsActive] = useState(false);

    useEffect(()=> {
        console.log("ACTIVE", active);
    }, [active]);

    useEffect(()=> {
        console.log("SUGGESTIONS", suggestions);
    }, [suggestions]);


    useEffect(()=> {
        setAddress(null);
        setCity(null);
        setCounty(null);
        setState(null);
        setCountry(null);
        setZip(null);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr({});

        closeModal();
    };

    const handleSearchAddress = async (addr) => {
        console.log(addr, "--2 addresses--", searchAddress)
        if(searchAddress !== addr) return;
        if(addr.trim().length < 3) return;
        setSuggestions([])
        const nominatimSearch = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${addr}&format=json&addressdetails=1&limit=5&extratags=1&featuretype=settlement&countrycodes=us`
        );
        const results = await nominatimSearch.json();
        console.log("SEARCH RESULTS", results);
        const filtered = results.filter(place =>
            place.class === "highway" ||
            place.class === "building" ||
            place.class === "place"
        );
        console.log("FILTERED RESULTS", filtered);
        if(filtered.length > 0) {
            console.log("FORMATTING RESULTS")
            const formatted = filtered.forEach(p => formatPlace(p));
        }
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
            address: fStreet, 
            city: fCity, 
            state: fState,
            county: fCounty, 
            country: fCountry, 
            zip: fZip,
            lat: place.lat,
            lng: place.lon,
            text: []
        };

        for(let key in locationObj) {
            const value = locationObj[key];
            if(value && key !== "lat" && key !== "lng") {
                locationObj.text.push(value);
            } else {
                delete locationObj[key];
            };
        };

        // console.log("LOCATION OBJECT MADE:", locationObj);

        if(locationObj.text.length) {
            locationObj.text = locationObj.text.join(", ");
            setSuggestions(s => [...s, locationObj]);
        };
        return;
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
    }

    return (
        <>
        <h2>Create Property</h2>

        <form id="create-prop-form" onSubmit={handleSubmit}>
            <label>Name:</label><br/>
            <input type="text" name="name" id="create-prop-name"
                value={name} onChange={(e)=> setName(e.target.value)}
             />
            {err.name && (<p>{err.name}</p>)}
            <br/>

            <label>Address:</label><br/>
            <input type="text" name="address" id="create-prop-address" 
                value={searchAddress} onChange={(e)=> setSearchAddress(e.target.value)}
            />
            {err.address && (<p>{err.address}</p>)}
            
            {suggestionsActive && (
                <ul id="suggestion-bar">
                    {suggestions ? suggestions.map((loc, i) => (
                        <li key={i} className="address-choice"  onClick={(e)=> handleSetAddress(e, loc)}>
                            {loc.text}
                        </li>
                    )) : (
                        <li>Search after 3 characters...</li>
                    )}
                </ul>
            )}

            <details id="prop-advanced">
                <summary>Advanced</summary>
                <ul>
                    <li>
                        <input type="checkbox" name="group" id="create-prop-group" onChanged={(e)=> setGroupActive(e.target.checked)} />
                        Add Group
                        {groupActive && (
                            // Dropdown with all user groups
                            <></>
                        )}
                    </li>
                    <li>
                        <input type="checkbox" name="pinned" id="create-prop-pinned" onChange={(e)=> setPinned(e.target.checked)} />
                        Pinned
                    </li>
                </ul>
            </details>
        </form>
        </>
        
    )
}
