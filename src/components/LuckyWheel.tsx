import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { X, Video, CircleDollarSign } from 'lucide-react'; // 1. Importamos los iconos

// 2. Definimos los tipos de datos (Adiós al error de 'any')
interface LuckyWheelProps {
    onClose: () => void;
    onUpdateScore: (newScore: number) => void;
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ onClose, onUpdateScore }) => {
    const { user } = useAuth();
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [streak, setStreak] = useState(0); // 0=Pagar, 1=Gratis, 2=Video

    useEffect(() => {
        if (user) {
            supabase.from('user_score')
                .select('lucky_streak')
                .eq('user_id', user.id)
                .single()
                .then(({ data }) => { 
                    if (data) setStreak(data.lucky_streak); 
                });
        }
    }, [user]);

    const handleSpin = async () => {
        if (!user || spinning) return;
        let isAd = false;
        
        if (streak === 2) {
             if (!window.confirm("🎁 ¿Ver video para el 3er giro GRATIS?")) return;
             await new Promise(r => setTimeout(r, 2000)); // Simular Ad
             isAd = true;
        } else if (streak === 0) {
             if (!window.confirm("💎 ¿Pagar 3,000 puntos por el Paquete de 2 Giros?")) return;
        }

        setSpinning(true); 
        setResult(null);
        
        // Animación visual de espera
        await new Promise(r => setTimeout(r, 1500)); 

        const { data, error } = await supabase.rpc('play_lucky_wheel', { 
            user_id_in: user.id, 
            is_ad_watched: isAd 
        });

        // 3. Solucionamos el error de "variable no usada" usando 'error'
        if (error) {
            console.error("Error en ruleta:", error);
            setResult("Error de conexión");
        } else if (data && data[0]) {
            const res = data[0];
            if (res.prize_type === 'error') {
                setResult(res.message);
            } else {
                setResult(res.message);
                if (res.new_score) onUpdateScore(res.new_score);
                setStreak(res.new_streak);
            }
        }
        setSpinning(false);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background:'none', border:'none', color:'#fff', cursor:'pointer'}}><X size={32}/></button>
            
            <h1 className="text-gradient" style={{ fontSize:'36px', marginBottom:'20px' }}>🎰 CASINO</h1>
            
            {/* Indicadores de Racha */}
            <div style={{ display:'flex', gap:'10px', marginBottom:'30px' }}>
                <div style={{width:15, height:15, borderRadius:'50%', background: streak>=0 ? '#E040FB' : '#333', boxShadow: streak>=0 ? '0 0 10px #E040FB' : 'none'}}></div>
                <div style={{width:15, height:15, borderRadius:'50%', background: streak>=1 ? '#E040FB' : '#333', boxShadow: streak>=1 ? '0 0 10px #E040FB' : 'none'}}></div>
                <div style={{width:15, height:15, borderRadius:'50%', background: streak===2 ? '#FFD700' : '#333', boxShadow: streak===2 ? '0 0 10px #FFD700' : 'none'}}></div>
            </div>

            {/* Rueda Visual */}
            <div style={{ 
                width: '220px', height: '220px', borderRadius: '50%', 
                border: `6px solid ${streak===2 ? '#FFD700' : '#E040FB'}`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                animation: spinning ? 'spin 0.2s linear infinite' : 'none', 
                marginBottom: 30,
                background: 'radial-gradient(circle, #222, #000)'
            }}>
                <span style={{ fontSize: '60px' }}>{streak===2 ? '🎁' : '💎'}</span>
            </div>

            {result && <div style={{fontSize:'20px', fontWeight:'bold', marginBottom:20, color:'#fff'}}>{result}</div>}

            {/* 4. Usamos los Iconos para solucionar el error de 'Defined but never used' */}
            <button className="btn-neon" onClick={handleSpin} disabled={spinning} 
                style={{ 
                    width:'240px', height:'60px', fontSize:'14px', 
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                    background: streak===2 ? 'linear-gradient(90deg, #FFD700, #FFA500)' : undefined,
                    color: 'black'
                }}>
                {spinning ? 'GIRANDO...' : (
                    streak === 0 ? <><CircleDollarSign size={20}/> COMPRAR PACK (3k)</> : 
                    (streak === 1 ? <><CircleDollarSign size={20}/> GIRO GRATIS (2/3)</> : 
                    <><Video size={20}/> VIDEO BONUS (3/3)</>)
                )}
            </button>
            
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};