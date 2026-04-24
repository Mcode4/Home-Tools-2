import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { thunkSessions as sessions } from "../redux/session";
import { thunkGetSettings } from "../redux/settings";
import { Outlet } from "react-router-dom";

import { ModalProvider, Modal } from "../context/Modal"
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"

export default function Layout() {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.settings);
    const [isLoaded, setIsLoaded] = useState(false);
    
    useEffect(()=> {
        dispatch(sessions())
            .then(() => dispatch(thunkGetSettings()))
            .then(()=> setIsLoaded(true));
    }, [dispatch]);

    return (
            <ModalProvider>
                <div className={`app-container theme-${settings.theme || 'dark'}`}>
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