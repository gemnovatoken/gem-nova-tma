import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

// Definimos la estructura del Contexto (EXPORTADA para que AuthContext.tsx la use)
export interface AuthContextType {
    user: User | null;
    loading: boolean;
}

// Creamos y exportamos el objeto Context (para que el Provider lo use)
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// El Hook que los componentes usarán
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        // Lanza error si alguien usa useAuth fuera de AuthProvider
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};