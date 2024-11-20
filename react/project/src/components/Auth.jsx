import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

const useAuthState = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [token, setToken] = useState('');

    return {
        username,
        setUsername,
        password,
        setPassword,
        email,
        setEmail,
        message,
        setMessage,
        messageType,
        setMessageType,
        verificationCode,
        setVerificationCode,
        newPassword,
        setNewPassword,
        token,
        setToken,
    };
};

// 新規登録の処理
const handleRegister = async (username, password, email, setMessage, setMessageType, navigate) => {
    if (!username || !password || !email) {
        let missingFields = [];
        if (!username) missingFields.push('ユーザー名');
        if (!password) missingFields.push('パスワード');
        if (!email) missingFields.push('メールアドレス');
        setMessage(`${missingFields.join('、')}の入力必須です`);
        setMessageType('error'); // エラーメッセージの種類を設定
        return;
    }
    try {
        const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/register`, {
            username,
            password,
            email,
        });
        setMessage(response.data.message);
        setMessageType('success'); // 成功メッセージの種類を設定
        navigate('/auth/verify'); // 登録成功後にメールの検証画面にリダイレクト
    } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
            setMessage(error.response.data.error);
        } else {
            setMessage('登録に失敗しました');
        }
        setMessageType('error'); // エラーメッセージの種類を設定
    }
};

// ログインの処理
const handleLogin = async (email, password, setMessage, setMessageType, navigate) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/login`, {
            email,
            password,
        });

        localStorage.setItem('token', response.data.token); // アクセストークンをlocalStorageに保存
        localStorage.setItem('refrestoken', response.data.refreshtoken); // リフレッシュトークンも保存
        window.dispatchEvent(new Event("storage")); // storageイベントを発火
        setMessage('Login successful!'); // 成功メッセージを設定


        setMessage('ログインに成功しました');
        setMessageType('success'); // 成功メッセージの種類を設定

    } catch (error) {
        // エラーレスポンスの処理

        if (error.response.status === 303) {
            navigate("/auth/verify", { state: { error: error.response.data.message } });
        } else {
            setMessage('ログインに失敗しました');
        }
        setMessageType('error'); // エラーメッセージの種類を設定
    }
};

// 認証コードの再送信の処理
const handleResendVerificationCode = async (email, setMessage, setMessageType) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/resend-verification-code`, {
            email,
        });
        setMessage(response.data.message);
        setMessageType('success'); // 成功メッセージの種類を設定
    } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
            setMessage(error.response.data.error);
        }else {
            setMessage('認証コードの再送に失敗しました');
        }
        setMessageType('error');
    }
};

// 認証コードの処理
const handleVerify = async (email, verificationCode, setMessage, setMessageType, navigate) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/verify`, {
            email,
            verificationCode,
        });
        setMessage(response.data.message);
        setMessageType('success'); // 成功メッセージの種類を設定
        navigate('/auth/login'); // 認証成功後にログイン画面にリダイレクト
    } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
            setMessage(error.response.data.error);
        } else {
            setMessage('認証に失敗しました');
        }
        setMessageType('error'); // エラーメッセージの種類を設定
    }
};

