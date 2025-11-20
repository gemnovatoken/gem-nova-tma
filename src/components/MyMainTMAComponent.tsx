// src/components/MyMainTMAComponent.tsx
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

    // CAMBIO AQUÍ: Base es 500 ahora
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

    // 2. ⚡ REGENERACIÓN AUTOMÁTICA (ESTO SOLUCIONA EL PROBLEMA DEL 0) ⚡
    useEffect(() => {
        const timer = setInterval(() => {
            setEnergy((prevEnergy) => {
                // Si ya está lleno, no hacemos nada
                if (prevEnergy >= maxEnergy) return prevEnergy;
                // Si no, sumamos la tasa de regeneración sin pasarnos del máximo
                return Math.min(maxEnergy, prevEnergy + regenRate);
            });
        }, 1000); // Se ejecuta cada 1000ms (1 segundo)

        // Limpieza al desmontar
        return () => clearInterval(timer);
    }, [maxEnergy, regenRate]); // Se reinicia si cambian estas variables

    // 3. Lógica del Tap
    const handleTap = async () => {
        if (!user) return;

        if (energy >= tapValue) {
            setScore(s => s + tapValue);
            setEnergy(e => Math.max(0, e - tapValue));
        } else {
            // Ahora es difícil que entres aquí porque se regenera solo, 
            // pero lo dejamos por seguridad.
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
                // Opcional: Sincronizar energía exacta del servidor
                // setEnergy(result.new_energy); 
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
        <div style={{ textAlign: 'center', padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            
            <h1 style={{ fontSize: '40px', margin: '10px 0' }}>💎 {score.toLocaleString()}</h1>
            
            <div style={{ margin: '20px 0' }}>
                <button 
                    onClick={handleTap}
                    disabled={!user}
                    style={{ 
                        width: '220px', height: '220px', borderRadius: '50%', border: 'none',
                        background: 'radial-gradient(circle at 30% 30%, #4facfe, #00f2fe)',
                        color: 'white', fontSize: '28px', fontWeight: 'bold', cursor: 'pointer',
                        boxShadow: '0 10px 25px rgba(0,100,255,0.4)',
                        transition: 'transform 0.1s',
                        // Efecto visual si no hay energía suficiente
                        opacity: energy < tapValue ? 0.5 : 1 
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    TAP! (+{tapValue})
                </button>
                <div style={{ height: '20px', color: 'orange', fontWeight: 'bold' }}>{message}</div>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#555', marginBottom: '5px' }}>
                    <span>⚡ Energía</span>
                    <span>{Math.floor(energy)} / {maxEnergy} (+{regenRate}/s)</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#ddd', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ 
                        width: `${Math.min(100, (energy / maxEnergy) * 100)}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #f1c40f, #f39c12)',
                        transition: 'width 0.2s linear'
                    }} />
                </div>
            </div>

            <div style={{ background: '#f8f9fa', borderRadius: '15px', padding: '15px', textAlign: 'left', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>🚀 Tienda de Mejoras</h3>
                
                <BoostItem 
                    title={`👆 Multitap (Nvl ${levels.multitap})`}
                    desc="+2 Puntos por click"
                    price={800}
                    isMax={levels.multitap >= 2}
                    onBuy={() => buyBoost('multitap')}
                    canAfford={score >= 800}
                />
                
                <BoostItem 
                    title={`🔋 Tanque (Nvl ${levels.limit})`}
                    desc="Límite 2500 Energía"
                    price={1000}
                    isMax={levels.limit >= 2}
                    onBuy={() => buyBoost('limit')}
                    canAfford={score >= 1000}
                />

                <BoostItem 
                    title={`⚡ Velocidad (Nvl ${levels.speed})`}
                    desc="Recarga +2/seg"
                    price={500}
                    isMax={levels.speed >= 2}
                    onBuy={() => buyBoost('speed')}
                    canAfford={score >= 500}
                />
            </div>
        </div>
    );
};

interface BoostItemProps {
  title: string;
  desc: string;
  price: number;
  isMax: boolean;
  onBuy: () => void;
  canAfford: boolean;
}

const BoostItem: React.FC<BoostItemProps> = ({ title, desc, price, isMax, onBuy, canAfford }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
            <div style={{ fontWeight: 'bold' }}>{title}</div>
            <div style={{ fontSize: '12px', color: '#777' }}>{desc}</div>
        </div>
        <button 
            onClick={onBuy}
            disabled={isMax || !canAfford}
            style={{ 
                padding: '8px 16px', 
                borderRadius: '8px', 
                border: 'none', 
                background: isMax ? '#4CAF50' : (canAfford ? '#2196F3' : '#ccc'),
                color: 'white', 
                cursor: (isMax || !canAfford) ? 'default' : 'pointer',
                fontWeight: 'bold'
            }}
        >
            {isMax ? 'MAX' : `${price} 💰`}
        </button>
    </div>
);