import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { RankingModal } from './RankingModal';
import { LuckyWheel } from './LuckyWheel';
import { BoostModal } from './BoostModal';
import { Zap, Gamepad2, Rocket, Bot, Video, Server } from 'lucide-react';
import type { SetStateAction, Dispatch } from 'react';

interface GameProps {
    score: number; setScore: Dispatch<SetStateAction<number>>;
    energy: number; setEnergy: Dispatch<SetStateAction<number>>;
    levels: { multitap: number; limit: number; speed: number }; 
    setLevels: Dispatch<SetStateAction<{ multitap: number; limit: number; speed: number }>>;
    maxEnergy: number; regenRate: number;
    botTime: number; 
    setBotTime: Dispatch<SetStateAction<number>>;
    adsWatched: number; 
    setAdsWatched: Dispatch<SetStateAction<number>>;
    overclockTime?: number; // Opcional para que no rompa si falta
    setOverclockTime?: Dispatch<SetStateAction<number>>; // Opcional
}

interface DockButtonProps {
    icon: React.ReactNode; label: string; sub?: string; color?: string; onClick: () => void;
}

const LEVEL_NAMES = ["Laptop", "GPU Rig", "Garage Farm", "Server Room", "Industrial", "Geothermal", "Fusion", "Quantum"];

