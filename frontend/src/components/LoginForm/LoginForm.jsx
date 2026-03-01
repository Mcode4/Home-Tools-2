import { useState } from "react";
import { useModal } from "../../context/Modal";

import './LoginForm.css';

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
            {err.password && <p>{err.password}</p>}
            <button className='auth-buttons' type='submit'>
                Log In
            </button>
        </form>
        </>
    )
}