import React from 'react';
import { X, Clock, Diamond, Lock, Zap, ShieldAlert, CheckCircle2, ExternalLink, Star } from 'lucide-react';

interface PuzzleModalProps {
    onClose: () => void;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({ onClose }) => {
    // ⚠️ DATOS SIMULADOS (MOCK) - Luego los leeremos de Supabase
    const currentReward = 0.15;
    const piecesCollected = 4;
    const totalPieces = 6;
    const isLocked = false; 
    const timeLeft = "23h 45m 12s";

    const upcomingRewards = [0.15, 0.20, 0.25, 0.30, 0.50, 1.0, 5.0, 25.0];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 5, 10, 0.95)', zIndex: 9500,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '20px', overflowY: 'auto', backdropFilter: 'blur(10px)'
        }}>
            
            {/* HEADER */}
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Diamond color="#FFD700" fill="#FFD700" size={20} />
                    <h2 style={{ color: '#FFD700', margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '1px' }}>GNOVA TREE</h2>
                </div>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <X size={20} />
                </button>
            </div>

            <div style={{ width: '100%', maxWidth: '400px', marginTop: '30px', textAlign: 'center' }}>
                
                {/* ⏳ TEMPORIZADOR DE URGENCIA */}
                <div style={{ 
                    background: isLocked ? 'rgba(255,0,0,0.1)' : 'linear-gradient(90deg, rgba(255,152,0,0.1), rgba(255,0,85,0.1))', 
                    border: isLocked ? '1px solid #FF0055' : '1px solid rgba(255,152,0,0.5)', 
                    color: isLocked ? '#FF0055' : '#FFD700',
                    padding: '10px 20px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '10px',
                    fontWeight: '900', fontSize: '16px', marginBottom: '25px',
                    boxShadow: isLocked ? '0 0 15px rgba(255,0,85,0.3)' : '0 0 20px rgba(255,152,0,0.2)',
                    animation: isLocked ? 'none' : 'pulse-soft 2s infinite'
                }}>
                    {isLocked ? <ShieldAlert size={20} /> : <Clock size={20} />}
                    {isLocked ? 'PUZZLE EXPIRED' : `EXPIRES IN: ${timeLeft}`}
                </div>

                {/* 🧩 EL GNOVA VAULT (ROMPECABEZAS MONETIZADO) */}
                <div style={{ 
                    background: 'linear-gradient(180deg, rgba(20,20,25,0.95) 0%, rgba(10,10,15,0.95) 100%)', 
                    border: '1px solid #333', borderRadius: '24px', 
                    padding: '30px 20px', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.05)'
                }}>
                    
                    {/* 🔥 ESPACIO DE MONETIZACIÓN (BANNER DE PATROCINADOR) 🔥 */}
                    <div style={{
                        position: 'absolute', top: 0, right: 0, 
                        background: 'linear-gradient(90deg, #0088CC, #00F2FE)', 
                        padding: '6px 15px', borderBottomLeftRadius: '20px', 
                        display: 'flex', alignItems: 'center', gap: '5px',
                        cursor: 'pointer', zIndex: 10
                    }}>
                        <Star size={12} color="#000" fill="#000" />
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#000', letterSpacing: '0.5px' }}>AD SPACE</span>
                        <ExternalLink size={12} color="#000" />
                    </div>

                    {/* Efecto de luz de fondo y Marca de Agua */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', background: '#FFD700', filter: 'blur(100px)', opacity: 0.1, zIndex: 0 }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, zIndex: 0, pointerEvents: 'none' }}>
                        <Diamond size={180} />
                    </div>
                    
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#aaa', zIndex: 1, position: 'relative', textTransform: 'uppercase', letterSpacing: '2px' }}>Reward Vault</h3>
                    <div style={{ fontSize: '48px', fontWeight: '900', color: '#fff', textShadow: '0 5px 15px rgba(255,215,0,0.4)', zIndex: 1, position: 'relative', marginBottom: '25px' }}>
                        {currentReward.toFixed(2)} <span style={{ fontSize: '20px', color: '#FFD700', verticalAlign: 'middle' }}>TON</span>
                    </div>

                    <div style={{ 
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', 
                        maxWidth: '260px', margin: '0 auto', zIndex: 1, position: 'relative' 
                    }}>
                        {[...Array(totalPieces)].map((_, i) => {
                            const isCollected = i < piecesCollected;
                            return (
                                <div key={i} style={{
                                    aspectRatio: '1', borderRadius: '16px',
                                    background: isCollected ? 'linear-gradient(135deg, rgba(255,215,0,0.9) 0%, rgba(255,165,0,0.9) 100%)' : 'rgba(0,0,0,0.6)',
                                    border: isCollected ? '1px solid #FFF' : '1px solid #333',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    boxShadow: isCollected ? '0 5px 20px rgba(255,215,0,0.5), inset 0 0 10px rgba(255,255,255,0.5)' : 'inset 0 5px 15px rgba(0,0,0,0.8)',
                                    transform: isCollected ? 'scale(1)' : 'scale(0.95)',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}>
                                    {isCollected ? <Diamond size={28} color="#FFF" /> : <Lock size={20} color="#444" />}
                                </div>
                            );
                        })}
                    </div>
                    
                    <div style={{ marginTop: '25px', display: 'inline-block', background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.3)', padding: '5px 15px', borderRadius: '20px', color: '#00F2FE', fontWeight: '900', fontSize: '12px', zIndex: 1, position: 'relative', letterSpacing: '1px' }}>
                        {piecesCollected} / {totalPieces} SHARDS
                    </div>
                </div>

                {/* ⚠️ ÁREA DE ACCIÓN */}
                <div style={{ marginTop: '25px' }}>
                    {isLocked ? (
                        <div style={{ background: 'rgba(255,0,85,0.1)', border: '1px solid #FF0055', borderRadius: '15px', padding: '15px' }}>
                            <p style={{ color: '#fff', fontSize: '13px', marginBottom: '15px', marginTop: 0 }}>Your puzzle time expired. You can restore your progress or it will reset to 0 tomorrow.</p>
                            <button style={{ width: '100%', padding: '15px', background: 'linear-gradient(90deg, #FF0055, #FF4400)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 5px 15px rgba(255,0,85,0.4)' }}>
                                <Lock size={18} /> PAY 0.10 TON TO RESTORE
                            </button>
                        </div>
                    ) : (
                        <button onClick={onClose} style={{ width: '100%', padding: '16px', background: 'linear-gradient(90deg, #0088CC, #00F2FE)', color: '#000', border: 'none', borderRadius: '14px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 5px 20px rgba(0,242,254,0.4)' }}>
                            <Zap size={20} fill="#000" /> KEEP SPINNING
                        </button>
                    )}
                </div>

                {/* 🛣️ EL ROADMAP TIPO RPG (BATTLE PASS) */}
                <div style={{ marginTop: '50px', width: '100%', textAlign: 'left', background: 'rgba(20,20,25,0.5)', padding: '20px', borderRadius: '20px', border: '1px solid #222' }}>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: '900', marginBottom: '25px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldAlert size={16} color="#FFD700" /> GNOVA MASTERY PATH
                    </div>
                    
                    <div className="no-scrollbar" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '30px', overflowX: 'auto', padding: '10px 0 20px 0' }}>
                        
                        {/* La línea conectora trasera */}
                        <div style={{ position: 'absolute', top: '25px', left: '20px', right: '20px', height: '4px', background: '#222', zIndex: 0 }} />
                        
                        {/* La línea conectora iluminada (Progreso) */}
                        <div style={{ 
                            position: 'absolute', top: '25px', left: '20px', 
                            width: `${(upcomingRewards.indexOf(currentReward) / (upcomingRewards.length - 1)) * 100}%`, 
                            height: '4px', background: 'linear-gradient(90deg, #4CAF50, #FFD700)', 
                            boxShadow: '0 0 10px #FFD700', zIndex: 0 
                        }} />

                        {upcomingRewards.map((reward, i) => {
                            const isCurrent = reward === currentReward;
                            const isPassed = reward < currentReward;
                            
                            return (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
                                    
                                    {/* Nodo (Círculo) */}
                                    <div style={{ 
                                        width: isCurrent ? '50px' : '40px', 
                                        height: isCurrent ? '50px' : '40px', 
                                        borderRadius: '50%', 
                                        background: isPassed ? '#4CAF50' : (isCurrent ? '#111' : '#1a1a1a'), 
                                        border: isCurrent ? '3px solid #FFD700' : (isPassed ? 'none' : '2px solid #333'), 
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', 
                                        boxShadow: isCurrent ? '0 0 20px rgba(255,215,0,0.6)' : (isPassed ? '0 0 10px rgba(76,175,80,0.5)' : 'none'),
                                        transition: 'all 0.3s ease'
                                    }}>
                                        {isPassed ? <CheckCircle2 size={24} color="#000" /> : (isCurrent ? <Diamond size={24} color="#FFD700" /> : <Lock size={16} color="#555" />)}
                                    </div>
                                    
                                    {/* Etiqueta de Precio */}
                                    <div style={{ 
                                        marginTop: '12px', fontSize: isCurrent ? '14px' : '11px', 
                                        fontWeight: '900', color: isCurrent ? '#FFD700' : (isPassed ? '#4CAF50' : '#888'),
                                        textShadow: isCurrent ? '0 0 10px rgba(255,215,0,0.5)' : 'none'
                                    }}>
                                        {reward} <span style={{fontSize: '8px'}}>TON</span>
                                    </div>
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