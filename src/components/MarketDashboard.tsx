import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

// 1. Definimos la forma exacta de tus datos globales (basado en tu tabla de Supabase)
interface GlobalStats {
  id: number;
  total_taps: number;
  total_revenue_usd: number;
  current_token_price: number;
  listing_progress_points: number;
  listing_goal: number;
}

export const MarketDashboard = () => {
    // 2. Usamos la interfaz aquí en lugar de 'any'
    const [stats, setStats] = useState<GlobalStats | null>(null);
    
    useEffect(() => {
        const fetchStats = async () => {
            const { data } = await supabase
              .from('global_stats')
              .select('*')
              .single();
            
            if (data) {
              // Forzamos a TypeScript a entender que esto encaja con nuestra interfaz
              setStats(data as GlobalStats);
            }
        };
        
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Actualización en vivo cada 10s
        return () => clearInterval(interval);
    }, []);

    if (!stats) return <div className="glass-card">Loading Market Data...</div>;

    // Calculamos el porcentaje de progreso
    const progress = Math.min(100, (stats.listing_progress_points / stats.listing_goal) * 100);

    return (
        <div className="glass-card" style={{ borderColor: '#00F2FE' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#aaa', letterSpacing: '1px' }}>ESTIMATED $GNOVA PRICE</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50', textShadow: '0 0 10px rgba(76, 175, 80, 0.4)' }}>
                    {stats.current_token_price.toFixed(6)} TON
                </div>
            </div>
            
            <div style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{color: '#FFD700'}}>🚀 Launch Progress</span>
                <span>{progress.toFixed(4)}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: '#333', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #FF512F, #DD2476)' }} />
            </div>
        </div>
    );
};