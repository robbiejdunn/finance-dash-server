import React, { useState, useContext } from "react";
import { AccountContext } from "./Account";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { authenticate } = useContext(AccountContext);

    const onSubmit = (event) => {
        event.preventDefault();

        authenticate(email, password)
            .then((data) => {
                console.log("Logged in!", data);
            })
            .catch((err) => {
                console.error("Failed to log in", err);
            });
    };

    return (
        <div>
            <form onSubmit={onSubmit}>
                <label htmlFor="email">Email</label>
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                ></input>
                <label htmlFor="password">Password</label>
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                ></input>
                <button type="submit">Login</button>
            </form>
        </div>
    )
}