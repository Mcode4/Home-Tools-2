import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { thunkSignup } from "../../redux/session";

export default function SignupFormPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [err, setErr] = useState({});
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async(e) => {
        e.preventDefault();
        setErr({});
        const SYMBOL = "!@#$%?.-";
        const ALLOWED = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789${SYMBOL}`;

        if(confirmPwd !== password) {
            return setErr({
                password: "Passwords don't match"
            });
        }

        if(password.length < 8 || password.length > 25) {
            return setErr({
                password: "Password must be 8-25 characters"
            });
        }
        let symbolCheck = false;
        let upperCaseCheck = false;
        let numberCheck = false;

        for(let i=0; i<password.length; i++) {
            if(!ALLOWED.includes(password[i])) {
                console.log('NOT ALLOWED: ', password[i])
                return setErr({
                    password: "Password contains characters not allowed. Only A-Z, 0-9, and !@#$%?.-"
                });
            }
            if(isFinite(Number(password[i]))) numberCheck = true;
            if("ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(password[i])) {
                console.log(`${password[i]} passed uppercased check`);
                upperCaseCheck = true;
            }
            if(SYMBOL.includes(password[i])) symbolCheck = true;
        }


        if(!symbolCheck || !upperCaseCheck || !numberCheck) {
            return setErr({
                password: `Password must contain at least 1 uppercased character, 1 number and 1 special character: ${SYMBOL}`
            });
        }

        try {
            const signup = await dispatch(thunkSignup({
                email,
                password
            }));

            console.log("SIGNUP", signup)
            if(signup.success) {
                navigate("/");
            } else {
                setErr({server: signup.detail});
            };
        } catch(e) {
            setErr({server: String(e)});
        }
    };
    return (
        <div className="session-background">
        <form onSubmit={handleSubmit} className="session-form">
            <label>Email:</label>
            <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            {err.email && <p>{err.email}</p>}
            <label>Password:</label>
            <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <label>Confirm Password:</label>
            <input
                type='password'
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                required
            />
            {err.password && <p>{err.password}</p>}
            {err.server && <p>{err.server}</p>}
            <button className='auth-buttons' type='submit'>
                Log In
            </button>
        </form>
        </div>
    )
}