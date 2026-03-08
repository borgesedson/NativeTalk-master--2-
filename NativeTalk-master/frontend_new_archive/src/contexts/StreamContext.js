"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { useAuth } from './AuthContext';
import { authApi } from '../lib/api';

const StreamContext = createContext();

export const StreamProvider = ({ children }) => {
    const { user } = useAuth();
    const [client, setClient] = useState(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!user) return;

        const initStream = async () => {
            try {
                const chatClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY);

                // Obter token do backend
                const { token } = await authApi.getStreamToken();

                await chatClient.connectUser(
                    {
                        id: user._id || user.id,
                        name: user.fullName || user.name,
                        image: user.profilePic || user.avatar || user.image,
                        native_language: user.nativeLanguage,
                    },
                    token
                );

                setClient(chatClient);
                setIsReady(true);
            } catch (error) {
                console.error('Error connecting to Stream:', error);

                // Handle deleted user error (code 16 or message includes "deleted")
                if (error.message?.includes('deleted') || error.code === 16) {
                    console.log('⚠️ [StreamContext] User deleted remotely. Triggering Logout...');
                    console.log('⚠️ [StreamContext] Error details:', JSON.stringify(error));
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
            }
        };

        initStream();

        return () => {
            if (client) {
                client.disconnectUser();
            }
        };
    }, [user]);

    return (
        <StreamContext.Provider value={{ client, isReady }}>
            {children}
        </StreamContext.Provider>
    );
};

export const useStream = () => useContext(StreamContext);
