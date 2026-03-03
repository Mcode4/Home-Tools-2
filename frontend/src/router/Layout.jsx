import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { thunkSessions as sessions } from "../redux/session";
import { Outlet } from "react-router-dom";

import { ModalProvider, Modal } from "../context/Modal"
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"

export default function Layout() {
    const dispatch = useDispatch();
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(()=> {
        dispatch(sessions()).then(()=> setIsLoaded(true));
    }, []);

    return (
            <ModalProvider>
                <Navbar />
                <main>
                    {isLoaded && <Outlet />}
                </main>
                <Footer />
                <Modal />
            </ModalProvider>
    )
}