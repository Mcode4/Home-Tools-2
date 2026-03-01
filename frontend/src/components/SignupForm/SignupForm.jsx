import { useState } from "react";
import { useModal } from "../../context/Modal";

import './SignupForm.css';

export default function SignupForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [err, setErr] = useState({});
    const { closeModal } = useModal();

    const handleSubmit = async(e) => {
        e.preventDefault();

        // closeModal()
    };
    return (
        <>
        <form onSubmit={handleSubmit}>
            <label>
                Email
                <input
                    type='text'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </label>
            {err.email && <p>{err.email}</p>}
            <label>
                Password
                <input
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </label>
            <label>
                Confirm Password
                <input
                    type='password'
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    required
                />
            </label>
            {err.password && <p>{err.password}</p>}
            <button className='auth-buttons' type='submit'>
                Log In
            </button>
        </form>
        </>
    )
}