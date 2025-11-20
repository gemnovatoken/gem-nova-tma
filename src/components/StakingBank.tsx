import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

// 1. 👇 AQUÍ ESTÁ LA SOLUCIÓN: Definimos la "forma" de un Staking
interface StakeData {
    id: string;
    user_id: string;
    amount: number;
    start_time: string;
    end_time: string;
    status: 'active' | 'completed' | 'claimed';
    estimated_profit: number;
}

export const StakingBank = () => {
        const { user } = useAuth();
    
    // 2. 👇 Usamos la interfaz aquí en lugar de <any[]>
    const [stakes, setStakes] = useState<StakeData[]>([]);
    const [loading, setLoading] = useState(false);
    const [amountToStake, setAmountToStake] = useState('');

    // Cargar los Stakings del usuario
    useEffect(() => {
        if (!user) return;

        const fetchStakes = async () => {
            const { data, error } = await supabase
                .from('stakes') // Asumiendo que tienes una tabla 'stakes'
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active');

            if (error) {
                console.error('Error fetching stakes:', error);
            } else if (data) {
                // 3. 👇 Le decimos a TS que confíe en que esto es un array de StakeData
                setStakes(data as StakeData[]);
            }
        };

        fetchStakes();
    }, [user]);

    const handleStake = async () => {
        if (!user || !amountToStake) return;
        setLoading(true);

        // Lógica simulada de Staking (aquí iría tu RPC de Supabase)
        // Por ahora solo para que compile sin errores:
        console.log(`Staking ${amountToStake} GNOVA...`);
        
        alert("Staking feature coming in Phase 2!");
        setLoading(false);
        setAmountToStake('');
    };

    return (
        <div className="glass-card">
            <h3>🔒 Vault Staking</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                    type="number" 
                    placeholder="Amount to lock"
                    value={amountToStake}
                    onChange={(e) => setAmountToStake(e.target.value)}
                    style={{ padding: '10px', borderRadius: '8px', border: 'none', width: '100%' }}
                />
                <button className="btn-neon" onClick={handleStake} disabled={loading}>
                    LOCK
                </button>
            </div>

            {/* Lista de Stakes Activos */}
            <div>
                {stakes.length === 0 ? (
                    <p style={{ color: '#777', fontSize: '12px' }}>No active stakes.</p>
                ) : (
                    stakes.map((stake) => (
                        <div key={stake.id} style={{ borderBottom: '1px solid #333', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                            <span>💎 {stake.amount}</span>
                            <span style={{ color: '#00F2FE' }}>Earn: +{stake.estimated_profit}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};