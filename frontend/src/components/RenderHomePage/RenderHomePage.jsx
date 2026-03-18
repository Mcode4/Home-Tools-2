import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { thunkGetAllProperties } from "../../redux/properties";
import { thunkGetAllPoints } from "../../redux/points";

import PropertyForm from "../PropertyForm";
import { ModalButton } from "../../context/Modal";
import "./RenderHomePage.css"

export default function RenderHomePage() {
    // LOADING AND STATE
    const propertyStore = useSelector(store => store.properties);
    const [properties, setProperties] = useState({});
    const [projects, setProjects] = useState({});
    const [initialized, setInitialized] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [reload, setReload] = useState(false);

    let tempProps = ["ftttt", "meart", "wwwkl", "tinke", "uyjtw", "oppeww", "huyner", "opution", "oppurtune", "poerth", "goooooooooodd"]
    let tempProjs = ["kyuth", "opoyth", "hynmui", "oasert", "osert", "vexxer", "lkiyht", "mlkathyu"]

    // SEARCHING and SORTING
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [view, setView] = useState("projects");
    const [sortUp, setSortUp] = useState(true);

    // ETC
    const navigate = useNavigate();

    // TESTING
    useEffect(()=> {
        console.log("VIEW CHANGED", view)
    }, [view]);

    useEffect(()=> {
        console.log("PROJECTIES CHANGED", properties)
    }, [properties]);

    useEffect(()=> {
        console.log("PROJECTS CHANGED", projects)
    }, [projects]);

    useEffect(()=> {
        if(search < 2) return;
    }, [search]);

    useEffect(()=> {
        setProjects([...tempProjs, ...tempProps, ...tempProjs])
        setProperties([...tempProps, ...tempProjs, ...tempProps])
    }, [reload]);

    useEffect(()=> {
        if(!initialized && !propertyStore.data.length) return;

        const allProperties = [];
        const allProjects = [];
        propertyStore.data.forEach(prev => {
            console.log("PROPERTIES PASSING", prev);
        })
    }, [initialized]);

    
    return (
        <div id="render-home">
            <div id="render-home-top">
                <div className="render-search-container">
                    <input 
                        type="text" 
                        name="render-search-inp"
                        id="render-search-inp"
                        value={search}
                        onChange={(e)=> setSearch(e.target.value)}
                    />

                    <div className="render-search-results hidden">
                        {search?.length < 2 ? (
                            <p>Searching after 3 characters...</p>
                        ) : searchResults?.length > 0 ? (
                            searchResults.map(res => (
                                <div className="render-search-res">{res}</div>
                            ))
                        ) : (
                            <p className="render-search-res">Loading search results...</p>
                        )}
                    </div>
                </div>

                <div className="render-top-actions">
                    <button onClick={()=> navigate('/editor')}>Map Page</button>
                    <button onClick={()=> navigate('/dashboard')}>Exit to Dashboard</button>
                </div>
            </div>

            <div id="render-main-screen">
                <div className="render-main-actions">
                    <ModalButton
                        itemText={"Add New Properties"}
                        modalComponent={<PropertyForm />}
                    />

                    {/* MoadlButton New Project */}

                    <select 
                        name="render-home-filter" 
                        id="render-home-filter"
                        value={view}
                        onChange={(e)=> setView(e.target.value)}
                    >
                        <option value="projects">Project</option>
                        <option value="properties">Property</option>
                        <option value="both">Both</option>
                    </select>

                    <div className="render-sort-container">
                        <select name="render-home-sort" id="render-home-sort">
                            <option value="projects">Recent</option>
                            <option value="both">Created</option>
                            <option value="properties">Size</option>
                        </select>

                        <button
                            onClick={() => setSortUp(!sortUp)}
                        >{sortUp ? "Ascending" : "Descending"}</button>
                    </div>
                </div>

                <div className="render-projects">
                    {(view === "projects" || view === "both") && (
                        <div className="render-main-opt-container">
                            <div className="render-main-opt-title">Projects</div>
                            {projects?.length > 0 ? projects.map(p => (
                                <div className="render-main-opts">{p}</div>
                            )) : (
                                <div className="render-main-opts">No projects made.</div>
                            )}
                        </div>
                    )}

                    {(view === "properties" || view === "both") && (
                        <div className="render-main-opt-container">
                            <div className="render-main-opt-title">Properties</div>
                            {projects?.length > 0 ? projects.map(p => (
                                <div className="render-main-opts">{p}</div>
                            )) : (
                                <div className="render-main-opts">No properties made.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}