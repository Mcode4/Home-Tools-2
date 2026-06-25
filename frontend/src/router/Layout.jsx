import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { thunkSessions as sessions } from "../redux/session";
import { thunkGetSettings } from "../redux/settings";
import { Outlet } from "react-router-dom";

import { ModalProvider, Modal } from "../context/Modal"
import Navbar from "../components/Page/Navbar";
import Footer from "../components/Page/Footer"

export default function Layout() {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.settings);
    const [isLoaded, setIsLoaded] = useState(false);
    
    useEffect(()=> {
        dispatch(sessions())
            .then(() => dispatch(thunkGetSettings()))
            .then(()=> setIsLoaded(true))
            .catch(() => setIsLoaded(true));
    }, [dispatch]);

    return (
            <ModalProvider>
                <div className={`app-container${settings.theme ? ` theme-${settings.theme}` : ''}`}>
                    <Navbar isLoaded={isLoaded} />
                    <main>
                        {isLoaded && <Outlet />}
                    </main>
                    <Footer />
                    <Modal />
                </div>
            </ModalProvider>
    )
}