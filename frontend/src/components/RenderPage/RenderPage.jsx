import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom"

import { thunkGetAllProperties } from "../../redux/properties";
import RenderComponent from "./RenderComponent";
import "./RenderPage.css"

export default function RenderPage() {
    const propertyStore = useSelector(store => store.properties);
    const { pathname } = useLocation();
    const id = Number(pathname.split("/")[2]);
    const [property, setProperty] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [reload, setReload] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // TESTING
    useEffect(()=> {
        console.log("PROPERTY CHANGED", property);
    }, [property])

    useEffect(()=> {
        const initialData = async () => {
            await dispatch(thunkGetAllProperties());
            setInitialized(true);
        }
        initialData()
    }, [reload]);

    useEffect(()=> {
        if(!initialized) return;
        if(!propertyStore.data.length > 0) {
            setLoaded(true);
            return;
        }

        console.log("ID:", id,"GETTING PROPERTY OUT OF PROPERTIES:", propertyStore.data);
        const currProp = propertyStore.data.find(p => p.id === id);
        console.log("CURRENT PROPERTY:", currProp);
        if(currProp) setProperty(currProp);

        setLoaded(true);
    }, [initialized]);

    return loaded ? (
        <div id="render-page">
            <div id="render-top">
                <div className="render-top-title">
                    {property?.name} Render
                </div>

                <div className="render-top-actions">
                    <button onClick={()=> navigate('/editor')}>Map Page</button>
                    <button onClick={()=> navigate('/dashboard')}>Exit to Dashboard</button>
                </div>
            </div>
            
            <div id="render-main">
                <div id="assets-menu">
                    Assets
                </div>

                <div id="properties-menu">
                    Properties Menu
                </div>

                <div id="render-screen">
                    <RenderComponent />
                </div>
            </div>
        </div>
    ) : (
        <p>Loading...</p>
    )
}