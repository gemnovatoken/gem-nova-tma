// src/contexts/AuthContext.tsx (Versión Final con Limpieza de URL)

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { AuthContext } from '../hooks/useAuth'; 

// URL base de tu proyecto Supabase (con potencial barra al final)
const SUPABASE_URL_RAW = import.meta.env.VITE_SUPABASE_URL;
// 👇 CORRECCIÓN CRÍTICA: Eliminar la barra diagonal al final si existe
const SUPABASE_URL = SUPABASE_URL_RAW.replace(/\/$/, '');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            setLoading(true);
            
            const initData = window.Telegram?.WebApp?.initData;

            if (initData) {
                // 🛑 AHORA LA URL ES PERFECTA (sin doble barra)
                const response = await fetch(`${SUPABASE_URL}/functions/v1/tg-auth`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ initData })
                });

                const data = await response.json();
                // ... (resto de la lógica de setSession y error handling)
                
                if (response.ok && data.token) {
                    const { data: sessionData } = await supabase.auth.setSession({
                        access_token: data.token,
                        refresh_token: data.refresh_token
                    });
                    if (sessionData.user) setUser(sessionData.user);

                } else {
                    console.error('❌ Fallo de autenticación en Edge Function:', data.error);
                }
            }
            
            // ... (resto del código de Fallback y Listener) ...
            const { data: { user: existingUser } } = await supabase.auth.getUser();
            if (existingUser) setUser(existingUser);
            setLoading(false);
        };

        getSession();

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

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};