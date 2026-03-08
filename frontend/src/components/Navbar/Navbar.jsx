import { useNavigate, useLocation } from "react-router-dom"; 
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef } from "react";
import { thunkLogout } from "../../redux/session";
import { ModalButton } from "../../context/Modal";
import LoginForm from "../LoginForm/LoginForm";
import SignupForm from "../SignupForm/SignupForm";
import "./Navbar.css";

export default function Navbar({ isLoaded }) {
    useSelector(store => console.log("STORE DATA", store))
    const user = useSelector((store)=> store.session.user);
    const navigate = useNavigate();
    const location = useLocation();
    const startLocations = useRef(new Set(["/", "", "/login", "/signup"]));
    const disabledLocations = useRef(new Set(["editor"]))
    const dispatch = useDispatch();
    

    useEffect(()=> {
        if (!isLoaded) return;

        console.log("START", startLocations.current)
        console.log("USER", user)
        if(user) {
            if(startLocations.current.has(location.pathname)) {
                navigate("/dashboard");
                console.log("NAVIGATING..", location.pathname, "TARGET LOCCATIONS:", startLocations.current)
            };

            if(disabledLocations.current.has(location.pathname.split("/")[1])) {
                const nav = document.getElementById("navbar");
                nav.classList.toggle("hidden", true);
            } else {
                const nav = document.getElementById("navbar");
                nav.classList.toggle("hidden", false);
            };
        } else {
            console.log("running:", location.pathname, " in ", startLocations.current)
            if(!startLocations.current.has(location.pathname)) {
                navigate("/");
            };
        }
    }, [isLoaded, user, location]);

    const logout = async (e) => {
        e.preventDefault();
        const logout = await dispatch(thunkLogout())
        if(logout.success) {
            console.log("SUCCESS LOGOUT", logout)
        } else {
            console.log("FAILED LOGOUT", logout)
        }
    }

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
                    <button onClick={logout}>Logout</button>
                </div>
            )}
        </div>
    )
}