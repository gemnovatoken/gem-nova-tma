import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface GlobalStats {
  id: number;
  total_taps: number;
  total_revenue_usd: number;
  current_token_price: number;
  listing_progress_points: number;
  listing_goal: number;
}

export const MarketDashboard = () => {
    const [stats, setStats] = useState<GlobalStats | null>(null);
    
    useEffect(() => {
        const fetchStats = async () => {
            const { data } = await supabase.from('global_stats').select('*').single();
            if (data) setStats(data as GlobalStats);
        };
        
        fetchStats();
        const interval = setInterval(fetchStats, 10000); 
        return () => clearInterval(interval);
    }, []);

    if (!stats) return <div className="glass-card" style={{textAlign:'center', padding:'10px', fontSize:'12px'}}>Loading System...</div>;

    const progress = stats.listing_goal > 0 
        ? Math.min(100, (stats.listing_progress_points / stats.listing_goal) * 100) 
        : 0;

    return (
        <div className="glass-card" style={{ borderColor: '#00F2FE', padding: '15px', marginBottom:'10px' }}>
            
            {/* Título y Porcentaje */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{display:'flex', flexDirection:'column'}}>
                    <span style={{color: '#fff', fontWeight:'900', fontSize:'14px'}}>LAUNCH PROGRESS</span>
                    <span style={{color: '#00F2FE', fontSize:'10px'}}>Community Driven TGE</span>
                </div>
                <span style={{fontSize:'20px', fontWeight:'bold', color:'#FFD700'}}>{progress.toFixed(4)}%</span>
            </div>

            {/* Barra de Progreso */}
            <div style={{ width: '100%', height: '12px', background: '#111', borderRadius: '6px', overflow: 'hidden', border:'1px solid #333', marginBottom:'8px' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #00F2FE, #E040FB, #FFD700)', boxShadow:'0 0 10px rgba(224, 64, 251, 0.5)' }} />
            </div>

            {/* La Fórmula Matemática Visual */}
            <div style={{ 
                background:'rgba(0,0,0,0.3)', borderRadius:'6px', padding:'6px', 
                fontSize:'9px', color:'#aaa', textAlign:'center', fontFamily:'monospace',
                border: '1px dashed #333', display:'flex', justifyContent:'center', alignItems:'center', flexWrap:'wrap', gap:'4px'
            }}>
                <span style={{color:'#4CAF50'}}>Ads</span> + 
                <span style={{color:'#4CAF50'}}>Upgrades</span> + 
                <span style={{color:'#00F2FE'}}>BulkBuy</span> + 
                <span style={{color:'#E040FB'}}>Refs</span> + 
                <span style={{color:'#FF512F'}}>Burn</span> 
                <span style={{color:'#fff', fontWeight:'bold'}}> = 🚀 LAUNCH</span>
            </div>

        </div>
    );
};