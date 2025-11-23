import React, { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { RankingModal } from './RankingModal';
import { LuckyWheel } from './LuckyWheel';
import { BoostModal } from './BoostModal';
import { Trophy, Zap, Video, Gamepad2, Rocket } from 'lucide-react';
import type { SetStateAction, Dispatch } from 'react';

// Definimos la interfaz para las props principales
interface GameProps {
    score: number; setScore: Dispatch<SetStateAction<number>>;
    energy: number; setEnergy: Dispatch<SetStateAction<number>>;
    levels: { multitap: number; limit: number; speed: number }; 
    setLevels: Dispatch<SetStateAction<{ multitap: number; limit: number; speed: number }>>;
    maxEnergy: number; regenRate: number;
}

// Definimos la interfaz para el ActionButton (SOLUCIÓN AL ERROR)
interface ActionButtonProps {
    icon: React.ReactNode; // ReactNode permite pasar componentes como <Zap />
    title: string;
    onClick: () => void;
}

// Configuración del Juego
const GAME_CONFIG = {
    multitap: { costs: [5000, 25000, 100000, 500000, 1500000, 3500000, 8000000], values: [1, 2, 3, 4, 6, 8, 10, 15] },
    limit:    { costs: [5000, 25000, 100000, 500000, 1500000, 3500000, 8000000], values: [500, 1000, 1500, 2000, 4000, 6000, 8500, 12000] },
    speed:    { costs: [5000, 25000, 100000, 500000, 1000000, 2000000, 5000000], values: [1, 2, 3, 4, 5, 6, 8, 10] }
};

export const MyMainTMAComponent: React.FC<GameProps> = (props) => {
    const { user } = useAuth();
    const [showRanking, setShowRanking] = useState(false);
    const [showLucky, setShowLucky] = useState(false);
    const [showBoosts, setShowBoosts] = useState(false);
    const [multiplier, setMultiplier] = useState(1);
    const [turboActive, setTurboActive] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { score, setScore, energy, setEnergy, levels, setLevels, maxEnergy, regenRate } = props;
    
    // Corrección de seguridad: Aseguramos que el índice exista
    const tapLevelIndex = Math.min(levels.multitap - 1, GAME_CONFIG.multitap.values.length - 1);
    const baseTap = GAME_CONFIG.multitap.values[Math.max(0, tapLevelIndex)] || 1;
    const finalTap = baseTap * multiplier;

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
        const { data } = await supabase.rpc('tap_and_earn', { user_id_in: user.id, multiplier: multiplier });
        if(data && data[0].success) setScore(data[0].new_score);
    };

    const watchVideo = useCallback((type: 'turbo' | 'refill') => {
        const confirm = window.confirm("📺 Watch ad for reward?");
        if(!confirm) return;
        setTimeout(() => {
            if (type === 'turbo') {
                setMultiplier(3); setTurboActive(true);
                alert("🚀 TURBO x3 ACTIVATED (60s)");
                setTimeout(() => { setMultiplier(1); setTurboActive(false); }, 60000);
            } else {
                setEnergy(maxEnergy);
                alert("🔋 Energy Refilled");
            }
        }, 2000);
    }, [maxEnergy, setEnergy]);

    const buyBoost = useCallback(async (type: 'multitap' | 'limit' | 'speed') => {
        if (loading) return;
        setLoading(true);
        
        // Nota: user!.id asume que el usuario existe. Es mejor protegerlo con if (!user) return;
        if (!user) { setLoading(false); return; }

        const { data, error } = await supabase.rpc('buy_boost', { user_id_in: user.id, boost_type: type });
        if (!error && data && data[0].success) {
            setScore(data[0].new_score);
            setLevels(p => ({ ...p, [type]: data[0].new_level }));
            alert(data[0].message);
        } else {
            alert(data?.[0]?.message || "Error buying boost.");
        }
        setLoading(false);
    }, [user, setScore, setLevels, loading]);

    return (
        <div style={{ 
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            height: 'calc(100vh - 160px)', 
            padding: '10px 20px', maxWidth: '500px', margin: '0 auto' 
        }}>
            
            {/* 1. TOP SECTION: Ranking & Score */}
            <div>
                <div onClick={() => setShowRanking(true)} className="glass-card" 
                    style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap:'10px', cursor: 'pointer', border: '1px solid rgba(255,215,0,0.3)', background:'rgba(255,215,0,0.05)', marginBottom:'10px' }}>
                    <Trophy color="#FFD700" size={16} />
                    <span style={{ fontWeight: 'bold', color: '#fff', fontSize:'12px' }}>Global Rank</span>
                </div>

                <div style={{textAlign:'center'}}>
                    <h1 className="text-gradient" style={{ fontSize: '42px', margin: '0', fontWeight: '900', lineHeight:'1' }}>
                        💎 {score.toLocaleString()}
                    </h1>
                    <p style={{color:'#666', fontSize:'10px', margin:'5px 0'}}>LEVEL {Math.min(levels.multitap, levels.limit, levels.speed)} MINER</p>
                </div>
            </div>

            {/* 2. CENTER: Tap Circle */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <button onClick={handleTap} disabled={!user}
                    style={{
                        width: '260px', height: '260px', borderRadius: '50%', 
                        border: turboActive ? '6px solid #FF0055' : '6px solid rgba(255,255,255,0.05)',
                        background: turboActive ? 'radial-gradient(circle, #FF0055 0%, #550000 100%)' : 'radial-gradient(circle, #00F2FE 0%, #4FACFE 100%)',
                        boxShadow: turboActive ? '0 0 60px #FF0055' : '0 0 50px rgba(0,242,254,0.3)', 
                        color: 'white', fontSize: '32px', fontWeight: 'bold', cursor: 'pointer', 
                        transform: 'scale(1)', transition: 'all 0.1s'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    TAP!
                    <div style={{ fontSize: '16px', opacity: 0.8 }}>+{finalTap}</div>
                </button>
                <div style={{ position: 'absolute', bottom: '10%', left:0, right:0, textAlign:'center', height: '20px', color: '#FFD700', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {message}
                </div>
            </div>

            {/* 3. BOTTOM: Energy & Tools */}
            <div>
                {/* Energy Bar */}
                <div style={{ marginBottom:'15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa', marginBottom:'5px' }}>
                        <span>⚡ {Math.floor(energy)} / {maxEnergy}</span>
                        <span>+{regenRate}/s</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#333', borderRadius: '5px', overflow:'hidden' }}>
                        <div style={{ width: `${Math.min(100, (energy/maxEnergy)*100)}%`, height: '100%', background: '#FFD700', transition: 'width 0.2s linear' }} />
                    </div>
                </div>

                {/* Tool Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                    {/* Boost Store Button */}
                    <button onClick={() => setShowBoosts(true)} className="glass-card" style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: '1px solid #00F2FE', margin:0, borderRadius:'12px' }}>
                        <Rocket color="#00F2FE" size={20} />
                        <span style={{ fontSize: '9px', fontWeight: 'bold' }}>BOOST</span>
                    </button>

                    <ActionButton icon={<Zap color="#FF0055" size={20}/>} title="TURBO" onClick={() => watchVideo('turbo')} />
                    <ActionButton icon={<Video color="#4CAF50" size={20}/>} title="REFILL" onClick={() => watchVideo('refill')} />
                    <ActionButton icon={<Gamepad2 color="#E040FB" size={20}/>} title="LUCKY" onClick={() => setShowLucky(true)} />
                </div>
            </div>

            {/* MODALES */}
            {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
            {showLucky && <LuckyWheel onClose={() => setShowLucky(false)} onUpdateScore={setScore} />}
            
            {showBoosts && (
                <BoostModal 
                    onClose={() => setShowBoosts(false)} 
                    levels={levels} 
                    score={score} 
                    onBuy={buyBoost} 
                    configs={GAME_CONFIG} 
                />
            )}
        </div>
    );
};

// --- CORRECCIÓN APLICADA AQUÍ ---
// Usamos React.FC<ActionButtonProps> para que TypeScript sepa qué props recibe
const ActionButton: React.FC<ActionButtonProps> = ({icon, title, onClick}) => (
    <button onClick={onClick} className="glass-card" style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', margin:0, borderRadius:'12px', cursor:'pointer' }}>
        {icon}
        <span style={{ fontSize: '9px', fontWeight: 'bold', color:'#aaa' }}>{title}</span>
    </button>
);