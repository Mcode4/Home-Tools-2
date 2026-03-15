import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { thunkGetAllProperties, thunkDeleteProperty } from "../../redux/properties";
import { ModalButton, ModalItem } from "../../context/Modal";
import PropertyForm from "../PropertyForm";
import "./DashboardPage.css"

export default function DashboardPage() {
    const properties = useSelector(store => store.properties);
    const [images, setImages] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(()=> {
        dispatch(thunkGetAllProperties());
        console.log("dispatch ran")
    }, [dispatch]);

    const handleDelete = async(e, id) => {
        e.preventDefault();
        const deleteRes = await dispatch(thunkDeleteProperty(id));
        if(deleteRes.success) {
            console.log("SUCCESS HOME DATA", deleteRes);
        } else {
            console.log("FAILED HOME DATA", deleteRes);
        };
    }

    return (
        <div id="home-page">
            <ModalButton
                modalComponent={<PropertyForm />}
                itemText={"Create New Property"} 
            />

            {properties?.data.length > 0 ? (
                <>
                <h2>Properties</h2>
                <span className="property-sections">
                {properties?.data.map(prop => (
                    <div className="property">
                        <div className="click-area">
                            <img src="" alt="property-image" />
                        </div>

                        <p>{prop.name}</p>

                        <div className="property-actions">
                            <button onClick={()=> navigate("/editor", {
                                state: { id: prop.id}
                            })}>Map</button>
                            <ModalButton
                                modalComponent={<PropertyForm id={prop.id} />}
                                itemText={"Edit"} 
                            />
                            <button onClick={(e)=> handleDelete(e, prop.id)}>Delete</button>
                        </div>
                    </div>
                ))}
                </span>
                </>
            ) : (
                <p>
                    No properties available. <br/> 
                    <ModalItem
                        modalComponent={<PropertyForm />}
                        itemText={"Make your first"} 
                    />
                </p>
            )}
        </div>
    )
}