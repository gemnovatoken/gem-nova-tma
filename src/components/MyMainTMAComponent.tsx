import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { RankingModal } from './RankingModal';
import { LuckyWheel } from './LuckyWheel';
import { BoostModal } from './BoostModal';
// CORRECCIÓN: Se eliminó 'Flame' de los imports porque no se usaba
import { Zap, Gamepad2, Rocket, Bot, Video, Server, X, BatteryCharging, ShieldCheck } from 'lucide-react';
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
    overclockTime?: number; 
    setOverclockTime?: Dispatch<SetStateAction<number>>; 
}

interface DockButtonProps {
    icon: React.ReactNode; label: string; sub?: string; color?: string; onClick: () => void;
}

// Interfaz para los efectos visuales (Números flotantes)
interface ClickEffect {
    id: number;
    x: number;
    y: number;
    value: number;
}

const LEVEL_NAMES = ["Laptop", "GPU Rig", "Garage Farm", "Server Room", "Industrial", "Geothermal", "Fusion", "Quantum"];

export const MyMainTMAComponent: React.FC<GameProps> = (props) => {
    const { user } = useAuth();
    
    const [showRanking, setShowRanking] = useState(false);
    const [showLucky, setShowLucky] = useState(false);
    const [showBoosts, setShowBoosts] = useState(false);
    const [showManager, setShowManager] = useState(false); // 🔥 NUEVO ESTADO PARA EL MODAL DEL MANAGER
    const [loading, setLoading] = useState(false);
    const [claiming, setClaiming] = useState(false);
    
    // Estados para el "Juice" Visual
    const [isPressed, setIsPressed] = useState(false);
    const [clickEffects, setClickEffects] = useState<ClickEffect[]>([]);
    
    const { 
        score, setScore, energy, setEnergy, levels, setLevels, 
        maxEnergy, regenRate, botTime, setBotTime, 
        adsWatched, setAdsWatched, 
        setOverclockTime, overclockTime     
    } = props;

    const globalLevel = levels.limit; 
    const isGodMode = globalLevel >= 8; 
    const isEliteMode = globalLevel >= 6 && globalLevel < 8; 
    const isBasicMode = globalLevel < 6; 

    // --- FUNCIÓN DE COBRO (CLAIM) ORIGINAL ---
    const handleClaim = useCallback(async () => {
        if (!user || energy < 1 || claiming) return;
        
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

    // --- WRAPPER CON "JUICE" (EFECTOS VISUALES) ---
    const handleTapWithJuice = (e: React.TouchEvent | React.MouseEvent) => {
        if (energy < 1 || claiming) return;

        // 1. Feedback Háptico (Vibración)
        if (window.navigator.vibrate) window.navigator.vibrate(50); // Vibración seca

        // 2. Efecto Rebote (Animación CSS)
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 100);

        // 3. Números Flotantes
        let clientX, clientY;
        if ('changedTouches' in e) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const newEffect: ClickEffect = {
            id: Date.now(),
            x: clientX,
            y: clientY,
            value: Math.floor(energy)
        };

        setClickEffects(prev => [...prev, newEffect]);

        // Limpiar el efecto después de 1 segundo
        setTimeout(() => {
            setClickEffects(prev => prev.filter(item => item.id !== newEffect.id));
        }, 1000);

        // 4. Ejecutar la lógica original
        handleClaim();
    };

    // --- AUTO-CLAIM DEL BOT ---
    useEffect(() => {
        if (botTime > 0 && energy >= maxEnergy * 0.9) {
            const t = setTimeout(() => {
                handleClaim();
            }, 0);
            return () => clearTimeout(t);
        }
    }, [botTime, energy, maxEnergy, handleClaim]);

    // --- 🔥 WATCH VIDEO (AHORA CON SMART FILL 🧠💰) ---
    const watchVideo = useCallback(async (type: 'turbo' | 'refill') => {
        if (!user) return; 

        if (type === 'turbo') {
            if(!window.confirm("📺 Watch Ad to DOUBLE mining speed (60s)?")) return;

            const { data, error } = await supabase.rpc('watch_overclock_ad', { user_id_in: user.id });

            if (error) {
                alert("Error: " + error.message);
            } else if (data && data[0].success) {
                if (setOverclockTime) setOverclockTime(60); 

                alert(`🚀 OVERCLOCK ACTIVATED!\nSpeed x2 for 60 seconds.\nUses today: ${data[0].new_count}/3`);
            } else {
                alert(data?.[0]?.message || "Limit reached");
            }
        } 
        else if (type === 'refill') {
            if(!window.confirm("📺 Watch Ad to FILL tank?")) return;
            
            // 🧠 SMART FILL: Si tiene energía acumulada, ¡la cobramos primero!
            if (energy > 0) {
                const collected = Math.floor(energy);
                setScore(prev => prev + collected); // Sumamos al saldo del usuario
                console.log(`Smart Fill: Auto-collected ${collected} points before refill.`);
                
                // Opcional: Llamar a claim_mining para sincronizar backend si es necesario
                supabase.rpc('claim_mining', { user_id_in: user.id });
            }

            // Después llenamos el tanque a tope
            const { error } = await supabase.rpc('apply_refill', { user_id_in: user.id });
            if (error) console.error(error);
             
            setEnergy(maxEnergy);
            alert("🔋 Smart Refill!\nCollected pending points & Filled Tank 100%");
        }
    }, [maxEnergy, setEnergy, user, setOverclockTime, energy, setScore]);

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
    
    const ringColor = (overclockTime && overclockTime > 0) 
        ? '#FF0055' 
        : (fillPercent < 50 ? '#00F2FE' : (fillPercent < 90 ? '#FFD700' : '#FF512F'));

    const getBotLabel = () => {
        if (botTime > 0) return "ACTIVE";
        return "OFFLINE";
    };

    const getBotColor = () => {
        if (botTime > 0) return "#4CAF50"; 
        return "#FF512F"; 
    };

    // 🔥 NUEVAS FUNCIONES PARA EL MANAGER 🔥
    const handleWatchBotAd = async (hours: number) => {
        if (!user) return;
        setLoading(true);
        // Simulamos la llamada a ver el anuncio
        const { data, error } = await supabase.rpc('watch_bot_ad', { user_id_in: user.id });
        if (!error && data && data[0].success) {
            setAdsWatched(data[0].new_count); 
            const durationSeconds = hours * 3600;
            setBotTime(prev => prev + durationSeconds);
            await supabase.rpc('activate_bot', { user_id_in: user.id, duration_seconds: durationSeconds });
            alert(`✅ Ad Verified! Bot active for ${hours} Hours.`);
            setShowManager(false);
        } else {
            alert(error?.message || data?.[0]?.message || "Error watching ad.");
        }
        setLoading(false);
    };

    const handleBuyPremiumBot = async (tonAmount: number, days: number) => {
        if (!user) return;
        const confirmBuy = window.confirm(`💎 PREMIUM CONTRACT\n\nPay ${tonAmount} TON for ${days} Days of Bot Service?`);
        if(!confirmBuy) return;
        
        setLoading(true);
        // AQUÍ IRÁ LA LÓGICA DE TON CONNECT CUANDO LA TENGAMOS. POR AHORA SIMULAMOS:
        setTimeout(() => {
            alert(`🎉 PAYMENT SUCCESSFUL!\n\nBot Premium activated for ${days} days.`);
            setShowManager(false);
            setLoading(false);
        }, 1500);
    };

    return (
        <div style={{ 
            display: 'flex', flexDirection: 'column', 
            justifyContent: 'center', alignItems: 'center', gap: '15px',
            height: 'calc(100dvh - 135px)', padding: '0', maxWidth: '500px', margin: '0 auto',
            position: 'relative', overflow: 'hidden'
        }}>
            
            {/* SCORE HEADER */}
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

            {/* ZONA CENTRAL: REACTOR VIVO */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '280px', height: '280px' }}>
                
                {/* 1. Anillos Decorativos (Animación Idle) */}
                <div style={{ 
                    position: 'absolute', width: '100%', height: '100%', 
                    borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.1)',
                    animation: 'spin 20s linear infinite', zIndex: 0
                }}></div>
                <div style={{ 
                    position: 'absolute', width: '90%', height: '90%', 
                    borderRadius: '50%', border: '1px solid rgba(0, 242, 254, 0.05)',
                    animation: 'pulse-glow 4s ease-in-out infinite', zIndex: 0
                }}></div>

                {/* 2. Círculo SVG (Barra de Progreso) */}
                <div style={{ position: 'absolute', width: '260px', height: '260px', zIndex: 1, transform: 'rotate(-90deg)' }}>
                    <svg width="260" height="260">
                        <circle cx="130" cy="130" r={radius} stroke="#1a1a1a" strokeWidth="12" fill="transparent" />
                        <circle cx="130" cy="130" r={radius} stroke={ringColor} strokeWidth="12" fill="transparent" 
                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.5s ease' }}
                        />
                    </svg>
                </div>

                {/* 3. BOTÓN CENTRAL CON INTERACCIÓN */}
                <button 
                    onTouchStart={handleTapWithJuice} onMouseDown={handleTapWithJuice} disabled={energy < 1}
                    style={{
                        width: '170px', height: '170px', borderRadius: '50%', zIndex: 2, border: 'none',
                        background: claiming ? '#fff' : `radial-gradient(circle at 30% 30%, ${ringColor}, #050505)`,
                        boxShadow: `0 0 ${fillPercent/2}px ${ringColor}`, cursor: 'pointer', 
                        transform: isPressed ? 'scale(0.92)' : (claiming ? 'scale(0.95)' : 'scale(1)'), 
                        transition: 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    {claiming ? (
                        <span style={{color:'#000', fontWeight:'bold', fontSize:'14px'}}>COLLECTING...</span>
                    ) : (
                        <>
                            <div style={{fontSize:'24px', filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))'}}>
                                {(overclockTime && overclockTime > 0) ? '🔥' : (fillPercent >= 100 ? '⚠️' : '⚡')}
                            </div>
                            <div style={{fontSize:'18px', fontWeight:'900', color:'#fff', textShadow:'0 0 5px #000'}}>+{Math.floor(energy)}</div>
                            {(overclockTime && overclockTime > 0) ? (
                                <div style={{ color: '#FF0055', fontWeight: '900', fontSize: '14px', marginTop: '2px', animation: 'pulse 0.8s infinite alternate' }}>TURBO {overclockTime}s</div>
                            ) : (
                                <div style={{fontSize:'8px', color:'rgba(255,255,255,0.8)', marginTop:'2px'}}>{fillPercent.toFixed(0)}% FULL</div>
                            )}
                        </>
                    )}
                </button>

                {/* 4. VISUALIZADOR DE CLICKS (Floating Numbers) */}
                {clickEffects.map((effect) => (
                    <div key={effect.id} style={{ position: 'fixed', left: effect.x, top: effect.y, pointerEvents: 'none', zIndex: 100, color: ringColor, fontWeight: '900', fontSize: '24px', textShadow: '0 0 10px rgba(0,0,0,0.8)', animation: 'floatUp 0.8s ease-out forwards', transform: 'translate(-50%, -50%)' }}>
                        +{effect.value}
                    </div>
                ))}
            </div>

            {/* STATUS BAR & DOCK */}
            <div style={{ width: '100%', padding: '0 15px', zIndex: 10 }}>
                <div style={{ marginBottom:'2px', display:'flex', justifyContent:'center', fontSize:'9px', color: ringColor, fontWeight:'bold' }}>
                    <span>PRODUCTION: {(overclockTime && overclockTime > 0) ? (regenRate * 3600 * 2) : (regenRate * 3600)} PTS/HOUR</span>
                </div>

                <div className="glass-card" style={{ padding: '6px', borderRadius: '16px', background: 'rgba(20, 20, 30, 0.95)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap:'5px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px' }}>
                        <DockButton icon={<Rocket/>} label="UPGRADE" color="#00F2FE" onClick={() => setShowBoosts(true)} />
                        <DockButton 
                            icon={<Bot/>} label="MANAGER" sub={getBotLabel()} color={getBotColor()} 
                            onClick={() => setShowManager(true)} 
                        />
                        <DockButton icon={<Zap/>} label="OVERCLOCK" sub="AD" color="#FF512F" onClick={() => watchVideo('turbo')} />
                        <DockButton icon={<Video/>} label="INSTA-FILL" sub="AD" color="#4CAF50" onClick={() => watchVideo('refill')} />
                    </div>

                    <button onClick={() => setShowLucky(true)} style={{ width:'100%', padding:'6px', borderRadius:'10px', border:'1px solid #E040FB', background:'rgba(224, 64, 251, 0.15)', color:'#fff', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:'6px' }}>
                        <Gamepad2 size={14} color="#E040FB"/> 
                        <span style={{fontSize:'10px', fontWeight:'bold'}}>CASINO SPIN</span>
                    </button>
                </div>
            </div>

            {/* --- 🔥 NUEVO MODAL DEL MANAGER (BOT) 🔥 --- */}
            {showManager && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 5000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '400px', border: '1px solid #00F2FE', position: 'relative', padding: '20px' }}>
                        <button onClick={() => setShowManager(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#fff' }}><X /></button>
                        
                        <div style={{textAlign: 'center', marginBottom: '20px'}}>
                            <Bot size={40} color="#00F2FE" style={{marginBottom: '10px'}}/>
                            <h2 style={{margin: 0, color: '#fff', fontSize: '20px', letterSpacing: '1px'}}>AUTO-MINER BOT</h2>
                            <p style={{color: '#aaa', fontSize: '12px', margin: '5px 0 0 0'}}>Let the system work while you sleep.</p>
                        </div>

                        {/* RENDERIZADO CONDICIONAL POR NIVELES */}
                        {isBasicMode && (
                            <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                                <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', border:'1px solid #333'}}>
                                    <div style={{fontSize:'14px', fontWeight:'bold', color:'#fff', marginBottom:'5px', display:'flex', justifyContent:'space-between'}}>
                                        <span>Basic Contract</span>
                                        <span style={{color:'#00F2FE'}}>4 Hours</span>
                                    </div>
                                    <div style={{fontSize:'11px', color:'#aaa', marginBottom:'15px'}}>Watch an ad to activate. Max 2 per day.</div>
                                    <button onClick={() => handleWatchBotAd(4)} disabled={adsWatched >= 2 || loading} className="btn-neon" style={{width:'100%', background:'transparent', border:'1px solid #00F2FE', color:'#00F2FE'}}>
                                        {adsWatched >= 2 ? 'LIMIT REACHED (2/2)' : `WATCH AD (${adsWatched}/2)`} <Video size={14} style={{marginLeft:'5px', verticalAlign:'middle'}}/>
                                    </button>
                                </div>

                                <div style={{background:'rgba(255,215,0,0.1)', padding:'15px', borderRadius:'12px', border:'1px solid #FFD700'}}>
                                    <div style={{fontSize:'14px', fontWeight:'bold', color:'#FFD700', marginBottom:'5px', display:'flex', justifyContent:'space-between'}}>
                                        <span>Premium Bypass</span>
                                        <span>48 Hours</span>
                                    </div>
                                    <div style={{fontSize:'11px', color:'#ccc', marginBottom:'15px'}}>No ads. Non-stop mining for 2 full days.</div>
                                    <button onClick={() => handleBuyPremiumBot(0.15, 2)} disabled={loading} className="btn-neon" style={{width:'100%', background:'#FFD700', color:'#000', border:'none'}}>
                                        PAY 0.15 TON
                                    </button>
                                </div>
                            </div>
                        )}

                        {isEliteMode && (
                            <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                                <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', border:'1px solid #333'}}>
                                    <div style={{fontSize:'14px', fontWeight:'bold', color:'#fff', marginBottom:'5px', display:'flex', justifyContent:'space-between'}}>
                                        <span>Elite Contract</span>
                                        <span style={{color:'#00F2FE'}}>24 Hours</span>
                                    </div>
                                    <div style={{fontSize:'11px', color:'#aaa', marginBottom:'15px'}}>Watch a quick sponsor ad to activate your free daily bot.</div>
                                    <button onClick={() => handleWatchBotAd(24)} disabled={loading} className="btn-neon" style={{width:'100%', background:'transparent', border:'1px solid #00F2FE', color:'#00F2FE'}}>
                                        WATCH 1 AD <Video size={14} style={{marginLeft:'5px', verticalAlign:'middle'}}/>
                                    </button>
                                </div>

                                <div style={{background:'rgba(255,215,0,0.1)', padding:'15px', borderRadius:'12px', border:'1px solid #FFD700'}}>
                                    <div style={{fontSize:'14px', fontWeight:'bold', color:'#FFD700', marginBottom:'5px', display:'flex', justifyContent:'space-between'}}>
                                        <span>Elite Weekly Pass</span>
                                        <span>6 Days</span>
                                    </div>
                                    <div style={{fontSize:'11px', color:'#ccc', marginBottom:'15px'}}><BatteryCharging size={12} style={{verticalAlign:'middle'}}/> Requires tap to reload every 3 days.</div>
                                    <button onClick={() => handleBuyPremiumBot(0.20, 6)} disabled={loading} className="btn-neon" style={{width:'100%', background:'#FFD700', color:'#000', border:'none'}}>
                                        PAY 0.20 TON
                                    </button>
                                </div>
                            </div>
                        )}

                        {isGodMode && (
                            <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                                <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', border:'1px solid #333'}}>
                                    <div style={{fontSize:'14px', fontWeight:'bold', color:'#fff', marginBottom:'5px', display:'flex', justifyContent:'space-between'}}>
                                        <span>Quantum Contract</span>
                                        <span style={{color:'#00F2FE'}}>3 Days (72h)</span>
                                    </div>
                                    <div style={{fontSize:'11px', color:'#aaa', marginBottom:'15px'}}>Whale perk: 1 ad gives you 3 full days of mining.</div>
                                    <button onClick={() => handleWatchBotAd(72)} disabled={loading} className="btn-neon" style={{width:'100%', background:'transparent', border:'1px solid #00F2FE', color:'#00F2FE'}}>
                                        WATCH 1 AD <Video size={14} style={{marginLeft:'5px', verticalAlign:'middle'}}/>
                                    </button>
                                </div>

                                <div style={{background:'rgba(224, 64, 251, 0.15)', padding:'15px', borderRadius:'12px', border:'1px solid #E040FB'}}>
                                    <div style={{fontSize:'14px', fontWeight:'bold', color:'#E040FB', marginBottom:'5px', display:'flex', justifyContent:'space-between'}}>
                                        <span>God Mode Pass</span>
                                        <span>15 Days</span>
                                    </div>
                                    <div style={{fontSize:'11px', color:'#ccc', marginBottom:'15px'}}><ShieldCheck size={12} style={{verticalAlign:'middle'}}/> Requires tap to reload every 5 days.</div>
                                    <button onClick={() => handleBuyPremiumBot(0.30, 15)} disabled={loading} className="btn-neon" style={{width:'100%', background:'#E040FB', color:'#fff', border:'none'}}>
                                        PAY 0.30 TON
                                    </button>
                                </div>
                            </div>
                        )}

                        {botTime > 0 && (
                            <div style={{marginTop:'20px', textAlign:'center', color:'#4CAF50', fontSize:'12px', fontWeight:'bold', background:'rgba(76, 175, 80, 0.1)', padding:'10px', borderRadius:'8px'}}>
                                ✅ SUPERVISOR IS CURRENTLY ACTIVE
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
            {showLucky && <LuckyWheel onClose={() => setShowLucky(false)} onUpdateScore={setScore} />}
            {showBoosts && <BoostModal onClose={() => setShowBoosts(false)} levels={levels} score={score} onBuy={buyBoost} />}
            
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse { 0% { transform: scale(1); opacity: 1; text-shadow: 0 0 10px #FF0055; } 100% { transform: scale(1.1); opacity: 0.8; text-shadow: 0 0 20px #FF0055; } }
                @keyframes pulse-glow { 0% { transform: scale(1); opacity: 0.5; border-color: rgba(0, 242, 254, 0.1); } 50% { transform: scale(1.05); opacity: 0.8; border-color: rgba(0, 242, 254, 0.3); } 100% { transform: scale(1); opacity: 0.5; border-color: rgba(0, 242, 254, 0.1); } }
                @keyframes floatUp { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -150px) scale(1.5); opacity: 0; } }
            `}</style>
        </div>
    );
};

const DockButton: React.FC<DockButtonProps> = ({ icon, label, sub, color, onClick }) => (
    <button onClick={onClick} style={{ background: 'transparent', border: 'none', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0px', cursor: 'pointer', color: color || '#fff', padding: '4px 0' }}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ size: number }>, { size: 18 }) : icon}
        <span style={{ fontSize: '8px', fontWeight: 'bold', marginTop:'1px' }}>{label}</span>
        {sub && <span style={{ fontSize: '6px', background: '#333', padding: '0px 3px', borderRadius: '2px', color: '#aaa', marginTop:'1px' }}>{sub}</span>}
    </button>
);