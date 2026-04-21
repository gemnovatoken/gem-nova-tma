import React from 'react';

// Props temporales para la visualización. Luego las ataremos a Supabase.
interface PuzzleWidgetProps {
    onClick: () => void;
}

export const PuzzleWidget: React.FC<PuzzleWidgetProps> = ({ onClick }) => {
    // ⚠️ VALORES QUEMADOS (Hardcoded) solo para visualización. En el próximo paso los leeremos de DB.
    const piecesCollected = 4;
    const currentReward = 0.15;
    const timeLeft = "23h 45m";

    return (
        <div 
            onClick={onClick}
            style={{
                position: 'absolute', top: '15px', right: '15px',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(20,20,25,0.9) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.5)', 
                borderRadius: '12px', padding: '8px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: '0 0 15px rgba(255, 215, 0, 0.2)', 
                cursor: 'pointer', zIndex: 100,
                backdropFilter: 'blur(5px)',
                animation: 'pulse-dot 2s infinite' // Reutiliza tu animación
            }}
        >
            <span style={{ fontSize: '9px', color: '#FFD700', fontWeight: '900', letterSpacing: '1px', textShadow: '0 0 5px rgba(255,215,0,0.5)' }}>
                PUZZLE: UP TO 25 TON
            </span>
            
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff', margin: '4px 0' }}>
                {currentReward.toFixed(2)} <span style={{fontSize: '10px', color: '#aaa'}}>TON</span>
            </div>
            
            {/* Los puntitos de las piezas */}
            <div style={{ display: 'flex', gap: '3px', marginTop: '2px', marginBottom: '6px' }}>
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} style={{
                        width: '8px', height: '8px', borderRadius: '2px',
                        background: idx < piecesCollected ? '#FFD700' : 'rgba(255,255,255,0.1)',
                        boxShadow: idx < piecesCollected ? '0 0 5px #FFD700' : 'none'
                    }} />
                ))}
            </div>
            
            <div style={{ fontSize: '9px', color: '#FF9800', fontWeight: 'bold' }}>
                ⏳ {timeLeft}
            </div>
        </div>
    );
};