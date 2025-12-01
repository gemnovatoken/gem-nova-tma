import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { RankingModal } from './RankingModal';
import { LuckyWheel } from './LuckyWheel';
import { BoostModal } from './BoostModal';
import { Trophy, Zap, Gamepad2, Rocket, Bot, Video, Cpu, Server } from 'lucide-react'; // Nuevos iconos
import type { SetStateAction, Dispatch, ReactElement } from 'react';

// Interfaces
interface GameProps {
    score: number; setScore: Dispatch<SetStateAction<number>>;
    energy: number; setEnergy: Dispatch<SetStateAction<number>>;
    levels: { multitap: number; limit: number; speed: number }; 
    setLevels: Dispatch<SetStateAction<{ multitap: number; limit: number; speed: number }>>;
    maxEnergy: number; regenRate: number;
}

interface DockButtonProps {
    icon: React.ReactNode; label: string; sub?: string; color?: string; onClick: () => void;
}

// Configuración Actualizada (Hard Money)
const LEVEL_NAMES = ["Laptop", "GPU Rig", "Garage Farm", "Server Room", "Industrial", "Geothermal", "Fusion", "Quantum"];
const GAME_CONFIG = {
    multitap: { costs: [5000, 30000, 100000, 500000, 2000000, 5000000, 10000000], values: [1, 2, 3, 4, 6, 8, 12, 20] }, // Ya no se usa para tap, pero sí para nivel global
    limit:    { costs: [5000, 30000, 100000, 500000, 2000000, 5000000, 10000000], values: [500, 1000, 1500, 2500, 4000, 6000, 9000, 15000] },
    speed:    { costs: [5000, 30000, 100000, 500000, 2000000, 5000000, 10000000], values: [1, 2, 3, 4, 5, 6, 8, 12] }
};

