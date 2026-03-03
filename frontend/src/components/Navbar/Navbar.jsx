import { useNavigate, useLocation } from "react-router-dom"; 
import { useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { ModalButton } from "../../context/Modal";
import LoginForm from "../LoginForm/LoginForm";
import SignupForm from "../SignupForm/SignupForm";
import "./Navbar.css";

export default function Navbar() {
    const user = useSelector((store)=> store.session.user);
    const navigate = useNavigate();
    const location = useLocation();
    const startLocations = useRef(new Set(["/", "", "/login", "/signup"]));
    

    useEffect(()=> {
        console.log("START", startLocations.current)
        console.log("USER", user)
        if(user) {
            if(startLocations.current.has(location.pathname)) {
                navigate("/home");
            };
        } else {
            console.log("running:", location.pathname, " in ", startLocations.current)
            if(!startLocations.current.has(location.pathname)) {
                navigate("/");
            };
        }
    }, [user, location]);

    return (
        <div id="navbar">
            <a href="/">
                <h1>Home Tools</h1>
            </a>
            {!user ? (
                <div className="nav-actions">
                    {/* <ModalButton
                        modalComponent={<LoginForm />}
                        itemText={"Login"}
                    />
                    <ModalButton
                        modalComponent={<SignupForm />}
                        itemText={"Sign up"}
                    /> */}
                    <button onClick={()=> navigate('/login')}>Login</button>
                    <button onClick={()=> navigate('/signup')}>Signup</button>
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