const handleResetPassword = async (token, newPassword, setMessage, setMessageType, navigate) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/reset-password`, {
            token,
            newPassword,
        });
        setMessage(response.data.message);
        setMessageType('success');
        navigate('/auth/login');
    } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
            setMessage(error.response.data.error);
        } else {
            setMessage('パスワード再設定に失敗しました');
        }
        setMessageType('error');
    }
};

const Auth = ({ open, handleClose }) => {
    const { username, setUsername, password, setPassword, email, setEmail, message, setMessage, messageType, setMessageType, verificationCode, setVerificationCode, newPassword, setNewPassword, token, setToken } = useAuthState();
    const location = useLocation();
    const navigate = useNavigate();

    // ページ遷移時にメッセージをリセット
    useEffect(() => {
        // location.stateからmessageを取得し、setMessageで状態を更新。messageがない場合は空文字を設定。
        setMessage(location.state?.message || '');
        // location.stateからmessageTypeを取得し、setMessageTypeで状態を更新。messageTypeがない場合は空文字を設定。
        setMessageType(location.state?.messageType || ''); // メッセージの種類をリセット
    // location.pathnameまたはlocation.stateが変更されるたびにこのuseEffectが実行される。
    }, [location.pathname, location.state]);

    useEffect(() => {
        // location.searchからクエリパラメータを取得し、URLSearchParamsオブジェクトを作成。
        const params = new URLSearchParams(location.search);
        // クエリパラメータから'token'を取得。
        const token = params.get('token');
        // tokenが存在する場合、setTokenで状態を更新。
        if (token) {
            setToken(token);
        }
    // location.searchが変更されるたびにこのuseEffectが実行される。
    }, [location.search]);

    useEffect(() => {
        // location.searchからクエリパラメータを取得し、URLSearchParamsオブジェクトを作成。
        const params = new URLSearchParams(location.search);
        // クエリパラメータから'email'を取得。
        const emailParam = params.get('email');
        // emailParamが存在する場合、setEmailで状態を更新。
        if (emailParam) {
            setEmail(emailParam);
        }
    // location.searchが変更されるたびにこのuseEffectが実行される。
    }, [location.search]);

    const renderRegister = () => (
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleRegister(username, password, email, setMessage, setMessageType, navigate); }} sx={{ mt: 2 }}>
            <TextField
                label="ユーザー名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                    style: {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                    },
                }}
                InputLabelProps={{
                    style: { color: 'white' },
                }}
            />
            <TextField
                label="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                    style: {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                    },
                }}
                InputLabelProps={{
                    style: { color: 'white' },
                }}
            />
            <TextField
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                    style: {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                    },
                }}
                InputLabelProps={{
                    style: { color: 'white' },
                }}
            />
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2, width: '50%', mx: 'auto', display: 'block', height: 50, borderRadius: 3 }}>
                新規登録
            </Button>
        </Box>
    );

    const renderLogin = () => (
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(email, password, setMessage, setMessageType, navigate); }} sx={{ mt: 2 }}>
            <TextField
                label="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                    style: {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                    },
                }}
                InputLabelProps={{
                    style: { color: 'white' },
                }}
            />
            <TextField
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                    style: {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                    },
                }}
                InputLabelProps={{
                    style: { color: 'white' },
                }}
            />
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2, width: '50%', mx: 'auto', display: 'block', height: 50, borderRadius: 3 }}>
                ログイン
            </Button>
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                <Link to="/auth/request-password-reset" style={{ color: '#1976d2', textDecoration: 'none' }}>
                    パスワードをお忘れですか？
                </Link>
            </Typography>
        </Box>
    );

    const renderVerify = () => (
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleVerify(email, verificationCode, setMessage, setMessageType, navigate); }} sx={{ mt: 2 }}>
            <TextField
                label="認証コード"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                    style: {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                    },
                }}
                InputLabelProps={{
                    style: { color: 'white' },
                }}
            />
            <p>メールに送信した認証コードを入力してください</p>
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2, width: '50%', mx: 'auto', display: 'block', height: 50, borderRadius: 3 }}>
                認証
            </Button>
            {/* 認証コードの再送信ボタン */}
            <Button onClick={() => handleResendVerificationCode(email, setMessage, setMessageType)} variant="contained" color="secondary" sx={{ mt: 2, width: '50%', mx: 'auto', display: 'block', height: 50, borderRadius: 3 }}>
                認証コードの再送信
            </Button>
        </Box>
    );

    const handleRequestPasswordReset = async (email, setMessage, setMessageType) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/request-password-reset`, {
                email,
            });
            setMessage(response.data.message);
            setMessageType('success');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setMessage(error.response.data.error);
            } else {
                setMessage('パスワードリセットリクエストに失敗しました');
            }
            setMessageType('error');
        }
    };


    const renderRequestPasswordReset = () => (
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleRequestPasswordReset(email, setMessage, setMessageType); }} sx={{ mt: 2 }}>
            <TextField
                label="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                    style: {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                    },
                }}
                InputLabelProps={{
                    style: { color: 'white' },
                }}
            />
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2, width: '50%', mx: 'auto', display: 'block', height: 50, borderRadius: 3 }}>
                送信
            </Button>
        </Box>
    );

    const renderResetPassword = () => (
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleResetPassword(token, newPassword, setMessage, setMessageType, navigate); }} sx={{ mt: 2 }}>
            <TextField
                label="新しいパスワード"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                    style: {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                    },
                }}
                InputLabelProps={{
                    style: { color: 'white' },
                }}
            />
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2, width: '50%', mx: 'auto', display: 'block', height: 50, borderRadius: 3 }}>
                パスワード再設定
            </Button>
        </Box>
    );

    const renderContent = () => {
        switch (location.pathname) {
            case '/auth/register':
                return renderRegister();
            case '/auth/login':
                return renderLogin();
            case '/auth/verify':
                return renderVerify();
            case '/auth/request-password-reset':
                return renderRequestPasswordReset();
            case '/auth/reset-password':
                return renderResetPassword();
            default:
                return <Typography>Page not found</Typography>;
        }
    };

    const getTitle = () => {
        switch (location.pathname) {
            case '/auth/register':
                return '新規登録';
            case '/auth/login':
                return 'ログイン';
            case '/auth/verify':
                return '認証コード入力';
            case '/auth/request-password-reset':
                return 'パスワード再設定メール送信';
            case '/auth/reset-password':
                return 'パスワード再設定';
            default:
                return '';
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 4, bgcolor: 'grey.800', color: 'white', borderRadius: 5, boxShadow: 10}}>
            <Typography variant="h5" component="h1" gutterBottom>
                {getTitle()}
            </Typography>
            {renderContent()}
            {message && (
                <Typography
                    color={messageType === 'error' ? 'error' : 'success'}
                    sx={{ mt: 2 }}
                >
                    {message}
                </Typography>
            )}
        </Paper>
    );
};

export default Auth;