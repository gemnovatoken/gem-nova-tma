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
            
            // 1. Intentar obtener datos reales
            let initData = window.Telegram?.WebApp?.initData;

            // 🚨 MODO DE RESCATE: Si no hay datos (Navegador/Error), usamos datos falsos para que puedas jugar
            if (!initData) {
                console.log("⚠️ Usando Datos de Prueba (Mock Mode)");
                // Este string simula un usuario válido para que el servidor no de error 400
                // User ID: 999999
                initData = "query_id=AA...&user=%7B%22id%22%3A999999%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22test_user%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1710000000&hash=fake_hash";
            }

            if (initData) {
                try {
                    const response = await fetch(`${SUPABASE_URL}/functions/v1/tg-auth`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}` 
                        },
                        body: JSON.stringify({ initData: initData }) 
                    });

                    const data = await response.json();

                    if (response.ok && data.token) {
                        // Login exitoso
                        const { data: sessionData } = await supabase.auth.setSession({
                            access_token: data.token,
                            refresh_token: data.refresh_token
                        });
                        
                        if (sessionData.user) setUser(sessionData.user);
                    } else {
                        console.error('Error Auth:', data);
                        // Si falla el auth automático, intentamos recuperar sesión local
                    }
                } catch (e) {
                    console.error('Error Red:', e);
                }
            }
            
            // Verificar sesión existente como respaldo
            const { data: { user: existingUser } } = await supabase.auth.getUser();
            if (existingUser) setUser(existingUser);

            setLoading(false);
        };

        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (session) setUser(session.user);
            else setUser(null);
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