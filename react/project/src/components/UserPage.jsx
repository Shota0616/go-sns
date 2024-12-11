// src/components/MyPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Container, Paper, Typography, Box, CircularProgress, Avatar, Card, CardContent, List, ListItem, IconButton, Button, CardActionArea, CardMedia, CardActions, Link } from '@mui/material';
import { Comment, Favorite, Share, Edit, AccountCircle, Add, Message } from '@mui/icons-material';
import { useUser } from '/src/context/UserContext';
import '@fontsource/roboto';

const MyPage = () => {
    const { t } = useTranslation();
    const { user, setUser } = useUser();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);

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
                localStorage.removeItem('token');
                window.dispatchEvent(new Event("storage"));
                navigate('/auth/login');
            }
        };

        checkAuth();
    }, [navigate, setUser]);

    const fetchPosts = useCallback(async () => {
        if (!user || loading || !hasMore) return;
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/api/user/${user.id}/posts`, {
                params: { page },
            });
            setPosts(prevPosts => [...prevPosts, ...response.data.posts]);
            setHasMore(response.data.posts.length === 10);
            setPage(prevPage => prevPage + 1);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user, page, loading, hasMore]);

    const fetchFollowers = useCallback(async () => {
        if (!user) return;
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/api/user/${user.id}/followers`);
            setFollowers(response.data.followers);
        } catch (error) {
            console.error(error);
        }
    }, [user]);

    const fetchFollowing = useCallback(async () => {
        if (!user) return;
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/api/user/${user.id}/following`);
            setFollowing(response.data.following);
        } catch (error) {
            console.error(error);
        }
    }, [user]);

    useEffect(() => {
        fetchPosts();
        fetchFollowers();
        fetchFollowing();
    }, [fetchPosts, fetchFollowers, fetchFollowing]);

    const handleScroll = useCallback(() => {
        if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight) return;
        fetchPosts();
    }, [fetchPosts]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Card sx={{ p: 4, borderRadius: 5, bgcolor: 'grey.800', color: 'white', boxShadow: 10, position: 'relative' }}>
                {user && (
                    <Box sx={{ textAlign: 'center' }}>
                        <Avatar
                            src={user.profile_image_url ? `${import.meta.env.VITE_APP_MEDIA_URL}/${user.profile_image_url}` : null}
                            alt="Profile Image"
                            sx={{ width: 80, height: 80, mx: 'auto' }}
                        >
                            {!user.profile_image_url && <AccountCircle sx={{ width: 80, height: 80, color: 'white' }} />}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>{user.username}</Typography>
                            <Typography variant="body1" sx={{ mt: 2 }}>{user.bio}</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <Box sx={{ textAlign: 'center', mx: 2 }}>
                                    <Link
                                        href="#"
                                        onClick={() => navigate(`/followers/${user.id}`)}
                                        color="inherit"
                                        sx={{
                                            textDecoration: 'none',
                                            '&:hover': {
                                                textDecoration: 'underline',
                                            },
                                        }}
                                    >
                                        <Typography variant="body2">フォロワー</Typography>
                                        <Typography variant="h6">{followers.length}</Typography>
                                    </Link>
                                </Box>
                                <Box sx={{ textAlign: 'center', mx: 2 }}>
                                    <Link
                                        href="#"
                                        onClick={() => navigate(`/following/${user.id}`)}
                                        color="inherit"
                                        sx={{
                                            textDecoration: 'none',
                                            '&:hover': {
                                                textDecoration: 'underline',
                                            },
                                        }}
                                    >
                                        <Typography variant="body2">フォロー中</Typography>
                                        <Typography variant="h6">{following.length}</Typography>
                                    </Link>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <Button variant="contained" color="primary" sx={{ borderRadius: '20px', height: '36px', width: '130px', mx: 1 }} startIcon={<Add />}>
                                    フォロー
                                </Button>
                                <Button
                                    variant="outlined"
                                    sx={{
                                        borderRadius: '20px',
                                        height: '36px',
                                        width: '130px',
                                        color: 'white',
                                        borderColor: 'white',
                                        mx: 1,
                                        '&:hover': {
                                            borderColor: '#242424',
                                        },
                                    }}
                                    startIcon={<Message />}
                                >
                                    メッセージ
                                </Button>
                            </Box>
                        </Box>
                        <IconButton color="#242424" sx={{ position: 'absolute', top: 12, right: 12 }}>
                            <Edit />
                        </IconButton>
                    </Box>
                )}
            </Card>

            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                    {t('posts')}
                </Typography>
                <List>
                    {posts.map(post => (
                        <ListItem key={post.ID}>
                            <Card sx={{ width: '100%', mb: 2, bgcolor: 'grey.800', color: 'white', borderRadius: 3, boxShadow: 5 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar
                                                src={post.User.ProfileImageURL ? `${import.meta.env.VITE_APP_MEDIA_URL}/${post.User.ProfileImageURL}` : null}
                                                alt="User Image"
                                                sx={{ mr: 2 }}
                                            >
                                                {!post.User.ProfileImageURL && <AccountCircle sx={{ color: 'white' }} />}
                                            </Avatar>
                                            <Typography variant="body1" component="p" sx={{ fontWeight: 'bold', mr: 1 }}>
                                                {post.User.Username}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" color="textSecondary" sx={{ color: 'white', textAlign: 'right', mr: 1 }}>
                                                {new Date(post.CreatedAt).toLocaleDateString()}
                                            </Typography>
                                            {user.id === post.UserID && (
                                                <IconButton aria-label="edit" sx={{ color: 'white', p: 0.5 }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Box>
                                    <Typography variant="body1" component="p" sx={{ mb: 2 }}>
                                        {post.Content}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <IconButton aria-label="comment" sx={{ color: 'white', p: 0.5 }}>
                                            <Comment fontSize="small" />
                                        </IconButton>
                                        <IconButton aria-label="like" sx={{ color: 'white', p: 0.5 }}>
                                            <Favorite fontSize="small" />
                                        </IconButton>
                                        <IconButton aria-label="share" sx={{ color: 'white', p: 0.5 }}>
                                            <Share fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        </ListItem>
                    ))}
                </List>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                        <CircularProgress />
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default MyPage;
