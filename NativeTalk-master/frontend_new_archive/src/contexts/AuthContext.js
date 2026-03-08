"use client";

import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext();

const initialState = {
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
};

function authReducer(state, action) {
    switch (action.type) {
        case 'AUTH_START':
            return { ...state, isLoading: true };
        case 'AUTH_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isLoading: false,
                isAuthenticated: true,
            };
        case 'AUTH_FAILURE':
            return {
                ...state,
                user: null,
                token: null,
                isLoading: false,
                isAuthenticated: false,
            };
        case 'LOGOUT':
            return {
                ...initialState,
                isLoading: false,
            };
        default:
            return state;
    }
}

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            dispatch({ type: 'AUTH_FAILURE' });
            return;
        }

        try {
            dispatch({ type: 'AUTH_START' });
            const response = await authApi.getMe();
            const user = response.user; // Extract user from response
            dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
        } catch (error) {
            localStorage.removeItem('token');
            dispatch({ type: 'AUTH_FAILURE' });
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = (user, token) => {
        localStorage.setItem('token', token);
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    };

    const logout = () => {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
    };

    const value = useMemo(() => ({
        ...state,
        login,
        logout,
        checkAuth
    }), [state]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
