import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

export const MyMainTMAComponent: React.FC = () => {
    const { user } = useAuth();
    const [score, setScore] = useState(0);
    const [energy, setEnergy] = useState(0);
    const [levels, setLevels] = useState({ multitap: 1, limit: 1, speed: 1 });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const maxEnergy = levels.limit >= 2 ? 2500 : 500;
    const regenRate = levels.speed >= 2 ? 2 : 1;
    const tapValue = levels.multitap;

    // 1. Cargar datos al inicio
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
            setEnergy((prevEnergy) => {
                if (prevEnergy >= maxEnergy) return prevEnergy;
                return Math.min(maxEnergy, prevEnergy + regenRate);
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [maxEnergy, regenRate]);

    // 3. Lógica del Tap
    const handleTap = async () => {
        if (!user) return;

        if (energy >= tapValue) {
            setScore(s => s + tapValue);
            setEnergy(e => Math.max(0, e - tapValue));
        } else {
            setMessage("¡Sin energía!");
            setTimeout(() => setMessage(''), 1000);
            return;
        }

        const { data, error } = await supabase.rpc('tap_and_earn', { user_id_in: user.id });

        if (error) {
            console.error('Error Tap:', error);
        } else if (data && data[0]) {
            const result = data[0];
            if (result.success) {
                setScore(result.new_score);
            } else {
                setEnergy(result.new_energy);
                setMessage("Sincronizando...");
            }
        }
    };

    // 4. Lógica de Comprar Mejoras
    const buyBoost = async (type: 'multitap' | 'limit' | 'speed') => {
        if (!user || loading) return;
        setLoading(true);

        const { data, error } = await supabase.rpc('buy_boost', { 
            user_id_in: user.id, 
            boost_type: type 
        });

        if (error) {
            alert("Error en la compra");
        } else if (data && data[0]) {
            const result = data[0];
            if (result.success) {
                setScore(result.new_score);
                setLevels(prev => ({ ...prev, [type]: result.new_level }));
                alert(`¡${type.toUpperCase()} mejorado!`);
            } else {
                alert(result.message);
            }
        }
        setLoading(false);
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px', paddingBottom: '100px', maxWidth: '500px', margin: '0 auto' }}>
            
            {/* --- HEADER --- */}
            <div style={{ marginBottom: '30px' }}>
                <p style={{ color: '#888', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Total Balance</p>
                <h1 style={{ fontSize: '48px', margin: '0', fontWeight: '900' }}>
                    💎 {score.toLocaleString()}
                </h1>
            </div>
            
            {/* --- CIRCULO TAP --- */}
            <div style={{ position: 'relative', height: '260px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ 
                    position: 'absolute', width: '240px', height: '240px', 
                    background: 'radial-gradient(circle, rgba(0,242,254,0.2) 0%, rgba(0,0,0,0) 70%)',
                    zIndex: 0 
                }} />
                
                <button 
                    onClick={handleTap}
                    disabled={!user}
                    style={{ 
                        width: '220px', height: '220px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)',
                        background: 'linear-gradient(180deg, #00C6FF 0%, #0072FF 100%)',
                        color: 'white', fontSize: '28px', fontWeight: 'bold', cursor: 'pointer',
                        boxShadow: '0 0 30px rgba(0, 114, 255, 0.4), inset 0 5px 15px rgba(255,255,255,0.4)',
                        position: 'relative', zIndex: 1,
                        transition: 'transform 0.05s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span>TAP!</span>
                        <span style={{ fontSize: '16px', opacity: 0.8 }}>+{tapValue}</span>
                    </div>
                </button>
                
                <div style={{ position: 'absolute', bottom: '0', height: '20px', color: '#FFD700', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {message}
                </div>
            </div>

            {/* --- BARRA DE ENERGÍA --- */}
            <div className="glass-card" style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa', marginBottom: '8px', fontWeight: 'bold' }}>
                    <span>⚡ ENERGY</span>
                    <span>{Math.floor(energy)} / {maxEnergy}</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ 
                        width: `${Math.min(100, (energy / maxEnergy) * 100)}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #F7971E, #FFD200)',
                        boxShadow: '0 0 10px rgba(255, 210, 0, 0.5)',
                        transition: 'width 0.2s linear'
                    }} />
                </div>
            </div>

            {/* --- TIENDA DE MEJORAS (CORREGIDA) --- */}
            <div className="glass-card">
                <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', textAlign: 'left', color: '#fff' }}>
                    🚀 Boost Store
                </h3>
                
                <BoostItem 
                    title="👆 Multitap"
                    level={levels.multitap}
                    desc="+1 point per tap"
                    price={800}
                    isMax={levels.multitap >= 2}
                    onBuy={() => buyBoost('multitap')}
                    canAfford={score >= 800}
                />
                
                <BoostItem 
                    title="🔋 Energy Tank"
                    level={levels.limit}
                    desc="Limit 2500"
                    price={1000}
                    isMax={levels.limit >= 2}
                    onBuy={() => buyBoost('limit')}
                    canAfford={score >= 1000}
                />

                <BoostItem 
                    title="⚡ Recharging Speed"
                    level={levels.speed}
                    desc="+2 energy/sec"
                    price={500}
                    isMax={levels.speed >= 2}
                    onBuy={() => buyBoost('speed')}
                    canAfford={score >= 500}
                />
            </div>
        </div>
    );
};

// Componente Auxiliar
interface BoostItemProps {
  title: string;
  level: number;
  desc: string;
  price: number;
  isMax: boolean;
  onBuy: () => void;
  canAfford: boolean;
}

const BoostItem: React.FC<BoostItemProps> = ({ title, level, desc, price, isMax, onBuy, canAfford }) => (
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
                fontSize: '12px',
                padding: '8px 12px',
                // Fondo dinámico: Verde si es Max, Transparente si no alcanza, Neón si puede comprar
                background: isMax ? '#2ecc71' : (canAfford ? undefined : 'rgba(255,255,255,0.1)'), 
                color: (isMax || !canAfford) ? '#aaa' : '#000',
                boxShadow: canAfford && !isMax ? undefined : 'none',
                cursor: (isMax || !canAfford) ? 'not-allowed' : 'pointer'
            }}
        >
            {isMax ? 'MAX' : `${price} 💎`}
        </button>
    </div>
);