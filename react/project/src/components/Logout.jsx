import React from 'react';
// import axios from 'axios';
import { useState, useEffect } from 'react';
import { Button } from '@mui/material';


const Logout = () => {
    const [logoutMessage, setLogoutMessage] = useState(''); // 初期値を空文字に

    const handleLogout = async () => {
        try {
            // ローカルストレージにあるtokenというキーのものを削除
            localStorage.removeItem('token');
            localStorage.removeItem('refreshtoken');
            // storageイベント発火
            window.dispatchEvent(new Event("storage"));
            // トークンの削除はブラウザ側だけで実施可能なのでapiは使用しないでOK。トークン管理をサーバ側でも実施するときは削除も必要
            // await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/logout`, {}, {
            //     headers: {
            //     'Authorization': token,
            //     },
            // });
            setLogoutMessage('Logout successful!');
        } catch (error) {
            setLogoutMessage('Logout failed!');
        }
    };

    return (
        <>
            {logoutMessage ? (
                // logoutMessageが空じゃないときはメッセージ表示
                <p>{logoutMessage}</p>
            ) : (
                <Button onClick={handleLogout} type="submit" variant="contained" color="primary" sx={{ mt: 2, width: '150px', mx: 'auto', display: 'block', height: 50, borderRadius: 3 }}>
                ログアウト
                </Button>
            )}
        </>
    );
};

export default Logout;
