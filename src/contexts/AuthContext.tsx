import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { AuthContext } from '../hooks/useAuth'; 

const SUPABASE_URL_RAW = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY; 
const SUPABASE_URL = SUPABASE_URL_RAW.replace(/\/$/, ''); 

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            setLoading(true);
            
            const initData = window.Telegram?.WebApp?.initData;

            // 1. Intentar Login con Telegram
            if (initData) {
                try {
                    const response = await fetch(`${SUPABASE_URL}/functions/v1/tg-auth`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}` 
                        },
                        body: JSON.stringify({ initData })
                    });

                    const data = await response.json();

                    if (response.ok && data.token) {
                        const { data: sessionData } = await supabase.auth.setSession({
                            access_token: data.token,
                            refresh_token: data.refresh_token
                        });
                        
                        if (sessionData.user) setUser(sessionData.user);
                    } else {
                        console.error('Auth Error:', data.error);
                    }
                } catch (e) {
                    console.error('Network Error:', e);
                }
            }
            
            // 2. Fallback y Verificación Local
            // 👇 SOLUCIÓN: Quitamos el '&& !user' de la condición para eliminar la dependencia
            const { data: { user: existingUser } } = await supabase.auth.getUser();
            if (existingUser) {
                setUser(existingUser);
            }

            setLoading(false);
        };

        getSession();

        // Escuchar cambios en la sesión (Login/Logout)
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (session) setUser(session.user);
            else setUser(null);
          }
        );

        return () => {
          authListener.subscription.unsubscribe();
        };
        // 👇 El array de dependencias se queda vacío, y ahora es válido
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};