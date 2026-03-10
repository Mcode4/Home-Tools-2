import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

import { 
    thunkGetAllProperties, 
    thunkCreateProperty,
    thunkEditProperty,
    thunkDeleteProperty 
} from "../../redux/properties";
import { 
    thunkGetAllPoints ,
    thunkCreatePoint,
    thunkEditPoint,
    thunkDeletePoint
} from "../../redux/points";
import { useModal } from "../../context/Modal";
import "./ManagePointsModal.css"

export default function ManagePointsModal({
    point, 
    isSaved,
    addFunc,
    deleteFunc,
    changeFunc
}) {
    const [name, setName] = useState(point?.name);
    const [location, setLocation] = useState(null);
    const [icon, setIcon] = useState(null);
    const [radius, setRadius] = useState(null);
    const [type, setType] = useState(null);
    const [err, setErr] = useState({});
    const [initialState, setInitialState] = useState({});
    const dispatch = useDispatch();
    const { closeModal } = useModal();

    useEffect(()=> {
        setInitialState({
            name,
            location
        });

        if(point?.type) {
            setType(point?.type);
            setInitialState(prev => ({...prev, type: point?.type}));
            
            if(point?.type === "icon") {
                setIcon(point?.icon);
                setInitialState(prev => ({...prev, icon: point?.icon}));
            } else if(point?.type === "radius") {
                setRadius(point?.radius);
                setInitialState(prev => ({...prev, radius: point?.radius}));
            };
        };

        console.log("POINT MODAL POINT:", point, "ISSAVED:", isSaved);
    }, []);

    const handleAdd = (e) => {
        e.preventDefault();
        setErr({});

        const newPoint = {
            ...point,
            name,
            type,
            // location,
            icon,
            radius
        };

        if(initialState.icon !== icon) handleIconChange();
        if(initialState.radius !== radius) handleRadiusChange();

        addFunc(newPoint);
        closeModal();
    };
    
    const handleDelete = (e) => {
        e.preventDefault();
        setErr({});

        deleteFunc(point.id);
        closeModal();
    };

    const handleTypeChange = (value) => {
        if(!["radius", "marker", "icon"].includes(value)) {
            setErr({e: "Type must be: Marker, Icon, or Radius"})
        }
    };

    const handleIconChange = (value) => {
        console.log("ICON CHANGE HIT")
        changeFunc(point.id, {icon, name})
        return true
    };

    const handleRadiusChange = () => {
        if(isNaN(radius)) {
            setErr({e: "Radius must be a number"});
            return;
        };
        changeFunc(point.id, {radius: Number(radius)});
        return true
    };

    return (
        <form onSubmit={handleAdd}>
            <div className="form-group">
                <label htmlFor="point-name">Name:</label>
                <input 
                    type="text" 
                    name="point-name" 
                    id="point-name" 
                    value={name}
                    onChange={(e)=> setName(e.target.value)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="point-location">Location:</label>
                <input type="text" name="point-location" id="point-location" disabled />
            </div>

            {point?.type && (
                <div className="form-group">
                <label htmlFor="point-type">Type:</label>
                <select name="point-type" id="point-type" value={point?.type}>
                    <option value="marker">Marker</option>
                    <option value="icon">Icon</option>
                    <option value="radius">Radius</option>
                </select>
                </div>
            )}

            {point?.type === "icon" && (
                <div className="form-group">
                <label htmlFor="point-icon">Icon:</label>
                <input 
                    type="text" 
                    name="point-icon" 
                    id="point-icon"
                    value={icon}
                    onChange={(e)=> setIcon(e.target.value)}
                />
                </div>
            )}

            {point?.type === "radius" && (
                <div className="form-group">
                <label htmlFor="point-radius">Radius:</label>
                <input 
                    type="number" 
                    name="point-radius" 
                    id="point-radius" 
                    value={Number(radius).toFixed(2)}
                    onChange={(e)=> setRadius(e.target.value)}
                />
                </div>
            )}

            {err.e && (<p>{err.e}</p>)}

            <button
                type="submit"
            >{isSaved ? "Update" : "Save point"}</button>
            <button
                type="button"
                onClick={handleDelete}
            >Delete</button>
        </form>
    )
}