
import "./Navbar.css";

export default function Navbar() {
    let user;
    return (
        <div id="navbar">
            {user ? (
                <div className="nav-actions">
                    <button>Login</button>
                    <button>Sign up</button>
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