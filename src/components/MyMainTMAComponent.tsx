import React, { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { RankingModal } from './RankingModal';
import { LuckyWheel } from './LuckyWheel';
import { Trophy, Zap, Video, Gamepad2 } from 'lucide-react';
import type { SetStateAction, Dispatch } from 'react'; // Importar tipos para limpieza

// Definiciones de tipos para el estado centralizado (¡ESTO ES LA CLAVE!)
interface GameProps {
    score: number; setScore: Dispatch<SetStateAction<number>>;
    energy: number; setEnergy: Dispatch<SetStateAction<number>>;
    levels: { multitap: number; limit: number; speed: number }; 
    setLevels: Dispatch<SetStateAction<{ multitap: number; limit: number; speed: number }>>;
    maxEnergy: number; regenRate: number;
}

// Configuración HIGH STAKES (Solo para lookup de costos)
const GAME_CONFIG = {
    multitap: { costs: [5000, 25000, 100000, 500000, 1500000, 3500000, 8000000], values: [1, 2, 3, 4, 6, 8, 10, 15] },
    limit:    { costs: [5000, 25000, 100000, 500000, 1500000, 3500000, 8000000], values: [500, 1000, 1500, 2000, 4000, 6000, 8500, 12000] },
    speed:    { costs: [5000, 25000, 100000, 500000, 1000000, 2000000, 5000000], values: [1, 2, 3, 4, 5, 6, 8, 10] }
};

// 🛑 AHORA EL COMPONENTE SABE EXACTAMENTE QUÉ PROPS RECIBE 🛑
export const MyMainTMAComponent: React.FC<GameProps> = (props) => {
    const { user } = useAuth();
    const [showRanking, setShowRanking] = useState(false);
    const [showLucky, setShowLucky] = useState(false);
    const [multiplier, setMultiplier] = useState(1);
    const [turboActive, setTurboActive] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Desestructuración de props
    const { score, setScore, energy, setEnergy, levels, setLevels, maxEnergy, regenRate } = props;
    const baseTap = GAME_CONFIG.multitap.values[Math.min(levels.multitap - 1, 7)] || 1;
    const finalTap = baseTap * multiplier;

    // LÓGICA DE TAP (AHORA SEGURO)
    const handleTap = async () => {
        if (!user || energy < finalTap) {
            if(energy < finalTap) setMessage("Low Energy!");
            setTimeout(() => setMessage(''), 1000);
            return;
        }

        setScore(s => s + finalTap);
        setEnergy(e => Math.max(0, e - finalTap)); 

        if (turboActive) {
            document.body.style.backgroundColor = '#220011';
            setTimeout(() => document.body.style.backgroundColor = '#0B0E14', 100);
        }

        const { data, error } = await supabase.rpc('tap_and_earn', { user_id_in: user.id, multiplier: multiplier });
        
        if (error) {
             console.error('RPC Error:', error);
             setMessage("Sync Error. Try again!");
             return;
        }

        if(data && data[0].success) {
             setScore(data[0].new_score); 
        } else {
             setMessage(data?.[0]?.message || "Sync error!");
        }
    };

    // Lógica de Video
    const watchVideo = useCallback((type: 'turbo' | 'refill') => {
        const confirm = window.confirm("📺 Watch ad for reward?");
        if(!confirm) return;
        
        setTimeout(() => {
            if (type === 'turbo') {
                setMultiplier(3);
                setTurboActive(true);
                alert("🚀 TURBO x3 ACTIVATED (60s)");
                setTimeout(() => { setMultiplier(1); setTurboActive(false); }, 60000);
            } else {
                setEnergy(maxEnergy);
                alert("🔋 Energy Refilled");
            }
        }, 2000);
    }, [maxEnergy, setEnergy]);

    // Lógica de Comprar Mejoras
    const buyBoost = useCallback(async (type: 'multitap' | 'limit' | 'speed') => {
        if (loading) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('buy_boost', { user_id_in: user!.id, boost_type: type });
        
        if (!error && data && data[0].success) {
            setScore(data[0].new_score);
            setLevels(p => ({ ...p, [type]: data[0].new_level }));
            alert(data[0].message);
        } else {
            alert(data?.[0]?.message || "Error buying boost.");
        }
        setLoading(false);
    }, [user, setScore, setLevels, loading]);

    // Helper para obtener info del siguiente nivel
    const getNextLevelInfo = useCallback((type: 'multitap' | 'limit' | 'speed', currentLvl: number) => {
        const config = GAME_CONFIG[type];
        const idx = currentLvl - 1;
        const isMax = idx >= config.values.length - 1;
        const nextCost = isMax ? 0 : config.costs[currentLvl]; 
        const currentVal = config.values[idx];
        const nextVal = isMax ? currentVal : config.values[idx + 1];
        return { isMax, nextCost, currentVal, nextVal };
    }, []);

    const multiInfo = getNextLevelInfo('multitap', levels.multitap);
    const limitInfo = getNextLevelInfo('limit', levels.limit);
    const speedInfo = getNextLevelInfo('speed', levels.speed);


    return (
        <div style={{ textAlign: 'center', padding: '20px', paddingBottom: '120px', maxWidth: '500px', margin: '0 auto' }}>
            
            {/* RANKING BAR (Omitting for brevity) */}
            <div onClick={() => setShowRanking(true)} className="glass-card" 
                style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid #FFD700', background:'rgba(255,215,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Trophy color="#FFD700" size={20} />
                    <span style={{ fontWeight: 'bold', color: '#fff', fontSize:'14px' }}>Ranking Global</span>
                </div>
                <span style={{ fontSize: '12px', color: '#aaa' }}>Ver Top 50 &gt;</span>
            </div>

            <h1 className="text-gradient" style={{ fontSize: '48px', margin: '15px 0' }}>💎 {score.toLocaleString()}</h1>

            {/* CIRCLE (Omitting for brevity) */}
            <div style={{ margin: '20px 0', position: 'relative' }}>
                <button onClick={handleTap} disabled={!user}
                    style={{
                        width: '240px', height: '240px', borderRadius: '50%', 
                        border: turboActive ? '6px solid #FF0055' : '6px solid rgba(255,255,255,0.05)',
                        background: turboActive ? 'radial-gradient(circle, #FF0055 0%, #550000 100%)' : 'radial-gradient(circle, #00F2FE 0%, #4FACFE 100%)',
                        boxShadow: turboActive ? '0 0 60px #FF0055' : '0 0 40px rgba(0,242,254,0.4)', 
                        color: 'white', fontSize: '32px', fontWeight: 'bold', cursor: 'pointer', 
                        transform: 'scale(1)', transition: 'all 0.1s'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    TAP!
                    <div style={{ fontSize: '16px', opacity: 0.8 }}>+{finalTap}</div>
                </button>
                <div style={{ position: 'absolute', bottom: -30, left:0, right:0, height: '20px', color: '#FFD700', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {message}
                </div>
            </div>

            {/* ENERGY */}
            <div className="glass-card" style={{ padding: '10px', marginBottom:'15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa' }}>
                    <span>⚡ Energy</span>
                    <span>{Math.floor(energy)} / {maxEnergy} <span style={{color:'#4FACFE'}}>(+{regenRate}/s)</span></span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '4px', marginTop: '5px' }}>
                    <div style={{ width: `${Math.min(100, (energy/maxEnergy)*100)}%`, height: '100%', background: '#FFD700', borderRadius: '4px' }} />
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <ActionButton icon={<Zap color="#FF0055"/>} title="TURBO x3" sub="Video" color="#FF0055" onClick={() => watchVideo('turbo')} />
                <ActionButton icon={<Video color="#4CAF50"/>} title="REFILL" sub="Video" color="#4CAF50" onClick={() => watchVideo('refill')} />
                <ActionButton icon={<Gamepad2 color="#E040FB"/>} title="LUCKY?" sub="Casino" color="#E040FB" onClick={() => setShowLucky(true)} />
            </div>

            {/* SHOP - FIXING THE UNUSED VARIABLE WARNINGS HERE */}
            <div className="glass-card">
                <h3 style={{margin:'0 0 15px 0', textAlign:'left'}}>🚀 Upgrades</h3>
                
                {/* MULTITAP - USES multiInfo */}
                <BoostItem 
                    title="👆 Multitap" level={levels.multitap} 
                    desc={`+${multiInfo.currentVal} ➔ +${multiInfo.nextVal} pts`} 
                    price={multiInfo.nextCost} 
                    isMax={multiInfo.isMax} 
                    canAfford={score >= multiInfo.nextCost}
                    onBuy={()=>buyBoost('multitap')} 
                />
                
                {/* ENERGY TANK - USES limitInfo (FIXES THE REPORTED ERROR) */}
                <BoostItem 
                    title="🔋 Tank" level={levels.limit} 
                    desc={`${limitInfo.currentVal} ➔ ${limitInfo.nextVal} Energy Cap`} 
                    price={limitInfo.nextCost} 
                    isMax={limitInfo.isMax} 
                    canAfford={score >= limitInfo.nextCost}
                    onBuy={()=>buyBoost('limit')} 
                />
                
                {/* SPEED - USES speedInfo */}
                <BoostItem 
                    title="⚡ Speed" level={levels.speed} 
                    desc={`+${speedInfo.currentVal} ➔ +${speedInfo.nextVal} /s Regen`} 
                    price={speedInfo.nextCost} 
                    isMax={speedInfo.isMax} 
                    canAfford={score >= speedInfo.nextCost}
                    onBuy={()=>buyBoost('speed')} 
                />
            </div>

            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
            {showLucky && <LuckyWheel onClose={() => setShowLucky(false)} onUpdateScore={setScore} />}
        </div>
    );
};

// --- COMPONENTES AUXILIARES CON TIPOS ---

interface ActionButtonProps {
    icon: React.ReactNode;
    title: string;
    sub: string;
    color: string;
    onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({icon, title, sub, color, onClick}) => (
    <button onClick={onClick} className="glass-card" style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: `1px solid ${color}`, margin:0, borderRadius:'12px', cursor:'pointer' }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{title}</span>
        <span style={{ fontSize: '9px', background: color, padding: '2px 6px', borderRadius: '4px', color:'black' }}>{sub}</span>
    </button>
);

interface BoostItemProps {
    title: string;
    level: number;
    desc: string;
    price: number;
    isMax: boolean;
    canAfford: boolean;
    onBuy: () => void;
}

const BoostItem: React.FC<BoostItemProps> = ({ title, level, desc, price, isMax, canAfford, onBuy }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
        <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold' }}>{title} <span style={{color: '#00F2FE', fontSize: '10px'}}>Lvl {level}</span></div>
            <div style={{ fontSize: '10px', color: '#888' }}>{desc}</div>
        </div>
        <button 
            className="btn-neon" 
            onClick={onBuy} 
            disabled={isMax || !canAfford} 
            style={{ 
                fontSize: '10px', padding: '6px 10px', 
                opacity: (isMax || !canAfford) ? 0.5 : 1,
                cursor: (isMax || !canAfford) ? 'not-allowed' : 'pointer',
                background: isMax ? '#2ecc71' : (canAfford ? undefined : '#333')
            }}
        >
            {isMax ? 'MAX' : `${price} 💎`}
        </button>
    </div>
);