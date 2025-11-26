import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { RankingModal } from './RankingModal';
import { LuckyWheel } from './LuckyWheel';
import { BoostModal } from './BoostModal';
import { Trophy, Zap, Gamepad2, Rocket, Bot, Video } from 'lucide-react';

// ✅ CORRECCIÓN 1: Importamos los tipos con 'import type'
import type { SetStateAction, Dispatch, ReactElement } from 'react';

interface GameProps {
    score: number; setScore: Dispatch<SetStateAction<number>>;
    energy: number; setEnergy: Dispatch<SetStateAction<number>>;
    levels: { multitap: number; limit: number; speed: number }; 
    setLevels: Dispatch<SetStateAction<{ multitap: number; limit: number; speed: number }>>;
    maxEnergy: number; regenRate: number;
}

interface DockButtonProps {
    icon: React.ReactNode; 
    label: string; 
    sub?: string; 
    color?: string; 
    onClick: () => void;
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

    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const energyPercent = Math.min(100, Math.max(0, (energy / maxEnergy) * 100));
    const strokeDashoffset = circumference - (energyPercent / 100) * circumference;

    return (
        <div style={{ 
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            height: 'calc(100vh - 120px)', padding: '10px 0', maxWidth: '500px', margin: '0 auto',
            position: 'relative', overflow: 'hidden'
        }}>
            
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', zIndex:10 }}>
                <div onClick={() => setShowRanking(true)} className="glass-card" style={{ 
                    padding: '5px 15px', borderRadius:'20px', display:'flex', gap:'8px', alignItems:'center', 
                    background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.3)', cursor:'pointer'
                }}>
                    <Trophy size={14} color="#FFD700"/>
                    <span style={{fontSize:'10px', color:'#fff', fontWeight:'bold', letterSpacing:'1px'}}>
                        {LEVEL_NAMES[Math.min(globalLevel-1, 7)].toUpperCase()}
                    </span>
                </div>
                <div className="text-gradient" style={{ fontSize: '48px', fontWeight: '900', margin: '10px 0 0 0', lineHeight:1 }}>
                    {score.toLocaleString()}
                </div>
                <div style={{fontSize:'10px', color:'#aaa'}}>+ {finalTap} per tap</div>
            </div>

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <div style={{ position: 'absolute', width: '320px', height: '320px', zIndex: 0, transform: 'rotate(-90deg)' }}>
                    <svg width="320" height="320">
                        <circle cx="160" cy="160" r={radius} stroke="#333" strokeWidth="12" fill="transparent" />
                        <circle cx="160" cy="160" r={radius} stroke="#00F2FE" strokeWidth="12" fill="transparent" 
                            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                        />
                    </svg>
                </div>
                <button onClick={handleTap} disabled={!user}
                    style={{
                        width: '220px', height: '220px', borderRadius: '50%', zIndex: 2, border: 'none',
                        background: turboActive ? 'radial-gradient(circle, #FF0055 0%, #550000 100%)' : 'radial-gradient(circle at 30% 30%, #00F2FE, #0072FF)',
                        boxShadow: turboActive ? '0 0 60px #FF0055' : `0 0 ${energyPercent > 20 ? '40px' : '10px'} rgba(0,242,254,0.4)`, 
                        cursor: 'pointer', transform: 'scale(1)', transition: 'transform 0.05s'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{fontSize:'32px'}}>💎</div>
                </button>
                <div style={{ position: 'absolute', top: '65%', width: '100%', textAlign:'center', height: '20px', color: '#FFD700', fontWeight: 'bold', textShadow: '0 2px 4px #000', zIndex:5 }}>
                    {message ? message : `${Math.floor(energy)} / ${maxEnergy}`}
                </div>
            </div>

            <div style={{ padding: '0 20px', zIndex: 10 }}>
                <div style={{ marginBottom:'10px', display:'flex', justifyContent:'center', fontSize:'10px', color:'#aaa' }}>
                    <span>Energy Regeneration: +{regenRate}/s</span>
                </div>

                <div className="glass-card" style={{ 
                    padding: '10px', borderRadius: '20px', background: 'rgba(20, 20, 30, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', justifyContent: 'space-between', gap: '5px'
                }}>
                    <DockButton icon={<Rocket/>} label="BOOST" color="#00F2FE" onClick={() => setShowBoosts(true)} />
                    <DockButton icon={<Bot/>} label={botTime>0 ? `${Math.ceil(botTime/60)}m` : "AUTO"} sub={isPremiumBot?"PRO":"AD"} color={botTime>0?"#4CAF50":"#fff"} onClick={handleBotClick} />
                    <DockButton icon={<Zap/>} label="TURBO" sub="AD" color="#FF512F" onClick={() => watchVideo('turbo')} />
                    <DockButton icon={<Video/>} label="REFILL" sub="AD" color="#4CAF50" onClick={() => watchVideo('refill')} />
                    <DockButton icon={<Gamepad2/>} label="LUCKY" color="#E040FB" onClick={() => setShowLucky(true)} />
                </div>
            </div>

            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
            {showLucky && <LuckyWheel onClose={() => setShowLucky(false)} onUpdateScore={setScore} />}
            {showBoosts && <BoostModal onClose={() => setShowBoosts(false)} levels={levels} score={score} onBuy={buyBoost} configs={GAME_CONFIG} />}
        </div>
    );
};

// ✅ CORRECCIÓN 2: Casting Seguro sin 'any'
const DockButton: React.FC<DockButtonProps> = ({ icon, label, sub, color, onClick }) => (
    <button onClick={onClick} style={{ 
        background: 'transparent', border: 'none', flex: 1, display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', gap: '2px', cursor: 'pointer', color: color || '#fff'
    }}>
        {/* Usamos un tipo genérico seguro para ReactElement */}
        {React.isValidElement(icon) ? React.cloneElement(icon as ReactElement<{ size?: number | string }>, { size: 18 }) : icon}
        <span style={{ fontSize: '8px', fontWeight: 'bold', marginTop:'2px' }}>{label}</span>
        {sub && <span style={{ fontSize: '7px', background: '#333', padding: '1px 3px', borderRadius: '3px', color: '#aaa' }}>{sub}</span>}
    </button>
);