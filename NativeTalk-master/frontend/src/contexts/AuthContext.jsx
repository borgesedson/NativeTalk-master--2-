import React, { createContext, useContext, useReducer, useEffect } from "react";
import { getCurrentUser, logout as apiLogout } from '../lib/api';
import { insforge } from '../lib/insforge';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  lastCheck: null
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
        lastCheck: Date.now()
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        lastCheck: Date.now()
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
        lastCheck: Date.now()
      };

    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar autenticação apenas uma vez na inicialização
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      dispatch({ type: 'AUTH_START' });

      const user = await getCurrentUser();

      if (!user) {
        dispatch({ type: 'AUTH_FAILURE' });
        return;
      }

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token: null }
      });

    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      dispatch({ type: 'AUTH_FAILURE' });
    }
  };

  const login = (user, token) => {
    dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.error('Logout error', e);
    }
    dispatch({ type: 'LOGOUT' });
  };

  // Evitar re-renders desnecessários
  const value = React.useMemo(() => ({
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
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};