export const MyMainTMAComponent: React.FC<GameProps> = (props) => {
    const { user } = useAuth();
    
    const [showRanking, setShowRanking] = useState(false);
    const [showLucky, setShowLucky] = useState(false);
    const [showBoosts, setShowBoosts] = useState(false);
    const [loading, setLoading] = useState(false);
    const [claiming, setClaiming] = useState(false);
    
    const { 
        score, setScore, energy, setEnergy, levels, setLevels, 
        maxEnergy, regenRate, botTime, setBotTime, 
        adsWatched, setAdsWatched,setOverclockTime // <--- Recíbela aquí
    } = props;

    const globalLevel = levels.limit; 
    const isGodMode = globalLevel >= 8; 
    const isEliteMode = globalLevel >= 6 && globalLevel < 8; 
    const isBasicMode = globalLevel < 6; 

    // --- FUNCIÓN DE COBRO (CLAIM) ---
    const handleClaim = useCallback(async () => {
        if (!user || energy < 1 || claiming) return;
        
        if (window.navigator.vibrate) window.navigator.vibrate(50);
        setClaiming(true);

        const amountToClaim = Math.floor(energy);
        setScore(prev => prev + amountToClaim);
        setEnergy(0); 

        const { data, error } = await supabase.rpc('claim_mining', { user_id_in: user.id });
        
        if (error) console.error("Claim error:", error);

        if (data && data[0] && data[0].success) {
            setScore(data[0].new_score);
        }
        setTimeout(() => setClaiming(false), 500);
    }, [user, energy, claiming, setScore, setEnergy]);

    // --- AUTO-CLAIM DEL BOT ---
    useEffect(() => {
        if (botTime > 0 && energy >= maxEnergy * 0.9) {
            const t = setTimeout(() => {
                handleClaim();
            }, 0);
            return () => clearTimeout(t);
        }
    }, [botTime, energy, maxEnergy, handleClaim]);

    // --- FUNCIÓN PARA ACTIVAR BOT ---
    const activateBot = async (duration: number) => {
        if (!user) return;
        setBotTime(prev => prev + duration); 
        await supabase.rpc('activate_bot', { user_id_in: user.id, duration_seconds: duration });
    };

    const handleBotClick = async () => {
        if (botTime > 0) { 
            const hrs = Math.floor(botTime / 3600);
            const mins = Math.floor((botTime % 3600) / 60);
            alert(`🤖 Supervisor Active: ${hrs}h ${mins}m remaining.`); 
            return; 
        }

        if (isGodMode) {
            if(window.confirm("🌌 QUANTUM SUPERVISOR\n\nActivate for 5 DAYS (120 Hours)?")) {
                await activateBot(432000); 
                alert("✅ Bot deployed for 5 days.");
            }
            return;
        }

        if (isEliteMode) {
            if(window.confirm("🌋 ELITE SUPERVISOR\n\nActivate for 2 DAYS (48 Hours)?")) {
                await activateBot(172800); 
                alert("✅ Bot deployed for 48 hours.");
            }
            return;
        }

        if (isBasicMode) {
            if (adsWatched >= 2) {
                alert("🛑 Daily Limit Reached (2/2)\n\nUpgrade to Level 6 to remove limits and ads!");
                return;
            }

            if(window.confirm(`📺 Hire Supervisor for 30m?\n\nWatch Ad (${2 - adsWatched} left today)`)) {
                console.log("Watching Ad...");
                if (!user) return;
                
                // LLAMADA A SUPABASE
                const { data, error } = await supabase.rpc('watch_bot_ad', { user_id_in: user.id });
                
                // 🔍 DEBUGGING MEJORADO:
                if (error) {
                    // Si Supabase falló (error de conexión, función no existe, permisos, etc.)
                    console.error("Supabase Error:", error);
                    alert("SYSTEM ERROR:\n" + error.message); // <--- ESTO TE DIRÁ LA VERDAD
                } 
                else if (data && data[0] && data[0].success) {
                    // ÉXITO
                    await supabase.from('game_logs').insert({
                        user_id: user.id,
                        event_type: 'video_bot',
                        metadata: { source: 'bot_supervisor' } 
                    });

                    setAdsWatched(data[0].new_count); 
                    activateBot(1800); 
                    alert("✅ Bot Activated for 30m!");
                } 
                else {
                    // Si la lógica de negocio falló (ej: límite alcanzado)
                    alert(data?.[0]?.message || "Unknown error occurred.");
                }
            }
        }
    };

    // --- 🔥 WATCH VIDEO (CORREGIDO PARA INSTAFILL) ---
        const watchVideo = useCallback(async (type: 'turbo' | 'refill') => {
             if (type === 'turbo') {
            if(!window.confirm("📺 Watch Ad to DOUBLE mining speed (60s)?")) return;

        // 1. Verificar límite en BD
            if (!user) return;
        const { data, error } = await supabase.rpc('watch_overclock_ad', { user_id_in: user.id });

             if (error) {
            alert("Error: " + error.message);
                 } else if (data && data[0].success) {
            // 2. ACTIVAR EL TURBO REAL
            if (setOverclockTime) setOverclockTime(60); // 60 segundos de turbo

            alert(`🚀 OVERCLOCK ACTIVATED!\nSpeed x2 for 60 seconds.\nUses today: ${data[0].new_count}/3`);
        } else {
            alert(data?.[0]?.message || "Limit reached");
        }
    } 
    else if (type === 'refill') {
        // ... (Tu lógica de refill que ya tenías)
        if(!window.confirm("📺 Watch Ad to FILL tank?")) return;
        setEnergy(maxEnergy);
        alert("🔋 Filled!");
    }
    }, [maxEnergy, setEnergy, user, setOverclockTime]);

    const buyBoost = useCallback(async (type: 'multitap' | 'limit' | 'speed') => {
        if (loading || !user) return; setLoading(true);
        const { data, error } = await supabase.rpc('buy_boost', { user_id_in: user.id, boost_type: type });
        
        if (error) console.error("Boost error:", error);

        if (!error && data && data[0].success) {
            setScore(data[0].new_score); setLevels(p => ({ ...p, [type]: data[0].new_level })); alert(data[0].message);
        } else alert(data?.[0]?.message || "Error");
        setLoading(false);
    }, [user, loading, setScore, setLevels]);

    const radius = 100; 
    const circumference = 2 * Math.PI * radius;
    const fillPercent = Math.min(100, (energy / maxEnergy) * 100);
    const strokeDashoffset = circumference - (fillPercent / 100) * circumference;
    const ringColor = fillPercent < 50 ? '#00F2FE' : (fillPercent < 90 ? '#FFD700' : '#FF512F');

    const getBotLabel = () => {
        if (botTime > 0) return "ACTIVE";
        if (isGodMode) return "5 DAYS";
        if (isEliteMode) return "48 HRS";
        return adsWatched >= 2 ? "LIMIT" : "30 MIN";
    };

    const getBotColor = () => {
        if (botTime > 0) return "#4CAF50"; 
        if (isGodMode || isEliteMode) return "#FFD700"; 
        if (adsWatched >= 2) return "#333"; 
        return "#fff"; 
    };

    return (
        <div style={{ 
            display: 'flex', flexDirection: 'column', 
            justifyContent: 'center', alignItems: 'center', gap: '15px',
            height: 'calc(100dvh - 135px)', padding: '0', maxWidth: '500px', margin: '0 auto',
            position: 'relative', overflow: 'hidden'
        }}>
            
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', zIndex:10, marginTop:'-10px' }}>
                <div onClick={() => setShowRanking(true)} className="glass-card" style={{ 
                    padding: '4px 12px', borderRadius:'20px', display:'flex', gap:'6px', alignItems:'center', 
                    background: 'rgba(20, 20, 30, 0.8)', border: '1px solid #333', cursor:'pointer', marginBottom: '2px'
                }}>
                    <Server size={12} color={isGodMode ? "#FFD700" : "#aaa"}/>
                    <span style={{fontSize:'9px', color:'#fff', fontWeight:'bold', letterSpacing:'1px'}}>
                        RIG: {LEVEL_NAMES[Math.min(globalLevel-1, 7)]?.toUpperCase()}
                    </span>
                </div>
                <div className="text-gradient" style={{ fontSize: '36px', fontWeight: '900', margin: '0', lineHeight:1 }}>
                    {score.toLocaleString()}
                </div>
                <div style={{fontSize:'9px', color:'#aaa', marginTop:'2px'}}>TOTAL MINED</div>
            </div>

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '260px', height: '260px' }}>
                <div style={{ 
                    position: 'absolute', width: '100%', height: '100%', 
                    borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.1)',
                    animation: 'spin 20s linear infinite' 
                }}></div>

                <div style={{ position: 'absolute', width: '260px', height: '260px', zIndex: 0, transform: 'rotate(-90deg)' }}>
                    <svg width="260" height="260">
                        <circle cx="130" cy="130" r={radius} stroke="#1a1a1a" strokeWidth="12" fill="transparent" />
                        <circle cx="130" cy="130" r={radius} stroke={ringColor} strokeWidth="12" fill="transparent" 
                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.5s ease' }}
                        />
                    </svg>
                </div>

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
                        <span style={{color:'#000', fontWeight:'bold', fontSize:'14px'}}>COLLECTING...</span>
                    ) : (
                        <>
                            <div style={{fontSize:'24px', filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))'}}>
                                {fillPercent >= 100 ? '⚠️' : '⚡'}
                            </div>
                            <div style={{fontSize:'18px', fontWeight:'900', color:'#fff', textShadow:'0 0 5px #000'}}>
                                +{Math.floor(energy)}
                            </div>
                            <div style={{fontSize:'8px', color:'rgba(255,255,255,0.8)', marginTop:'2px'}}>
                                {fillPercent.toFixed(0)}% FULL
                            </div>
                        </>
                    )}
                </button>
            </div>

            <div style={{ width: '100%', padding: '0 15px', zIndex: 10 }}>
                <div style={{ marginBottom:'2px', display:'flex', justifyContent:'center', fontSize:'9px', color: ringColor, fontWeight:'bold' }}>
                    <span>PRODUCTION: {regenRate * 3600} PTS/HOUR</span>
                </div>

                <div className="glass-card" style={{ 
                    padding: '6px', borderRadius: '16px', background: 'rgba(20, 20, 30, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', flexDirection: 'column', gap:'5px'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px' }}>
                        <DockButton icon={<Rocket/>} label="UPGRADE" color="#00F2FE" onClick={() => setShowBoosts(true)} />
                        <DockButton 
                            icon={<Bot/>} 
                            label="MANAGER" 
                            sub={getBotLabel()} 
                            color={getBotColor()} 
                            onClick={handleBotClick} 
                        />
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
            {showBoosts && <BoostModal onClose={() => setShowBoosts(false)} levels={levels} score={score} onBuy={buyBoost} />}
            
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
        {React.isValidElement(icon) 
            ? React.cloneElement(icon as React.ReactElement<{ size: number }>, { size: 18 }) 
            : icon}
        <span style={{ fontSize: '8px', fontWeight: 'bold', marginTop:'1px' }}>{label}</span>
        {sub && <span style={{ fontSize: '6px', background: '#333', padding: '0px 3px', borderRadius: '2px', color: '#aaa', marginTop:'1px' }}>{sub}</span>}
    </button>
);