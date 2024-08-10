import React from 'react';
import axios from 'axios';

const Logout = () => {
    const handleLogout = async () => {
        try {
        const token = localStorage.getItem('token');
        await axios.post(`${process.env.GO_API_URL}/logout`, {}, {
            headers: {
            'Authorization': token,
            },
        });
        localStorage.removeItem('token');
        alert('Logout successful!');
        } catch (error) {
        alert('Logout failed!');
        }
    };

    return (
        <div>
        <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default Logout;
