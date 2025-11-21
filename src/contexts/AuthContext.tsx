import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { AuthContext } from '../hooks/useAuth'; // 1. Importamos el Contexto del nuevo archivo

// URL de tu proyecto Supabase (se lee desde el cliente)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            setLoading(true);
            
            // Lógica para Login Nativo de Telegram
            const initData = window.Telegram?.WebApp?.initData;

            if (initData) {
                const response = await fetch(`${SUPABASE_URL}/functions/v1/tg-auth`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ initData })
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    // Establece la sesión de Supabase
                    const { data: sessionData } = await supabase.auth.setSession({
                        access_token: data.token,
                        refresh_token: data.refresh_token
                    });
                    
                    if (sessionData.user) setUser(sessionData.user);

                } else {
                    console.error('❌ Fallo de autenticación en Edge Function:', data.error);
                }
            }
            
            // Fallback: Siempre verificar si ya hay una sesión guardada localmente
            const { data: { user: existingUser } } = await supabase.auth.getUser();
            if (existingUser) setUser(existingUser);

            setLoading(false);
        };

        getSession();

        // Suscripción a cambios de estado para manejar logout/refresh
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, session) => {
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

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};