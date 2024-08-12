import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const useAuthState = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [pingResponse, setPingResponse] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    return {
        username,
        setUsername,
        password,
        setPassword,
        email,
        setEmail,
        message,
        setMessage,
        pingResponse,
        setPingResponse,
        errorMessage,
        setErrorMessage,
    };
};

const useActivateEffect = (navigate, handleActivate) => {
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === '/auth/activate') {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            const email = params.get('email');

            if (token && email) {
                handleActivate(token, email);
            } else {
                handleInvalidActivationLink(navigate);
            }
        }
    }, [location, navigate, handleActivate]);
};

const handleInvalidActivationLink = (navigate) => {
    setTimeout(() => {
        navigate('/');
    }, 2000);
};

const handleRegister = async (username, password, email, setMessage) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/register`, {
            username,
            password,
            email,
        });
        setMessage(response.data.message);
    } catch (error) {
        handleError(error, setMessage);
    }
};

const handleActivate = async (token, email, setMessage, navigate) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/activate`, {
            token,
            email,
        });
        setMessage(response.data.message);
        handleInvalidActivationLink(navigate);
    } catch (error) {
        handleError(error, setMessage);
        handleInvalidActivationLink(navigate);
    }
};

const handleLogin = async (email, password, setMessage) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/login`, {
            email,
            password,
        });
        localStorage.setItem('token', response.data.token);
        setMessage('Login successful!');
    } catch (error) {
        handleError(error, setMessage);
    }
};

const fetchPing = async (setPingResponse, setErrorMessage) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/api/ping`);
        setPingResponse(response.data);
    } catch (error) {
        setErrorMessage('Error fetching ping response');
    }
};

const handleError = (error, setMessage) => {
    if (error.response && error.response.data) {
        setMessage(error.response.data.error);
    } else {
        setMessage("An unexpected error occurred.");
    }
};

const renderRegister = (username, setUsername, password, setPassword, email, setEmail, handleRegister, setMessage) => (
    <>
        <h2>Register</h2>
        <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
        />
        <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
        <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={() => handleRegister(username, password, email, setMessage)}>Register</button>
    </>
);

const renderLogin = (email, setEmail, password, setPassword, handleLogin, setMessage) => (
    <>
        <h2>Login</h2>
        <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
        <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={() => handleLogin(email, password, setMessage)}>Login</button>
    </>
);

const renderPing = (fetchPing, pingResponse, errorMessage, setPingResponse, setErrorMessage) => (
    <>
        <h2>Ping</h2>
        <button onClick={() => fetchPing(setPingResponse, setErrorMessage)}>Ping</button>
        {errorMessage ? (
            <p style={{ color: 'red' }}>{errorMessage}</p>
        ) : (
            pingResponse && <p>Message: {pingResponse.message}</p>
        )}
    </>
);

const Auth = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        username,
        setUsername,
        password,
        setPassword,
        email,
        setEmail,
        message,
        setMessage,
        pingResponse,
        setPingResponse,
        errorMessage,
        setErrorMessage,
    } = useAuthState();

    useActivateEffect(navigate, (token, email) => handleActivate(token, email, setMessage, navigate));

    const renderContent = () => {
        switch (location.pathname) {
            case '/auth/register':
                return renderRegister(username, setUsername, password, setPassword, email, setEmail, handleRegister, setMessage);
            case '/auth/login':
                return renderLogin(email, setEmail, password, setPassword, handleLogin, setMessage);
            case '/auth/ping':
                console.log("/auth/ping : case")
                return renderPing(fetchPing, pingResponse, errorMessage, setPingResponse, setErrorMessage);
            case '/auth/activate':
                return <h2>Activating your account...</h2>;
            default:
                return <h2>Page not found</h2>;
        }
    };

    return (
        <div>
            {renderContent()}
            {message && <p>{message}</p>}
        </div>
    );
};

export default Auth;
