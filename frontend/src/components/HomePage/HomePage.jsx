import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { thunkGetAllProperties, thunkDeleteProperty } from "../../redux/properties";
import { ModalButton, ModalItem } from "../../context/Modal";
import CreatePropertyForm from "../CreatePropertyForm/CreatePropertyForm";
import "./HomePage.css"

export default function HomePage() {
    const [data, setData] = useState(
        useSelector(store => store.properties)
    );
    const [images, setImages] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(()=> {
        console.log("HOME PAGE DATA", data)
        if(!data.pinned.length && !data.other.length) {
            loadData();
        };
        async function loadData() {
            console.log("LOADING HOME DATA");
            try {
                const propData = await dispatch(thunkGetAllProperties());
                if(propData.success) {
                    console.log("SUCCESS HOME DATA", propData);
                } else {
                    console.log("FAILED HOME DATA", propData);
                };
            } catch(e) {
                console.log("ERROR OCCURED WHILE LOADING HOME DATA", e);
            } finally {
                setLoaded(true);
            };
        };
    }, [data])

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
                            <button>Delete</button>
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