import React, { useState } from 'react';
import axios from 'axios';
import { Box, Button, TextField, Typography, Paper, Modal } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Post = ({ open, handleClose }) => {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const handlePost = async () => {
        if (!content) {
            setMessage(t('input_required'));
            setMessageType('error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${import.meta.env.VITE_APP_API_URL}/api/posts`, {
                content,
            }, {
                headers: {
                    'Authorization': token,
                },
            });

            setMessage(response.data.message);
            setMessageType('success');
            setContent('');
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setMessage(error.response.data.error);
            } else {
                setMessage(t('post_failed'));
            }
            setMessageType('error');
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 4, bgcolor: 'grey.800', color: 'white', borderRadius: 5, boxShadow: 10 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    {t('create_post')}
                </Typography>
                <Box component="form" onSubmit={(e) => { e.preventDefault(); handlePost(); }} sx={{ mt: 2 }}>
                    <TextField
                        label={t('content')}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        fullWidth
                        margin="normal"
                        multiline
                        rows={4}
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
                        {t('post')}
                    </Button>
                </Box>
                {message && (
                    <Typography color={messageType === 'error' ? 'error' : 'success'} sx={{ mt: 2 }}>
                        {message}
                    </Typography>
                )}
            </Paper>
        </Modal>
    );
};

export default Post;