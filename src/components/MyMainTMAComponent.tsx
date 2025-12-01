import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { RankingModal } from './RankingModal';
import { LuckyWheel } from './LuckyWheel';
import { BoostModal } from './BoostModal';
import { Trophy, Zap, Gamepad2, Rocket, Bot, Video } from 'lucide-react';
import type { SetStateAction, Dispatch, ReactElement } from 'react';

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

const LEVEL_NAMES = ["Rookie", "Scout", "Miner", "Engineer", "Captain", "Commander", "Lord", "Nova God"];
const GAME_CONFIG = {
    multitap: { costs: [5000, 30000, 100000, 500000, 2000000, 5000000, 10000000], values: [1, 2, 3, 4, 6, 8, 12, 20] },
    limit:    { costs: [5000, 30000, 100000, 500000, 2000000, 5000000, 10000000], values: [500, 1000, 1500, 2500, 4000, 6000, 9000, 15000] },
    speed:    { costs: [5000, 30000, 100000, 500000, 2000000, 5000000, 10000000], values: [1, 2, 3, 4, 5, 6, 8, 12] }
};

export const MyMainTMAComponent: React.FC<GameProps> = (props) => {
    const { user } = useAuth();
    const [showRanking, setShowRanking] = useState(false);
    const [showLucky, setShowLucky] = useState(false);
    const [showBoosts, setShowBoosts] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [multiplier, setMultiplier] = useState(1);
    const [turboActive, setTurboActive] = useState(false);
    const [botTime, setBotTime] = useState(0); 

    const { score, setScore, energy, setEnergy, levels, setLevels, maxEnergy, regenRate } = props;
    const globalLevel = Math.min(levels.multitap, levels.limit, levels.speed);
    const isPremiumBot = globalLevel >= 7; 
    const tapLevelIndex = Math.min(levels.multitap - 1, GAME_CONFIG.multitap.values.length - 1);
    const baseTap = GAME_CONFIG.multitap.values[Math.max(0, tapLevelIndex)] || 1;
    const finalTap = baseTap * multiplier;

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (botTime > 0) {
            interval = setInterval(() => {
                setBotTime(t => { if (t <= 1) return 0; return t - 1; });
                setEnergy(currentEnergy => {
                    if (currentEnergy >= baseTap) {
                        setScore(s => s + baseTap);
                        return currentEnergy - baseTap;
                    }
                    return currentEnergy; 
                });
            }, 1000); 
        }
        return () => clearInterval(interval);
    }, [botTime, baseTap, setScore, setEnergy]);

    const handleBotClick = () => {
        if (botTime > 0) { alert(`🤖 Bot Running: ${Math.ceil(botTime/60)}m left`); return; }
        if (isPremiumBot) {
            if(window.confirm("💎 LEVEL 7: Activate 6H Bot?")) setBotTime(21600);
        } else {
            if(window.confirm("📺 Watch Ad for 10m Auto-Miner?")) {
                console.log("Ad..."); setTimeout(() => setBotTime(600), 2000);
            }
        }
    };

    const handleTap = async () => {
        if (!user || energy < finalTap) {
            if(energy < finalTap) { setMessage("Low Energy!"); setTimeout(() => setMessage(''), 1000); }
            return;
        }
        if (window.navigator.vibrate) window.navigator.vibrate(10);
        setScore(s => s + finalTap);
        setEnergy(e => Math.max(0, e - finalTap)); 
        if (turboActive) {
            document.body.style.backgroundColor = '#220011';
            setTimeout(() => document.body.style.backgroundColor = '#0B0E14', 50);
        }
        const { data } = await supabase.rpc('tap_and_earn', { user_id_in: user.id, multiplier: multiplier });
        if(data && data[0].success) setScore(data[0].new_score);
    };

    const watchVideo = useCallback((type: 'turbo' | 'refill') => {
        if(!window.confirm("📺 Watch Ad?")) return;
        setTimeout(() => {
            if (type === 'turbo') {
                setMultiplier(3); setTurboActive(true); 
                setTimeout(() => { setMultiplier(1); setTurboActive(false); }, 60000);
            } else {
                setEnergy(maxEnergy); alert("🔋 Energy Refilled");
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

    // 📉 AJUSTE FINAL: Radio de 105 a 95 (Más pequeño para juntar todo)
    const radius = 95; 
    const circumference = 2 * Math.PI * radius;
    const energyPercent = Math.min(100, Math.max(0, (energy / maxEnergy) * 100));
    const strokeDashoffset = circumference - (energyPercent / 100) * circumference;

    return (
        <div style={{ 
            display: 'flex', flexDirection: 'column', 
            // 📉 GAP MÍNIMO: De 10px a 2px para pegar todo
            justifyContent: 'center', alignItems: 'center', gap: '2px',
            // 📉 Altura ajustada
            height: 'calc(100dvh - 130px)', 
            padding: '0', maxWidth: '500px', margin: '0 auto',
            position: 'relative', overflow: 'hidden'
        }}>
            
            {/* 1. TOP SECTION (Pegado arriba con margen negativo) */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', zIndex:10, marginTop:'-20px' }}>
                <div onClick={() => setShowRanking(true)} className="glass-card" style={{ 
                    padding: '2px 10px', borderRadius:'15px', display:'flex', gap:'4px', alignItems:'center', 
                    background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.3)', cursor:'pointer',
                    marginBottom: '0px'
                }}>
                    <Trophy size={10} color="#FFD700"/>
                    <span style={{fontSize:'8px', color:'#fff', fontWeight:'bold', letterSpacing:'1px'}}>
                        {LEVEL_NAMES[Math.min(globalLevel-1, 7)].toUpperCase()}
                    </span>
                </div>
                <div className="text-gradient" style={{ fontSize: '36px', fontWeight: '900', margin: '0', lineHeight:1 }}>
                    {score.toLocaleString()}
                </div>
                <div style={{fontSize:'8px', color:'#aaa', marginTop:'0px'}}>+ {finalTap} per tap</div>
            </div>

            {/* 2. CENTRO: Anillo Reducido */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '240px', height: '240px' }}>
                <div style={{ position: 'absolute', width: '240px', height: '240px', zIndex: 0, transform: 'rotate(-90deg)' }}>
                    <svg width="240" height="240">
                        <circle cx="120" cy="120" r={radius} stroke="#333" strokeWidth="8" fill="transparent" />
                        <circle cx="120" cy="120" r={radius} stroke="#00F2FE" strokeWidth="8" fill="transparent" 
                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                        />
                    </svg>
                </div>
                <button onClick={handleTap} disabled={!user}
                    style={{
                        width: '170px', height: '170px', borderRadius: '50%', zIndex: 2, border: 'none',
                        background: turboActive ? 'radial-gradient(circle, #FF0055 0%, #550000 100%)' : 'radial-gradient(circle at 30% 30%, #00F2FE, #0072FF)',
                        boxShadow: turboActive ? '0 0 40px #FF0055' : `0 0 ${energyPercent > 20 ? '20px' : '5px'} rgba(0,242,254,0.4)`, 
                        cursor: 'pointer', transform: 'scale(1)', transition: 'transform 0.05s'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{fontSize:'24px'}}>💎</div>
                </button>
                <div style={{ position: 'absolute', top: '75%', width: '100%', textAlign:'center', height: '20px', color: '#FFD700', fontWeight: 'bold', fontSize:'10px', textShadow: '0 2px 4px #000', zIndex:5 }}>
                    {message ? message : `${Math.floor(energy)} / ${maxEnergy}`}
                </div>
            </div>

            {/* 3. BOTTOM: DOCK (Sin padding extra) */}
            <div style={{ width: '100%', padding: '0 15px', zIndex: 10, marginBottom: '0' }}>
                <div style={{ marginBottom:'2px', display:'flex', justifyContent:'center', fontSize:'8px', color:'#aaa' }}>
                    <span>+{regenRate}/s Regen</span>
                </div>

                <div className="glass-card" style={{ 
                    padding: '5px', borderRadius: '16px', background: 'rgba(20, 20, 30, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', flexDirection: 'column', gap:'4px'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
                        <DockButton icon={<Rocket/>} label="BOOST" color="#00F2FE" onClick={() => setShowBoosts(true)} />
                        <DockButton icon={<Bot/>} label={botTime>0 ? `${Math.ceil(botTime/60)}m` : "AUTO"} sub={isPremiumBot?"PRO":"AD"} color={botTime>0?"#4CAF50":"#fff"} onClick={handleBotClick} />
                        <DockButton icon={<Zap/>} label="TURBO" sub="AD" color="#FF512F" onClick={() => watchVideo('turbo')} />
                        <DockButton icon={<Video/>} label="REFILL" sub="AD" color="#4CAF50" onClick={() => watchVideo('refill')} />
                    </div>

                    <button onClick={() => setShowLucky(true)} style={{
                        width:'100%', padding:'6px', borderRadius:'10px', border:'1px solid #E040FB', 
                        background:'rgba(224, 64, 251, 0.15)', color:'#fff', cursor:'pointer',
                        display:'flex', justifyContent:'center', alignItems:'center', gap:'6px'
                    }}>
                        <Gamepad2 size={14} color="#E040FB"/> 
                        <span style={{fontSize:'9px', fontWeight:'bold'}}>LUCKY SPIN</span>
                    </button>
                </div>
            </div>

            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
            {showLucky && <LuckyWheel onClose={() => setShowLucky(false)} onUpdateScore={setScore} />}
            {showBoosts && <BoostModal onClose={() => setShowBoosts(false)} levels={levels} score={score} onBuy={buyBoost} configs={GAME_CONFIG} />}
        </div>
    );
};

const DockButton: React.FC<DockButtonProps> = ({ icon, label, sub, color, onClick }) => (
    <button onClick={onClick} style={{ 
        background: 'transparent', border: 'none', flex: 1, display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', gap: '0px', cursor: 'pointer', color: color || '#fff',
        padding: '3px 0'
    }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {React.isValidElement(icon) ? React.cloneElement(icon as ReactElement<any>, { size: 16 }) : icon}
        <span style={{ fontSize: '8px', fontWeight: 'bold', marginTop:'1px' }}>{label}</span>
        {sub && <span style={{ fontSize: '6px', background: '#333', padding: '0px 2px', borderRadius: '2px', color: '#aaa', marginTop:'1px' }}>{sub}</span>}
    </button>
);