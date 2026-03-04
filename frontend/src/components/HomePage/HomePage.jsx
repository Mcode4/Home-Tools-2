import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { thunkGetAllProperties, thunkDeleteProperty } from "../../redux/properties";
import { ModalButton, ModalItem } from "../../context/Modal";
import CreatePropertyForm from "../CreatePropertyForm/CreatePropertyForm";
import "./HomePage.css"

export default function HomePage() {
    const data = useSelector(store => store.properties);
    const [images, setImages] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(()=> {
        dispatch(thunkGetAllProperties());
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

    return (<>
    {loaded && (
        <div id="home-page">
            <ModalButton
                modalComponent={<CreatePropertyForm />}
                itemText={"Create New Property"} 
            />

            {data?.pinned.length > 0 && (
                <>
                <h2>Pinned Properties</h2>
                <span className="property-sections">
                {data.pinned.map(prop => (
                    <div className="property">
                        <div className="click-area">
                            <img src="" alt="property-image" />
                        </div>

                        <p>{prop.name}</p>

                        <div className="property-actions">
                            <button>Map</button>
                            <button>Edit</button>
                            <button>Delete</button>
                        </div>
                    </div>
                ))}
                </span>
                </>
            )}
            {data?.other.length > 0 && (
                <>
                <h2>Properties</h2>
                <span className="property-sections">
                {data.other.map(prop => (
                    <div className="property">
                        <div className="click-area">
                            <img src="" alt="property-image" />
                        </div>

                        <p>{prop.name}</p>

                        <div className="property-actions">
                            <button>Map</button>
                            <button>Edit</button>
                            <button onClick={(e)=> handleDelete(e, prop.id)}>Delete</button>
                        </div>
                    </div>
                ))}
                </span>
                </>
            )}
            {!data?.pinned.length && !data?.other.length && (
                <p>
                    No properties available. <br/> 
                    <ModalItem
                        modalComponent={<CreatePropertyForm />}
                        itemText={"Make your first"} 
                    />
                </p>
            )}
        </div>
    )}
    </>)
}