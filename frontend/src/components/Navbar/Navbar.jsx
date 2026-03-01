

import { ModalButton } from "../../context/Modal";
import LoginForm from "../LoginForm/LoginForm";
import SignupForm from "../SignupForm/SignupForm";
import "./Navbar.css";

export default function Navbar() {
    let user;
    return (
        <div id="navbar">
            {!user ? (
                <div className="nav-actions">
                    <ModalButton
                        modalComponent={<LoginForm />}
                        itemText={"Login"}
                    />
                    <ModalButton
                        modalComponent={<SignupForm />}
                        itemText={"Sign up"}
                    />
                </div>
            ) : (
                <div className="nav-actions">
                    <button>Profile</button>
                    <button>Logout</button>
                </div>
            )}
        </div>
    )
}