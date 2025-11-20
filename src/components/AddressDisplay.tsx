// src/components/AddressDisplay.tsx

import React, { useEffect } from 'react'; // ⬅️ Necesitas importar 'useEffect'
import { useTonAddress } from '@tonconnect/ui-react'; 
import { useAuth } from '../hooks/useAuth';           // ⬅️ Necesitas importar 'useAuth'
import { supabase } from '../services/supabase';       // ⬅️ Necesitas importar 'supabase'

export const AddressDisplay: React.FC = () => {
    // 1. Declaración de Hooks
    const userFriendlyAddress = useTonAddress(); 
    const { user } = useAuth(); // Obtiene el usuario de Supabase
    
    // 2. 🎯 COLOCAR EL useEffect AQUÍ (Opción B) 🎯
    useEffect(() => {
        // Solo guardar si el usuario de Supabase y la dirección TON están disponibles
        if (user && userFriendlyAddress && userFriendlyAddress !== '...cargando...') {
            const saveTonAddress = async () => {
                console.log(`Guardando dirección TON: ${userFriendlyAddress}`);

                // Realiza la operación UPDATE en la tabla user_score
                const { error } = await supabase
                    .from('user_score')
                    .update({ ton_address: userFriendlyAddress })
                    .eq('user_id', user.id); // Clave RLS: solo actualiza la fila propia

                if (error) console.error('Error al guardar la dirección TON:', error);
                else console.log('✅ Dirección TON guardada exitosamente.');
            };

            saveTonAddress();
        }
    }, [user, userFriendlyAddress]); // Dependencias: se ejecuta cuando estos valores cambian

    // 3. Renderizado (el resto del componente)
    if (!userFriendlyAddress) return <p>Conecta tu billetera TON.</p>;

    const shortAddress = userFriendlyAddress.substring(0, 8) + '...' + userFriendlyAddress.substring(userFriendlyAddress.length - 4);
    return (
        <div>
            <p>Dirección TON Conectada: **{shortAddress}**</p>
        </div>
    );
};