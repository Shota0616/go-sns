// src/components/MyPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyPage = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/auth/login');
                return;
            }

            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/api/getuser`, {
                    headers: {
                        'Authorization': token,
                    },
                });
                setUser(response.data);
            } catch (error) {
                // localStorage.removeItem('token');
                // navigate('/auth/login');
                onsole.log("/mypage : error")
            }
        };

        checkAuth();
    }, [navigate]);

    return (
        <div>
            <h2>My Page</h2>
            {user ? (
                <div>
                    <p>Username: {user.username}</p>
                    <p>Email: {user.email}</p>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default MyPage;
