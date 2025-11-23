import { useState, useEffect} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { AuthContext } from '../hooks/useAuth'; 

// 👇 AQUÍ DEFINIMOS LA VARIABLE QUE TE FALTABA
const SUPABASE_URL_RAW = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY; // <--- ESTA ES LA DEFINICIÓN
const SUPABASE_URL = SUPABASE_URL_RAW.replace(/\/$/, ''); // Limpieza de URL

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            setLoading(true);
            
            const initData = window.Telegram?.WebApp?.initData;

            if (initData) {
                // Ahora sí podemos usar SUPABASE_ANON_KEY porque está definida arriba
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
                    console.error('❌ Fallo de autenticación en Edge Function:', data.error);
                }
            }
            
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