export const MyMainTMAComponent: React.FC<GameProps> = (props) => {
    const { user } = useAuth();
    const [showRanking, setShowRanking] = useState(false);
    const [showLucky, setShowLucky] = useState(false);
    const [showBoosts, setShowBoosts] = useState(false);
    const [loading, setLoading] = useState(false);
    const [claiming, setClaiming] = useState(false);

    // Estados
    const [botTime, setBotTime] = useState(0); 
    const { score, setScore, energy, setEnergy, levels, setLevels, maxEnergy, regenRate } = props;

    const globalLevel = Math.min(levels.limit, levels.speed); // Nivel basado en infraestructura
    const isPremiumBot = globalLevel >= 7; 
    
    // --- LÓGICA DEL BOT (Ahora es un "Supervisor Automático") ---
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (botTime > 0) {
            interval = setInterval(() => {
                setBotTime(t => Math.max(0, t - 1));
                // El bot ahora asegura que nunca se llene el tanque (Auto-Claim simulado)
                if (energy >= maxEnergy * 0.9) {
                    handleClaim(); // Reclama al 90%
                }
            }, 1000); 
        }
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [botTime, energy, maxEnergy]);

    // --- FUNCIÓN PRINCIPAL: RECLAMAR MINADO (CLAIM) ---
    const handleClaim = async () => {
        if (!user || energy <= 0 || claiming) return;
        
        // Feedback Visual
        if (window.navigator.vibrate) window.navigator.vibrate(50);
        setClaiming(true);

        // Optimistic Update
        const claimedAmount = energy;
        setScore(s => s + claimedAmount);
        setEnergy(0); // Vaciar tanque visualmente

        // Sincronizar con Servidor
        const { data, error } = await supabase.rpc('claim_mining', { user_id_in: user.id });
        
        if (data && data[0] && data[0].success) {
            setScore(data[0].new_score);
            // setEnergy(0); // Ya lo hicimos arriba
        } else {
            console.error("Claim Error", error);
            // Revertir si falla es complejo, mejor dejar que se sincronice solo en el siguiente fetch
        }
        
        setTimeout(() => setClaiming(false), 500); // Cooldown visual
    };

    const handleBotClick = () => {
        if (botTime > 0) { alert(`🤖 Auto-Supervisor Active: ${Math.ceil(botTime/60)}m remaining`); return; }
        if (isPremiumBot) {
            if(window.confirm("💎 LEVEL 7: Deploy AI Supervisor (6 Hours)?")) setBotTime(21600);
        } else {
            if(window.confirm("📺 Hire Supervisor for 10m? (Watch Ad)")) {
                console.log("Ad..."); setTimeout(() => setBotTime(600), 2000);
            }
        }
    };

    const watchVideo = useCallback((type: 'turbo' | 'refill') => {
        // En modelo minería, 'Turbo' duplica velocidad, 'Refill' llena el tanque instantáneo (Bonus)
        if(!window.confirm(type === 'turbo' ? "📺 Watch Ad to double mining speed (1m)?" : "📺 Watch Ad to instantly fill tank?")) return;
        
        setTimeout(() => {
            if (type === 'turbo') {
                alert("🚀 OVERCLOCK ACTIVATED! (Speed x2)");
                // Aquí deberías tener lógica para duplicar regenRate temporalmente en App.tsx, por ahora es visual
            } else {
                setEnergy(maxEnergy); 
                alert("🔋 Tank Filled Instantly!");
            }
        }, 2000);
    }, [maxEnergy, setEnergy]);

    const buyBoost = useCallback(async (type: 'multitap' | 'limit' | 'speed') => {
        if (loading || !user) return; setLoading(true);
        const { data, error } = await supabase.rpc('buy_boost', { user_id_in: user.id, boost_type: type });
        if (!error && data && data[0].success) {
            setScore(data[0].new_score); setLevels(p => ({ ...p, [type]: data[0].new_level })); alert(data[0].message);
        } else alert(data?.[0]?.message || "Error");
        setLoading(false);
    }, [user, loading, setScore, setLevels]);

    // Cálculos Visuales del Reactor
    const radius = 100; 
    const circumference = 2 * Math.PI * radius;
    const fillPercent = Math.min(100, (energy / maxEnergy) * 100);
    const strokeDashoffset = circumference - (fillPercent / 100) * circumference;
    
    // Color dinámico: Verde (poco) -> Amarillo (medio) -> Rojo (Lleno/Peligro)
    const ringColor = fillPercent < 50 ? '#00F2FE' : (fillPercent < 90 ? '#FFD700' : '#FF512F');

    return (
        <div style={{ 
            display: 'flex', flexDirection: 'column', 
            justifyContent: 'center', alignItems: 'center', gap: '15px',
            height: 'calc(100dvh - 135px)', padding: '0', maxWidth: '500px', margin: '0 auto',
            position: 'relative', overflow: 'hidden'
        }}>
            
            {/* 1. TOP: RIG STATUS */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', zIndex:10, marginTop:'-10px' }}>
                <div onClick={() => setShowRanking(true)} className="glass-card" style={{ 
                    padding: '4px 12px', borderRadius:'20px', display:'flex', gap:'6px', alignItems:'center', 
                    background: 'rgba(20, 20, 30, 0.8)', border: '1px solid #333', cursor:'pointer'
                }}>
                    <Server size={12} color={isPremiumBot ? "#FFD700" : "#aaa"}/>
                    <span style={{fontSize:'9px', color:'#fff', fontWeight:'bold', letterSpacing:'1px'}}>
                        RIG: {LEVEL_NAMES[Math.min(globalLevel-1, 7)].toUpperCase()}
                    </span>
                </div>
                <div className="text-gradient" style={{ fontSize: '36px', fontWeight: '900', margin: '2px 0 0 0', lineHeight:1 }}>
                    {score.toLocaleString()}
                </div>
                <div style={{fontSize:'9px', color:'#aaa', marginTop:'0px'}}>TOTAL MINED</div>
            </div>

            {/* 2. CENTRO: REACTOR DE MINERÍA */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '260px', height: '260px' }}>
                {/* Fondo giratorio lento */}
                <div style={{ 
                    position: 'absolute', width: '100%', height: '100%', 
                    borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.1)',
                    animation: 'spin 10s linear infinite' 
                }}></div>

                <div style={{ position: 'absolute', width: '260px', height: '260px', zIndex: 0, transform: 'rotate(-90deg)' }}>
                    <svg width="260" height="260">
                        {/* Fondo del track */}
                        <circle cx="130" cy="130" r={radius} stroke="#1a1a1a" strokeWidth="12" fill="transparent" />
                        {/* Progreso */}
                        <circle cx="130" cy="130" r={radius} stroke={ringColor} strokeWidth="12" fill="transparent" 
                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.5s ease' }}
                        />
                    </svg>
                </div>

                {/* NÚCLEO CLICKEABLE */}
                <button onClick={handleClaim} disabled={energy < 1}
                    style={{
                        width: '170px', height: '170px', borderRadius: '50%', zIndex: 2, border: 'none',
                        background: claiming ? '#fff' : `radial-gradient(circle at 30% 30%, ${ringColor}, #000)`,
                        boxShadow: `0 0 ${fillPercent/2}px ${ringColor}`, 
                        cursor: 'pointer', transform: claiming ? 'scale(0.95)' : 'scale(1)', transition: 'all 0.1s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    {claiming ? (
                        <span style={{color:'#000', fontWeight:'bold'}}>CLAIMING...</span>
                    ) : (
                        <>
                            <div style={{fontSize:'28px', filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))'}}>⚡</div>
                            <div style={{fontSize:'18px', fontWeight:'900', color:'#fff', textShadow:'0 0 5px #000'}}>+{Math.floor(energy)}</div>
                            <div style={{fontSize:'8px', color:'rgba(255,255,255,0.7)'}}>{fillPercent.toFixed(0)}% FULL</div>
                        </>
                    )}
                </button>
            </div>

            {/* 3. BOTTOM: DOCK DE INGENIERÍA */}
            <div style={{ width: '100%', padding: '0 15px', zIndex: 10 }}>
                <div style={{ marginBottom:'4px', display:'flex', justifyContent:'center', fontSize:'9px', color: ringColor, fontWeight:'bold' }}>
                    <span>PRODUCTION: {regenRate} PTS/SEC</span>
                </div>

                <div className="glass-card" style={{ 
                    padding: '6px', borderRadius: '16px', background: 'rgba(20, 20, 30, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap:'5px'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px' }}>
                        <DockButton icon={<Rocket/>} label="UPGRADE" color="#00F2FE" onClick={() => setShowBoosts(true)} />
                        <DockButton icon={<Bot/>} label="MANAGER" sub={isPremiumBot?"AI":"HIRE"} color={botTime>0?"#4CAF50":"#fff"} onClick={handleBotClick} />
                        <DockButton icon={<Zap/>} label="OVERCLOCK" sub="AD" color="#FF512F" onClick={() => watchVideo('turbo')} />
                        <DockButton icon={<Video/>} label="INSTA-FILL" sub="AD" color="#4CAF50" onClick={() => watchVideo('refill')} />
                    </div>

                    <button onClick={() => setShowLucky(true)} style={{
                        width:'100%', padding:'6px', borderRadius:'10px', border:'1px solid #E040FB', 
                        background:'rgba(224, 64, 251, 0.15)', color:'#fff', cursor:'pointer',
                        display:'flex', justifyContent:'center', alignItems:'center', gap:'6px'
                    }}>
                        <Gamepad2 size={14} color="#E040FB"/> 
                        <span style={{fontSize:'10px', fontWeight:'bold'}}>CASINO SPIN</span>
                    </button>
                </div>
            </div>

            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
            {showLucky && <LuckyWheel onClose={() => setShowLucky(false)} onUpdateScore={setScore} />}
            {showBoosts && <BoostModal onClose={() => setShowBoosts(false)} levels={levels} score={score} onBuy={buyBoost} configs={GAME_CONFIG} />}
            
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const DockButton: React.FC<DockButtonProps> = ({ icon, label, sub, color, onClick }) => (
    <button onClick={onClick} style={{ 
        background: 'transparent', border: 'none', flex: 1, display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', gap: '0px', cursor: 'pointer', color: color || '#fff',
        padding: '4px 0'
    }}>
        {React.isValidElement(icon) ? React.cloneElement(icon as ReactElement<{ size?: number | string }>, { size: 18 }) : icon}
        <span style={{ fontSize: '8px', fontWeight: 'bold', marginTop:'1px' }}>{label}</span>
        {sub && <span style={{ fontSize: '6px', background: '#333', padding: '0px 3px', borderRadius: '2px', color: '#aaa', marginTop:'1px' }}>{sub}</span>}
    </button>
);