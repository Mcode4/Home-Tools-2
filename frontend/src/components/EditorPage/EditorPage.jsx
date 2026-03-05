

import MapComponent from "./Map";
import "./EditorPage.css";

export default function EditorPage() {

    return (
        <div id="editor">
            <div id="editor-top">
                <input 
                    type="text" 
                    name="search" 
                    id="app-searchbar"
                    placeholder="🔍 Search Location" 
                />
            </div>
            <div id="editor-main">
                <div className="app-slider">
                    <ul className="menu"></ul>
                    <ul className="menu-tools"></ul>
                </div>

                <span className="popup-span"></span>

                <MapComponent />             
            </div>
        </div>
    )
}