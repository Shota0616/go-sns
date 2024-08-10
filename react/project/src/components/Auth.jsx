import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const Auth = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const [pingResponse, setPingResponse] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        console.log('useEffect triggered');
        if (location.pathname === '/auth/activate') {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            const email = params.get('email');

            console.log('Token:', token);
            console.log('Email:', email);

            if (token && email) {
                handleActivate(token, email);
            } else {
                setMessage("Invalid activation link.");
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            }
        }
    }, [location, navigate]);

    const handleRegister = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/register`, {
                username,
                password,
                email,
            });
            setMessage(response.data.message);
        } catch (error) {
            if (error.response && error.response.data) {
                setMessage(error.response.data.error);
            } else {
                setMessage("An unexpected error occurred.");
            }
        }
    };

    const handleActivate = async (token, email) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/activate`, {
                token: token,
                email: email,
            });
            setMessage(response.data.message);
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error) {
            if (error.response && error.response.data) {
                setMessage(error.response.data.error);
            } else {
                setMessage("An unexpected error occurred during activation.");
            }
            setTimeout(() => {
                navigate('/');
            }, 2000);
        }
    };

    const handleLogin = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/login`, {
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
