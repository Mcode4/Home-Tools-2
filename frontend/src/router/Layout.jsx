import { Outlet } from "react-router-dom";

import { ModalProvider, Modal } from "../context/Modal"
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"

export default function Layout() {
    return (
            <ModalProvider>
                <Navbar />
                <main>
                    <Outlet />
                </main>
                <Footer />
                <Modal />
            </ModalProvider>
    )
}