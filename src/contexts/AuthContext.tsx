// src/contexts/AuthContext.tsx

import React, { useState, useEffect } from 'react'; 
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
// 🎯 IMPORTACIÓN CLAVE: Traemos el objeto AuthContext desde useAuth.ts
import { AuthContext } from '../hooks/useAuth'; 

// 1. Definir y EXPORTAR el tipo de datos (necesario para useAuth.ts)
export interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// 3. Crear el Proveedor (SÍ lo exportamos)
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 🎯 LÓGICA REQUERIDA AQUI 🎯
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Función para obtener la sesión y el usuario actual de Supabase
    const getSession = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getSession();

    // Suscribirse a los cambios de estado de autenticación (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  // 🎯 FIN DE LA LÓGICA REQUERIDA 🎯

  return (
    // Ahora AuthContext está definido y puede ser usado
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};