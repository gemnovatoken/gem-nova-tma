import React from 'react';
import { Rocket } from 'lucide-react';

interface MarketProps {
    globalProgress: number; 
}

export const MarketDashboard: React.FC<MarketProps> = ({ globalProgress = 0 }) => {
    return (
        <div className="glass-card" style={{ 
            padding: '15px', borderRadius: '20px', marginBottom: '20px',
            background: 'linear-gradient(180deg, rgba(20,20,30,0.95) 0%, rgba(5,5,10,1) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
            {/* 🌈 LA BARRA DE FÓRMULA (El diseño que querías) */}
            <div style={{ 
                background: 'linear-gradient(90deg, #00F2FE 0%, #4CAF50 25%, #E040FB 50%, #FFD700 100%)',
                borderRadius: '8px',
                padding: '6px 10px',
                marginBottom: '15px',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
                <span style={{ 
                    fontSize: '10px', fontWeight: '900', color: '#000', 
                    letterSpacing: '0.5px', textTransform: 'uppercase'
                }}>
                    Ads + Upgrades + BulkBuy = 🚀 LAUNCH
                </span>
            </div>

            {/* Título y Porcentaje */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Rocket color="#FFD700" size={18} />
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', letterSpacing: '1px' }}>
                        COMMUNITY GOAL
                    </span>
                </div>
                {/* 6 Decimales para ver el progreso real de las compras */}
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#00F2FE', fontFamily: 'monospace' }}>
                    {globalProgress.toFixed(6)}%
                </span>
            </div>

            {/* Barra de Progreso (Estilo Arcoíris Animado) */}
            <div style={{ 
                height: '14px', width: '100%', background: '#222', borderRadius: '7px', 
                overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)' 
            }}>
                <div style={{ 
                    width: `${Math.max(globalProgress, 1)}%`, // Mínimo 1% para que se vea
                    height: '100%', 
                    // El degradado clásico vibrante
                    background: 'linear-gradient(90deg, #FFD700, #FF512F, #E040FB, #00F2FE)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s linear infinite',
                    borderRadius: '7px',
                    transition: 'width 0.5s ease-out'
                }} />
                
                {/* Brillo */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shine 2s infinite'
                }}/>
            </div>

            <style>{`
                @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
                @keyframes shine { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            `}</style>
        </div>
    );
};