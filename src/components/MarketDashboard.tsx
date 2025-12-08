import React from 'react';
import { Rocket, Users, Globe, Lock } from 'lucide-react';

// Interfaz para los datos
interface MarketProps {
    globalProgress: number; 
}

export const MarketDashboard: React.FC<MarketProps> = ({ globalProgress = 0 }) => {
    return (
        <div className="glass-card" style={{ 
            padding: '15px', borderRadius: '20px', marginBottom: '20px',
            background: 'linear-gradient(180deg, rgba(15,15,20,0.98) 0%, rgba(5,5,10,1) 100%)',
            border: '1px solid rgba(255, 215, 0, 0.1)', 
            boxShadow: '0 0 20px rgba(0,0,0,0.8)'
        }}>
            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Usamos Globe aquí */}
                    <Globe color="#FFD700" size={16} className="spin-slow" />
                    <div style={{ display:'flex', flexDirection:'column' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#fff', letterSpacing: '1px' }}>
                            GLOBAL LAUNCH
                        </span>
                        <span style={{ fontSize: '8px', color: '#666' }}>COMMUNITY GOAL</span>
                    </div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#FFD700', fontFamily:'monospace' }}>
                    {globalProgress.toFixed(6)}%
                </span>
            </div>

            {/* Barra de Progreso */}
            <div style={{ 
                height: '14px', width: '100%', background: '#0a0a0a', borderRadius: '8px', 
                overflow: 'hidden', position: 'relative', border: '1px solid #333'
            }}>
                <div style={{ 
                    width: `${Math.max(globalProgress, 1)}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #FFD700, #FDB931)',
                    borderRadius: '8px',
                    transition: 'width 0.5s ease-in-out'
                }} />
                
                {/* Usamos Lock aquí (Candado visual) */}
                <div style={{ position: 'absolute', right:'5px', top:0, height:'100%', display:'flex', alignItems:'center' }}>
                    <Lock size={8} color="#666" />
                </div>
            </div>

            {/* Pie de página con estadísticas visuales */}
            <div style={{ marginTop: '12px', display:'flex', justifyContent:'space-around', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    {/* Usamos Users aquí */}
                    <Users size={12} color="#4CAF50" />
                    <span style={{ fontSize:'9px', color:'#888' }}>Driven by Players</span>
                </div>
                <div style={{ width:'1px', height:'10px', background:'#333' }}></div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    {/* Usamos Rocket aquí */}
                    <Rocket size={12} color="#FF512F" />
                    <span style={{ fontSize:'9px', color:'#888' }}>Listing Soon</span>
                </div>
            </div>

            <style>{`.spin-slow { animation: spin 10s linear infinite; }`}</style>
        </div>
    );
};