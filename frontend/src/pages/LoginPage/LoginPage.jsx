import { useState} from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { thunkLogin } from "../../redux/session";

export default function LoginFormPage() {
    const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");
        const [err, setErr] = useState({});
        const dispatch = useDispatch();
        const navigate = useNavigate();
    
        const handleSubmit = async(e) => {
            e.preventDefault();
            setErr({});
            console.log('Submit in progress')
            try {
                const user = await dispatch(thunkLogin({email, password}));
                console.log('Login successful, USER:', user);
                if(user.success) {
                    // addToast("Welcome back! 👋", "info");
                    navigate('/editor');
                } else {
                    setErr({server: String(user.detail)})
                }
            } catch(err) {
                console.log("Login error: ", err);
                if(err.status === 404) {
                    setErr({
                        email: "Email doesn't have an account"
                    });
                } else if(err.status === 401) {
                    setErr({
                        password: "Invalid password"
                    });
                } else {
                    if(err.message) {
                        setErr({
                            error: err.message
                        })
                    } else {
                        setErr({
                            error: "Server error, please try again."
                        })
                    }
                }
            }
        };
        return (
            <div className="session-background">
            <form onSubmit={handleSubmit} className="session-form">
                <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: 24, fontWeight: 700 }}>Welcome Back</h2>
                <p style={{ margin: '-8px 0 0', color: 'var(--text-dim)', fontSize: 14 }}>Sign in to Home Tools</p>

                <label>Email</label>
                <input
                    type='text'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                {err.email && <p className="session-error">{err.email}</p>}
                <label>Password</label>
                <input
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {err.password && <p className="session-error">{err.password}</p>}
                {err.server && <p className="session-error">{err.server}</p>}
                {err.error && <p className="session-error">{err.error}</p>}
                <button className='auth-buttons' type='submit'>
                    Log In
                </button>
            </form>
            </div>
        )
}