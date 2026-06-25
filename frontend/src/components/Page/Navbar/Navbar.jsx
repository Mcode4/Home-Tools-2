import { useNavigate, useLocation } from "react-router-dom"; 
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef } from "react";
import { thunkLogout } from "../../../redux/session";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Navbar({ isLoaded }) {
    const user = useSelector((store)=> store.session.user);
    const navigate = useNavigate();
    const location = useLocation();
    const startLocations = useRef(new Set(["/", "", "/login", "/signup"]));
    const disabledLocations = useRef(new Set(["editor", "render"]))
    const dispatch = useDispatch();
    

    useEffect(()=> {
        if (!isLoaded) return;

        if(user) {
            if(startLocations.current.has(location.pathname)) {
                navigate("/dashboard");
            };

            if(disabledLocations.current.has(location.pathname.split("/")[1])) {
                const nav = document.getElementById("navbar");
                nav.classList.toggle("hidden", true);
            } else {
                const nav = document.getElementById("navbar");
                nav.classList.toggle("hidden", false);
            };
        } else {
            if(!startLocations.current.has(location.pathname)) {
                navigate("/");
            };
        }
    }, [isLoaded, user, location]);

    const logout = async (e) => {
        e.preventDefault();
        await dispatch(thunkLogout())
    }

    return (
        <div id="navbar" className="flex items-center justify-between px-6 py-3 bg-background border-b border-border">
            <Link to="/" className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">Home Tools</span>
            </Link>
            {!user ? (
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={()=> navigate('/login')}>Login</Button>
                    <Button onClick={()=> navigate('/signup')}>Sign Up</Button>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={()=> navigate('/dashboard')}>Dashboard</Button>
                    <Button variant="outline" onClick={logout}>Logout</Button>
                </div>
            )}
        </div>
    )
}