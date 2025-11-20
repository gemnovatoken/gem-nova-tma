import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { X, Video, CircleDollarSign, Sparkles } from 'lucide-react';

// 1. Molde para las propiedades del componente
interface LuckyWheelProps {
    onClose: () => void;
    onUpdateScore: (newScore: number) => void;
}

// 2. Molde para la respuesta del giro (RPC)
interface SpinResult {
    prize_type: string;
    message: string;
    new_score?: number;
    new_streak: number;
}

// 3. Molde para la respuesta de la racha (DB)
interface StreakData {
    lucky_streak: number;
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ onClose, onUpdateScore }) => {
    const { user } = useAuth();
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<{ msg: string, type: string } | null>(null);
    const [streak, setStreak] = useState(0);

    const items = ['💰', '🚀', '💎', '⚡', '💩', '🎟️'];
    const [displayEmoji, setDisplayEmoji] = useState('🎰');

    useEffect(() => {
        if (user) {
            supabase.from('user_score')
                .select('lucky_streak')
                .eq('user_id', user.id)
                .single()
                // AQUÍ EL CAMBIO: En lugar de 'any', usamos 'StreakData'
                .then(({ data }) => { 
                    if (data) {
                        // Forzamos el tipo aquí para que TS no se queje
                        setStreak((data as StreakData).lucky_streak); 
                    }
                });
        }
    }, [user]);

    const handleSpin = async () => {
        if (!user || spinning) return;
        let isAd = false;

        if (streak === 2) {
            // Nota: window.confirm a veces requiere 'window.' explícito en TS
            if (!window.confirm("🎁 ¿Ver video para el 3er giro GRATIS?")) return;
            await new Promise(r => setTimeout(r, 2000)); 
            isAd = true;
        } else if (streak === 0) {
            if (!window.confirm("💎 ¿Pagar 3,000 pts por 2 Giros?")) return;
        }

        setSpinning(true);
        setResult(null);

        const interval = setInterval(() => {
            setDisplayEmoji(items[Math.floor(Math.random() * items.length)]);
        }, 100);

        // AQUÍ EL CAMBIO: Quitamos la variable 'error' para que no diga "unused variable"
        const { data } = await supabase.rpc('play_lucky_wheel', { user_id_in: user.id, is_ad_watched: isAd });

        clearInterval(interval); 

        if (data && data[0]) {
            // AQUÍ EL CAMBIO: En lugar de 'any', usamos 'SpinResult'
            const res = data[0] as SpinResult;
            
            if (res.prize_type === 'error') {
                setResult({ msg: res.message, type: 'error' });
                setDisplayEmoji('❌');
            } else {
                let finalEmoji = '💰';
                if(res.prize_type === 'loss') finalEmoji = '💩';
                if(res.prize_type === 'jackpot') finalEmoji = '💎';
                if(res.prize_type === 'ticket') finalEmoji = '🎟️';
                
                setDisplayEmoji(finalEmoji);
                setResult({ msg: res.message, type: 'success' });
                
                // TS ya sabe que new_score es opcional (number | undefined)
                if (res.new_score !== undefined) onUpdateScore(res.new_score);
                setStreak(res.new_streak);
            }
        } else {
            setResult({ msg: "Error de conexión", type: 'error' });
        }
        setSpinning(false);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#fff' }}><X size={32} /></button>

            <h1 className="text-gradient" style={{ fontSize: '40px', marginBottom: '10px', display:'flex', alignItems:'center', gap:'10px' }}>
                <Sparkles color="#FFD700" /> LUCKY?
            </h1>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
                {[0, 1, 2].map(step => (
                    <div key={step} style={{
                        width: '40px', height: '6px', borderRadius: '4px',
                        background: streak > step ? '#4CAF50' : (streak === step ? '#E040FB' : '#333'),
                        boxShadow: streak === step ? '0 0 10px #E040FB' : 'none'
                    }} />
                ))}
            </div>

            <div style={{
                width: '200px', height: '200px', borderRadius: '50%',
                border: `8px solid ${result?.type === 'success' ? '#4CAF50' : '#E040FB'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '30px',
                background: 'radial-gradient(circle, #2a0a2e, #000)',
                boxShadow: spinning ? '0 0 50px #E040FB' : '0 0 20px rgba(224, 64, 251, 0.3)',
                transform: spinning ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s'
            }}>
                <span style={{ fontSize: '80px' }}>{displayEmoji}</span>
            </div>

            {result && (
                <div style={{ 
                    fontSize: '24px', fontWeight: 'bold', marginBottom: '30px', 
                    color: result.type === 'success' ? '#4CAF50' : '#FF5252',
                    textShadow: '0 0 10px currentColor'
                }}>
                    {result.msg}
                </div>
            )}

            <button className="btn-neon" onClick={handleSpin} disabled={spinning}
                style={{ width: '260px', height: '60px', fontSize: '16px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                {spinning ? 'ROLLING...' : (
                    streak === 2 ? <><Video /> FREE SPIN (Ad)</> : <><CircleDollarSign /> SPIN (Cost: 1.5k)</>
                )}
            </button>
        </div>
    );
};