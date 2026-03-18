import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import { useModal } from "../../../context/Modal";
import "./NavigateModal.css"

export default function NavigateModal({to}) {
    const [context, setContext] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const { closeModal } = useModal();
    const navigate = useNavigate();
    
    useEffect(()=> {
        if(!to) {
            setLoaded(true);
            return;
        }

        if(to === "render") {
            setContext("Render Page");
        }
    }, []);

    const handleNavigate = (e) => {
        e.preventDefault();

        if(to === "render") {
            navigate('/render');
        }
        
        closeModal();
    }

    return (
        <div id="navigate-modal">
            <h2>Are you sure you want to go to {context}</h2>
            <div className="navigate-actions">
                <button
                    onClick={handleNavigate}
                >Yes</button>
                <button
                    onClick={()=> closeModal()}
                >No</button>
            </div>
        </div>
    )
}