'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/services/auth.service';
import { toast } from 'react-hot-toast';

// Importamos la definición de User desde types/index.ts
import { User as UserType } from '@/types';

// Usamos el mismo tipo que ya está definido en la aplicación
type User = UserType;

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; user?: User; token?: string; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  updateUserData: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      setToken(storedToken);
      const cachedUser = localStorage.getItem('auth_user');
      if (storedToken && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (error) {
          console.error('Error parsing cached user:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; user?: User; token?: string; error?: string }> => {
    const result = await AuthService.login(credentials);
    if (result.success && result.user && result.token) {
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      toast.success(`Bienvenido ${result.user.nombre}`);
    } else if (result.error) {
      toast.error(result.error);
    }
    return result;
  };

  const logout = async () => {
    try {
      await AuthService.logout(); // Marca como inactivo en el backend
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      sessionStorage.clear();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const updateUserData = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}