import React from 'react';
import { X, Clock, Diamond, Lock, Unlock, Zap, ShieldAlert } from 'lucide-react';

interface PuzzleModalProps {
    onClose: () => void;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({ onClose }) => {
    // ⚠️ DATOS SIMULADOS (MOCK) - Luego los leeremos de Supabase
    const currentReward = 0.15;
    const piecesCollected = 4;
    const totalPieces = 6;
    const isLocked = false; // Cambia esto a true para ver cómo se ve cuando se vence el tiempo
    const timeLeft = "23h 45m 12s";

    // El camino de premios (simulado para la interfaz)
    const upcomingRewards = [0.15, 0.20, 0.25, 0.30, 0.50, 1.0, 5.0, 25.0];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 5, 10, 0.95)', zIndex: 9500,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '20px', overflowY: 'auto', backdropFilter: 'blur(10px)'
        }}>
            
            {/* Header */}
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Diamond color="#FFD700" fill="#FFD700" size={20} />
                    <h2 style={{ color: '#FFD700', margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '1px' }}>GNOVA TREE</h2>
                </div>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            <div style={{ width: '100%', maxWidth: '400px', marginTop: '30px', textAlign: 'center' }}>
                
                {/* ⏳ TEMPORIZADOR DE URGENCIA */}
                <div style={{ 
                    background: isLocked ? 'rgba(255,0,0,0.1)' : 'rgba(255, 152, 0, 0.1)', 
                    border: isLocked ? '1px solid #FF0055' : '1px solid #FF9800', 
                    color: isLocked ? '#FF0055' : '#FF9800',
                    padding: '10px 20px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '10px',
                    fontWeight: '900', fontSize: '18px', marginBottom: '25px',
                    boxShadow: isLocked ? '0 0 15px rgba(255,0,85,0.3)' : '0 0 15px rgba(255,152,0,0.3)',
                    animation: isLocked ? 'none' : 'pulse-soft 2s infinite'
                }}>
                    {isLocked ? <ShieldAlert size={20} /> : <Clock size={20} />}
                    {isLocked ? 'PUZZLE EXPIRED' : `EXPIRES IN: ${timeLeft}`}
                </div>

                {/* 🧩 EL ROMPECABEZAS (GRID) */}
                <div style={{ 
                    background: 'rgba(20,20,25,0.8)', border: '1px solid #333', borderRadius: '20px', 
                    padding: '30px 20px', position: 'relative', overflow: 'hidden'
                }}>
                    {/* Efecto de luz de fondo */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '150px', height: '150px', background: '#FFD700', filter: 'blur(80px)', opacity: 0.1, zIndex: 0 }}></div>
                    
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#aaa', zIndex: 1, position: 'relative' }}>CURRENT TARGET</h3>                    <div style={{ fontSize: '42px', fontWeight: '900', color: '#fff', textShadow: '0 0 15px rgba(255,215,0,0.5)', zIndex: 1, position: 'relative', marginBottom: '20px' }}>
                        {currentReward.toFixed(2)} <span style={{ fontSize: '20px', color: '#FFD700' }}>TON</span>
                    </div>

                    <div style={{ 
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', 
                        maxWidth: '250px', margin: '0 auto', zIndex: 1, position: 'relative' 
                    }}>
                        {[...Array(totalPieces)].map((_, i) => {
                            const isCollected = i < piecesCollected;
                            return (
                                <div key={i} style={{
                                    aspectRatio: '1', borderRadius: '12px',
                                    background: isCollected ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'rgba(255,255,255,0.05)',
                                    border: isCollected ? 'none' : '1px dashed #444',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    boxShadow: isCollected ? '0 5px 15px rgba(255,215,0,0.4)' : 'inset 0 0 10px rgba(0,0,0,0.5)',
                                    transform: isCollected ? 'scale(1)' : 'scale(0.95)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {isCollected ? <Diamond size={24} color="#FFF" /> : <Lock size={20} color="#333" />}
                                </div>
                            );
                        })}
                    </div>
                    
                    <div style={{ marginTop: '20px', color: '#00F2FE', fontWeight: 'bold', fontSize: '14px', zIndex: 1, position: 'relative' }}>
                        {piecesCollected} / {totalPieces} PIECES COLLECTED
                    </div>
                </div>

                {/* ⚠️ ÁREA DE ACCIÓN (Restaurar o Seguir Girando) */}
                <div style={{ marginTop: '30px' }}>
                    {isLocked ? (
                        <div style={{ background: 'rgba(255,0,85,0.1)', border: '1px solid #FF0055', borderRadius: '15px', padding: '15px' }}>
                            <p style={{ color: '#fff', fontSize: '13px', marginBottom: '15px', marginTop: 0 }}>Your puzzle time expired. You can restore your progress or it will reset to 0 tomorrow.</p>
                            <button style={{ width: '100%', padding: '15px', background: 'linear-gradient(90deg, #FF0055, #FF4400)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 5px 15px rgba(255,0,85,0.4)' }}>
                                <Unlock size={18} /> PAY 0.10 TON TO RESTORE
                            </button>
                        </div>
                    ) : (
                        <button onClick={onClose} style={{ width: '100%', padding: '15px', background: 'linear-gradient(90deg, #0088CC, #00F2FE)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 5px 15px rgba(0,242,254,0.4)' }}>
                            <Zap size={18} /> KEEP SPINNING
                        </button>
                    )}
                </div>

                {/* 🛣️ EL CAMINO DEL ÁRBOL (Roadmap inferior) */}
                <div style={{ marginTop: '40px', width: '100%', textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', color: '#aaa', fontWeight: 'bold', marginBottom: '15px', letterSpacing: '1px' }}>NEXT TARGETS</div>
                    <div className="no-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                        {upcomingRewards.map((reward, i) => {
                            const isCurrent = reward === currentReward;
                            const isPassed = reward < currentReward;
                            
                            return (
                                <div key={i} style={{
                                    minWidth: '80px', padding: '10px', borderRadius: '12px', flexShrink: 0,
                                    background: isCurrent ? 'rgba(255,215,0,0.1)' : (isPassed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.05)'),
                                    border: isCurrent ? '1px solid #FFD700' : (isPassed ? '1px solid #4CAF50' : '1px solid #333'),
                                    textAlign: 'center', opacity: isPassed ? 0.5 : 1
                                }}>
                                    <div style={{ fontSize: '14px', fontWeight: '900', color: isCurrent ? '#FFD700' : (isPassed ? '#4CAF50' : '#fff') }}>
                                        {reward}
                                    </div>
                                    <div style={{ fontSize: '9px', color: '#888' }}>TON</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
            
            <style>{`
                @keyframes pulse-soft { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};