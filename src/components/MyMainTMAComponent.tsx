import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

// ⚙️ CONFIGURACIÓN DE NIVELES (ACTUALIZADA)
const GAME_CONFIG = {
    multitap: {
        costs: [0, 300, 500, 3000, 4000],
        values: [1, 2, 3, 4, 5]
    },
    limit: {
        costs: [0, 500, 750, 1000, 1500, 2000, 3000, 4000],
        values: [500, 1000, 1500, 2000, 3000, 4000, 5500, 7500]
    },
    speed: {
        // 👇 AQUÍ ESTÁN LOS NUEVOS COSTOS
        costs: [0, 500, 1000, 3000, 5000, 7500], 
        values: [1, 2, 3, 4, 5, 6]
    }
};

export const MyMainTMAComponent: React.FC = () => {
    const { user } = useAuth();
    const [score, setScore] = useState(0);
    const [energy, setEnergy] = useState(0);
    const [levels, setLevels] = useState({ multitap: 1, limit: 1, speed: 1 });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Valores actuales basados en nivel (con fallback de seguridad)
    const currentLimitLvl = Math.max(1, Math.min(levels.limit, GAME_CONFIG.limit.values.length));
    const currentSpeedLvl = Math.max(1, Math.min(levels.speed, GAME_CONFIG.speed.values.length));
    const currentMultiLvl = Math.max(1, Math.min(levels.multitap, GAME_CONFIG.multitap.values.length));

    const maxEnergy = GAME_CONFIG.limit.values[currentLimitLvl - 1];
    const regenRate = GAME_CONFIG.speed.values[currentSpeedLvl - 1];
    const tapValue = GAME_CONFIG.multitap.values[currentMultiLvl - 1];

    // 1. Cargar datos
    useEffect(() => {
        const fetchInitialData = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('user_score')
                    .select('score, energy, multitap_level, limit_level, speed_level')
                    .eq('user_id', user.id)
                    .single();

                if (error) console.error("Error cargando:", error);

                if (data) {
                    setScore(data.score);
                    setEnergy(data.energy);
                    setLevels({
                        multitap: data.multitap_level ?? 1,
                        limit: data.limit_level ?? 1,
                        speed: data.speed_level ?? 1
                    });
                }
            }
        };
        fetchInitialData();
    }, [user]);

    // 2. Regeneración Automática Visual
    useEffect(() => {
        const timer = setInterval(() => {
            setEnergy((prev) => {
                if (prev >= maxEnergy) return prev;
                return Math.min(maxEnergy, prev + regenRate);
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [maxEnergy, regenRate]);

    // 3. Tap
    const handleTap = async () => {
        if (!user || energy < tapValue) {
            if (energy < tapValue) {
                setMessage("¡Sin energía!");
                setTimeout(() => setMessage(''), 1000);
            }
            return;
        }

        // Optimistic UI
        setScore(s => s + tapValue);
        setEnergy(e => Math.max(0, e - tapValue));

        const { data } = await supabase.rpc('tap_and_earn', { user_id_in: user.id });
        if (data && data[0] && data[0].success) {
            setScore(data[0].new_score);
        } else {
            // Revertir visualmente si hubo error de sync
            // setEnergy... (Opcional, la regeneración lo arregla)
        }
    };

    // 4. Comprar
    const buyBoost = async (type: 'multitap' | 'limit' | 'speed') => {
        if (!user || loading) return;
        setLoading(true);

        const { data, error } = await supabase.rpc('buy_boost', { user_id_in: user.id, boost_type: type });

        if (!error && data && data[0].success) {
            setScore(data[0].new_score);
            setLevels(prev => ({ ...prev, [type]: data[0].new_level }));
            alert(data[0].message);
        } else {
            alert(error ? "Error" : data[0].message);
        }
        setLoading(false);
    };

    // Helper para calcular datos del siguiente nivel
    const getNextLevelInfo = (type: 'multitap' | 'limit' | 'speed', currentLvl: number) => {
        const config = GAME_CONFIG[type];
        // Ajustamos índice (Nvl 1 es índice 0)
        const idx = currentLvl - 1;
        
        // Si ya estamos en el último elemento del array, es MAX
        const isMax = idx >= config.values.length - 1;
        
        // El costo del SIGUIENTE nivel está en el índice actual + 1 en la tabla de costos?
        // NO, en nuestra lógica: costs[1] es el costo para subir al nivel 2.
        // costs[currentLvl] es el costo para subir al nivel (currentLvl + 1).
        const nextCost = isMax ? 0 : config.costs[currentLvl]; 

        const currentVal = config.values[idx];
        const nextVal = isMax ? currentVal : config.values[idx + 1];

        return { isMax, nextCost, currentVal, nextVal };
    };

    const multiInfo = getNextLevelInfo('multitap', levels.multitap);
    const limitInfo = getNextLevelInfo('limit', levels.limit);
    const speedInfo = getNextLevelInfo('speed', levels.speed);

    return (
        <div style={{ textAlign: 'center', padding: '20px', paddingBottom: '100px', maxWidth: '500px', margin: '0 auto' }}>
            
            {/* SCORE */}
            <div style={{ marginBottom: '30px' }}>
                <p style={{ color: '#888', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Total Balance</p>
                <h1 className="text-gradient" style={{ fontSize: '48px', margin: '0', fontWeight: '900' }}>
                    💎 {score.toLocaleString()}
                </h1>
            </div>
            
            {/* TAP BUTTON */}
            <div style={{ position: 'relative', height: '260px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ 
                    position: 'absolute', width: '240px', height: '240px', 
                    background: 'radial-gradient(circle, rgba(0,242,254,0.2) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 
                }} />
                <button onClick={handleTap} disabled={!user}
                    style={{
                        width: '220px', height: '220px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)',
                        background: 'linear-gradient(180deg, #00C6FF 0%, #0072FF 100%)',
                        color: 'white', fontSize: '28px', fontWeight: 'bold', cursor: 'pointer',
                        boxShadow: '0 0 30px rgba(0, 114, 255, 0.4), inset 0 5px 15px rgba(255,255,255,0.4)',
                        position: 'relative', zIndex: 1, transition: 'transform 0.05s'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span>TAP!</span>
                        <span style={{ fontSize: '16px', opacity: 0.8 }}>+{tapValue}</span>
                    </div>
                </button>
                <div style={{ position: 'absolute', bottom: '0', height: '20px', color: '#FFD700', fontWeight: 'bold' }}>{message}</div>
            </div>

            {/* ENERGY */}
            <div className="glass-card" style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa', marginBottom: '8px', fontWeight: 'bold' }}>
                    <span>⚡ ENERGY</span>
                    <span>{Math.floor(energy)} / {maxEnergy} <span style={{color:'#4FACFE'}}>(+{regenRate}/s)</span></span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (energy/maxEnergy)*100)}%`, height: '100%', background: 'linear-gradient(90deg, #F7971E, #FFD200)', transition: 'width 0.2s linear' }} />
                </div>
            </div>

            {/* UPGRADES SHOP */}
            <div className="glass-card">
                <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', textAlign: 'left', color: '#fff' }}>
                    🚀 Boost Store
                </h3>
                
                <UpgradeRow 
                    title="👆 Multitap"
                    level={levels.multitap} 
                    desc={`+${multiInfo.currentVal} ➔ +${multiInfo.nextVal} pts`}
                    price={multiInfo.nextCost} isMax={multiInfo.isMax}
                    canAfford={score >= multiInfo.nextCost}
                    onBuy={() => buyBoost('multitap')}
                />
                <UpgradeRow 
                    title="🔋 Energy Tank"
                    level={levels.limit} 
                    desc={`${limitInfo.currentVal} ➔ ${limitInfo.nextVal} cap`}
                    price={limitInfo.nextCost} isMax={limitInfo.isMax}
                    canAfford={score >= limitInfo.nextCost}
                    onBuy={() => buyBoost('limit')}
                />
                <UpgradeRow 
                    title="⚡ Speed"
                    level={levels.speed} 
                    desc={`+${speedInfo.currentVal} ➔ +${speedInfo.nextVal} /s`}
                    price={speedInfo.nextCost} isMax={speedInfo.isMax}
                    canAfford={score >= speedInfo.nextCost}
                    onBuy={() => buyBoost('speed')}
                />
            </div>
        </div>
    );
};

// Componente Visual de Fila
interface UpgradeRowProps {
    title: string;
    level: number;
    desc: string;
    price: number;
    isMax: boolean;
    canAfford: boolean;
    onBuy: () => void;
}

const UpgradeRow: React.FC<UpgradeRowProps> = ({ title, level, desc, price, isMax, canAfford, onBuy }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
        <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', color: '#fff' }}>{title} <span style={{color: '#00F2FE', fontSize: '12px'}}>Lvl {level}</span></div>
            <div style={{ fontSize: '11px', color: '#888' }}>{desc}</div>
        </div>
        <button 
            className="btn-neon"
            onClick={onBuy}
            disabled={isMax || !canAfford}
            style={{ 
                fontSize: '12px', padding: '8px 12px', minWidth: '80px',
                background: isMax ? '#2ecc71' : (canAfford ? undefined : 'rgba(255,255,255,0.1)'), 
                color: (isMax || canAfford) ? '#000' : '#555',
                boxShadow: canAfford && !isMax ? undefined : 'none',
                cursor: (isMax || !canAfford) ? 'not-allowed' : 'pointer'
            }}
        >
            {isMax ? 'MAX' : `${price} 💎`}
        </button>
    </div>
);