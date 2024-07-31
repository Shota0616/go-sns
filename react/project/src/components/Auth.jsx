import React, { useState } from 'react';
import axios from 'axios';

const Auth = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const [pingResponse, setPingResponse] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleRegister = async () => {

        try {
            console.log(`try`)
            const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/register`, {
                username,
                password,
                email,
            });
            setMessage(response.data.message);
        } catch (error) {
            console.log(`catch`)
            if (error.response && error.response.data) {
                setMessage(error.response.data.error);
            } else {
                setMessage("An unexpected error occurred.");
            }
        }
    };

    const handleActivate = async () => {
        try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/activate`, {
            email,
            token: prompt('Enter the activation token sent to your email:'),
        });
        setMessage(response.data.message);
        } catch (error) {
        setMessage(error.response.data.error);
        }
    };

    const handleLogin = async () => {
        try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/login`, {
            username,
            password,
        });
        localStorage.setItem('token', response.data.token);
        setMessage('Login successful!');
        } catch (error) {
        setMessage(error.response.data.error);
        }
    };

    const fetchPing = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/api/ping`);
            setPingResponse(response.data);
        } catch (error) {
            setErrorMessage('Error fetching ping response');
        }
    };


    return (
        <div>
        <h2>Authentication</h2>
        <div>
            <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            />
            <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />
            <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            />
        </div>
        <div>
            <button onClick={handleRegister}>Register</button>
            <button onClick={handleActivate}>Activate</button>
            <button onClick={handleLogin}>Login</button>
            <button onClick={fetchPing}>Ping</button>
        </div>
        {message && <p>{message}</p>}
        {errorMessage ? (
                <p style={{ color: 'red' }}>{errorMessage}</p>
            ) : (
                pingResponse && (
                    <div>
                        <p>Message: {pingResponse.message}</p>
                    </div>
                )
        )}
        </div>
    );
};

export default Auth;
