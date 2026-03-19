import { useState, useEffect, useRef } from "react";
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

    const [tool, setTool] = useState(null);
    const toolSettingsRef = useRef({
        line: {type: "line", width: 2, color: "#000", draggable: true, snap: false},
        clear: {type: "clear"},
        handle: {type: "handle", width: 1, color: "#000", snap: true}
    })

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

    function selectTool(toolName) {
        let el = document.getElementById(`${tool?.type}-tool`);
        if(el?.classList.contains("active")) el.classList.remove("active");

        if(tool?.type === toolName) {
            setTool(null);
        } else {
            if(!["clear"].includes(toolName)) {
                el = document.getElementById(`${toolName}-tool`);
                el.classList.add("active");
            }
            setTool(toolSettingsRef.current[toolName]);
        }
    }

    function handleToolChange(type, change) {
        console.log("HANDLE TOOL CHANGE HIT");
        if(
            ["line", "handle"].includes(type) &&
            ["width", "color", "draggable", "snap"].includes(Object.keys(change)[0])
        ) {
            console.log("SETTING TOOL CHANGE", {type, change});
            toolSettingsRef.current[type] = {
                ...toolSettingsRef.current[type], ...change
            }
            setTool(toolSettingsRef.current[type]);
        }
    }

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
                    <div className="render-toolbar">
                        <span className="render-tools">
                            <button
                                id="handle-tool"
                                onClick={()=> selectTool("handle")}
                            >Handle</button>
                            <button
                                id="line-tool"
                                onClick={()=> selectTool("line")}
                            >Line</button>
                            <button
                                id="clear-tool"
                                onClick={()=> selectTool("clear")}
                            >Clear</button>
                        </span>
                        {["line", "handle"].includes(tool?.type) && (
                            <span id="render-tool-settings" >
                                <div className="input-container">
                                    <input 
                                        type="color" 
                                        id="tool-color-setting"
                                        value={tool.color}
                                        onChange={(e)=> handleToolChange(tool.type, {color: e.target.value})}
                                    />
                                </div>
                                <div className="input-container">
                                    <p>{tool?.width}</p>
                                    <input 
                                        type="range" 
                                        id="tool-size-setting"
                                        min={
                                            tool?.type === "line"
                                                ? 0.7
                                                : 0.5
                                        }
                                        max={
                                            tool?.type === "line"
                                                ? 9
                                                : 6
                                        }
                                        step={0.1}
                                        value={tool.width}
                                        onChange={(e)=> handleToolChange(tool.type, {width: e.target.value})}
                                    />
                                </div>
                                {tool?.type === "line" && (
                                <div className="input-container">
                                    <label htmlFor="tool-size-setting">Draggable:</label>
                                    <input 
                                        type="checkbox" 
                                        id="tool-size-setting"
                                        checked={tool.draggable}
                                        onChange={(e)=> handleToolChange(tool.type, {draggable: e.target.checked})}
                                    />
                                </div>
                                )}
                                
                                <div className="input-container">
                                    <label htmlFor="tool-size-setting">Snap to grid:</label>
                                    <input 
                                        type="checkbox" 
                                        id="tool-size-setting"
                                        checked={tool.snap}
                                        onChange={(e)=> handleToolChange(tool.type, {snap: e.target.checked})}
                                    />
                                </div>
                            </span>
                        )}
                    </div>
                    <RenderComponent 
                        activeTool={tool}
                    />
                </div>
            </div>
        </div>
    ) : (
        <p>Loading...</p>
    )
}