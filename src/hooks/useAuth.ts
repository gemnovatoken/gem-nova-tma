// src/hooks/useAuth.ts
import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

// 1. Definición de la estructura
export interface AuthContextType {
    user: User | null;
    loading: boolean;
}

// 2. Creamos el Contexto aquí
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Hook para usarlo
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};