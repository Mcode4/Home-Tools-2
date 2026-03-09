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
    editFunc,
    deleteFunc,
    saveFunc
}) {
    const [name, setName] = useState(point?.name);
    const [location, setLocation] = useState();
    const [icon, setIcon] = useState();
    const [radius, setRadius] = useState();
    const [err, setErr] = useState({});
    const dispatch = useDispatch();
    const { closeModal } = useModal();

    useEffect(()=> {
        if(point?.type === "icon") {
            setIcon(point?.icon);
        } else if(point?.type === "radius") {
            setRadius(point?.radius);
        };

        console.log("POINT MODAL POINT:", point);
    }, [])

    const handleSave = async() => {
        setErr({});
    };

    const handleUpdate = async(e, type="property") => {
        e.preventDefault();
        setErr({});
        if(type === "property") {
            return
        } else if(type === "marker") {
            point.name = name;
            // edit.location = location;
            if(icon) point.icon = icon;
            if(radius) point.radius = radius;
            closeModal();
            return point;
        };
    };

    const handleDelete = async() => {
        setErr({});
    };
    return (
        <>
        {isSaved ? (
            <form onSubmit={(e)=> handleUpdate(e, point.type)}>
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

                {point?.type === "icon" && (
                    <div className="form-group">
                    <label htmlFor="point-icon">Icon:</label>
                    <input 
                        type="text" 
                        name="point-icon" 
                        id="point-icon" 
                    />
                    </div>
                )}

                {point?.type === "radius" && (
                    <div className="form-group">
                    <label htmlFor="point-radius">Radius:</label>
                    <input type="text" name="point-radius" id="point-radius" />
                    </div>
                )}

                <button
                    type="submit"
                >Update</button>
                <button
                    type="button"
                >Delete</button>
            </form>
        ) : (
            <>
            {point?.type === "marker" || point?.type === "building" ? (
                <div>
                    <button>Save as property</button>
                    <button>Save as point</button>
                    <button>Delete</button>
                </div>
            ) : (
                <div>
                    <button>Save point</button>
                    <button>Delete</button>
                </div>
            )}
            </>
        )}
        </>
    )
}