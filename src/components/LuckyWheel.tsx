import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { X, Video, CircleDollarSign, Sparkles } from 'lucide-react';

// Interfaz para el componente principal
interface LuckyWheelProps {
    onClose: () => void;
    onUpdateScore: (newScore: number) => void;
}

// Interfaz para el resultado del giro
interface SpinResult {
    msg: string;
    type: string;
    amount?: number;
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ onClose, onUpdateScore }) => {
    const { user } = useAuth();
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<SpinResult | null>(null);
    const [streak, setStreak] = useState(0);
    const [displayEmoji, setDisplayEmoji] = useState('🎰');

    const rouletteItems = ['💎', '💰', '💵', '🪙', '😢', '🚀'];

    useEffect(() => {
        if (user) {
            supabase.from('user_score').select('lucky_streak').eq('user_id', user.id).single()
                .then(({ data }) => { if (data) setStreak(data.lucky_streak); });
        }
    }, [user]);

    const handleSpin = async () => {
        if (!user || spinning) return;
        let isAd = false;
        
        if (streak === 2) {
             if (!window.confirm("🎁 ¿Ver video para el 3er giro GRATIS?")) return;
             await new Promise(r => setTimeout(r, 2000)); 
             isAd = true;
        } else if (streak === 0) {
             if (!window.confirm("💎 ¿Pagar 3,000 pts por el Paquete de 2 Giros?")) return;
        }

        setSpinning(true); 
        setResult(null);
        
        const interval = setInterval(() => {
            setDisplayEmoji(rouletteItems[Math.floor(Math.random() * rouletteItems.length)]);
        }, 80);

        const { data, error } = await supabase.rpc('play_lucky_wheel', { 
            user_id_in: user.id, 
            is_ad_watched: isAd 
        });

        setTimeout(() => {
            clearInterval(interval);
            
            if (error) {
                console.error(error);
                setResult({ msg: "Error de conexión", type: 'error' });
                setSpinning(false);
                return;
            }

            if (data && data[0]) {
                const res = data[0];
                if (res.prize_type === 'error') {
                    setResult({ msg: res.message, type: 'error' });
                    setDisplayEmoji('❌');
                } else {
                    let finalEmoji = '❓';
                    if (res.prize_type === 'jackpot') finalEmoji = '💎';
                    else if (res.prize_type === 'big') finalEmoji = '💰';
                    else if (res.prize_type === 'medium') finalEmoji = '💵';
                    else if (res.prize_type === 'small') finalEmoji = '🪙';
                    else if (res.prize_type === 'loss') finalEmoji = '😢';
                    
                    setDisplayEmoji(finalEmoji);
                    setResult({ msg: res.message, type: res.prize_type });
                    
                    if (res.new_score) onUpdateScore(res.new_score);
                    setStreak(res.new_streak);
                }
            }
            setSpinning(false);
        }, 2000);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background:'none', border:'none', color:'#fff', cursor:'pointer'}}><X size={32}/></button>
            
            <h1 className="text-gradient" style={{ fontSize:'36px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}>
                <Sparkles color="#FFD700"/> LUCKY SPIN
            </h1>
            
            <div style={{display:'flex', gap:'5px', marginBottom:'20px', fontSize:'10px', color:'#aaa'}}>
                <span style={{color:'#FFD700'}}>💎 100k</span> • 
                <span style={{color:'#4CAF50'}}>💰 50k</span> • 
                <span style={{color:'#fff'}}>💵 1.5k</span> • 
                <span style={{color:'#aaa'}}>🪙 500</span>
            </div>

            <div style={{ display:'flex', gap:'10px', marginBottom:'30px' }}>
                <StepDot active={streak >= 0} label="3k" />
                <StepDot active={streak >= 1} label="FREE" />
                <StepDot active={streak === 2} label="VIDEO" isSpecial />
            </div>

            <div style={{ 
                width: '220px', height: '220px', borderRadius: '50%', 
                border: `8px solid ${result?.type === 'jackpot' ? '#FFD700' : (result?.type === 'loss' ? '#555' : '#E040FB')}`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                marginBottom: 30,
                background: 'radial-gradient(circle, #2a0a2e, #000)',
                boxShadow: spinning ? '0 0 50px #E040FB' : (result?.type === 'jackpot' ? '0 0 80px #FFD700' : 'none'),
                transform: spinning ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s'
            }}>
                <span style={{ fontSize: '80px' }}>{displayEmoji}</span>
            </div>

            {result && <div style={{
                fontSize:'24px', fontWeight:'bold', marginBottom:20, 
                color: result.type === 'loss' ? '#FF5252' : (result.type === 'jackpot' ? '#FFD700' : '#4CAF50'),
                textShadow: '0 0 10px currentColor'
            }}>{result.msg}</div>}

            <button className="btn-neon" onClick={handleSpin} disabled={spinning} 
                style={{ 
                    width:'260px', height:'60px', fontSize:'16px', 
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                    background: streak===2 ? 'linear-gradient(90deg, #FFD700, #FFA500)' : undefined,
                    color: 'black',
                    opacity: spinning ? 0.5 : 1
                }}>
                {spinning ? 'GIRANDO...' : (
                    streak === 0 ? <><CircleDollarSign size={20}/> START PACK (3,000)</> : 
                    (streak === 1 ? <><CircleDollarSign size={20}/> FREE SPIN (2/3)</> : 
                    <><Video size={20}/> VIDEO SPIN (3/3)</>)
                )}
            </button>
        </div>
    );
};

// 👇 AQUÍ ESTABA EL ERROR: Definimos la interfaz para las props de las bolitas
interface StepDotProps {
    active: boolean;
    label: string;
    isSpecial?: boolean;
}

const StepDot: React.FC<StepDotProps> = ({ active, label, isSpecial }) => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
        <div style={{ 
            width:'16px', height:'16px', borderRadius:'50%', 
            background: active ? (isSpecial ? '#FFD700' : '#E040FB') : '#333',
            boxShadow: active ? '0 0 10px currentColor' : 'none',
            transition: 'all 0.3s'
        }}/>
        <span style={{ fontSize:'10px', color: active ? '#fff' : '#666' }}>{label}</span>
    </div>
);