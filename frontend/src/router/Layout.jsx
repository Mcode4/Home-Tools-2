import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { thunkSessions as sessions } from "../redux/session";
import { thunkGetSettings } from "../redux/settings";
import { Outlet } from "react-router-dom";

import { ModalProvider, Modal } from "../context/Modal"
import Navbar from "../components/Page/Navbar";
import Footer from "../components/Page/Footer"
import ErrorBoundary from "../components/ErrorBoundary";

export default function Layout() {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.settings);
    const [isLoaded, setIsLoaded] = useState(false);
    
    useEffect(()=> {
        console.log("Layout mounted, dispatching sessions...");
        dispatch(sessions())
            .then(() => dispatch(thunkGetSettings()))
            .then(()=> {
                console.log("isLoaded set to true");
                setIsLoaded(true);
            })
            .catch((err) => {
                console.error("Layout init error:", err);
                setIsLoaded(true);
            });
    }, [dispatch]);

    console.log("Render Layout, isLoaded:", isLoaded);

    return (
        <ErrorBoundary>
            <ModalProvider>
                <div className={`app-container${settings.theme ? ` theme-${settings.theme}` : ''}`}>
                    <Navbar isLoaded={isLoaded} />
                    <main>
                        {isLoaded ? <Outlet /> : <div style={{ padding: 40, color: "white" }}>Loading...</div>}
                    </main>
                    <Footer />
                    <Modal />
                </div>
            </ModalProvider>
        </ErrorBoundary>
    )
}