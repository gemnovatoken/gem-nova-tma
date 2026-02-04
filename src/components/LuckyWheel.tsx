import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { X, Zap, Video, Gift } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

interface LuckyWheelProps {
    onClose: () => void;
    onUpdateScore: Dispatch<SetStateAction<number>>;
}

// ✅ NUEVA INTERFAZ PARA SOLUCIONAR EL ERROR DE TIPO
interface AdResponse {
    success: boolean;
    progress: number;
    rewarded: boolean;
}

// 1. CONFIGURACIÓN CENTRALIZADA
const WHEEL_ITEMS = [
    { value: 5000, label: "5K", sub: "JACKPOT", color: "#FFD700", textCol: "#000" }, 
    { value: 500,  label: "500", sub: "",        color: "#222",    textCol: "#fff" }, 
    { value: 2000, label: "2K",  sub: "",        color: "#00F2FE", textCol: "#000" }, 
    { value: 0,    label: "FAIL",sub: "",        color: "#FF512F", textCol: "#fff" }, 
    { value: 1000, label: "1K",  sub: "",        color: "#E040FB", textCol: "#000" }  
];

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ onClose, onUpdateScore }) => {
    const { user } = useAuth();
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [spinsUsed, setSpinsUsed] = useState(0);
    const maxSpins = 7; 
    const freeSpins = 2; 

    useEffect(() => {
        if (user) {
            const loadData = async () => {
                const { data } = await supabase.from('user_score').select('spins_used_today, last_free_spin').eq('user_id', user.id).single();
                if (data) {
                    const today = new Date().toISOString().split('T')[0];
                    setSpinsUsed(data.last_free_spin === today ? data.spins_used_today : 0);
                }
            };
            loadData();
        }
    }, [user]);

    const handleSpin = async () => {
        if (spinning || spinsUsed >= maxSpins || !user) return;

        const isFree = spinsUsed < freeSpins;

        // --- LÓGICA DE VIDEO PUBLICITARIO ---
        if (!isFree) {
            if(!window.confirm(`📺 Watch Ad to Spin? (${maxSpins - spinsUsed} left)`)) return;
            
            console.log("Watching Ad...");
            // Simulación del video
            await new Promise(r => setTimeout(r, 2000));

            // 🔥 INTEGRACIÓN TICKET EMPIRE: REGISTRAR VISTA DE VIDEO 🔥
            try {
                const { data: adResult, error: adError } = await supabase.rpc('register_ad_view', { p_user_id: user.id });
                
                // ✅ SOLUCIÓN DEL ERROR: Usamos la interfaz 'AdResponse' en lugar de 'any'
                const result = adResult as AdResponse;

                if (!adError && result?.rewarded) {
                    // console.log("Ticket ganado por ver video en Ruleta!");
                }
            } catch (err) {
                console.error("Error registrando video para tickets:", err);
            }
        }

        setSpinning(true);

        // A. LLAMADA A SUPABASE (Girar Ruleta)
        const { data, error } = await supabase.rpc('spin_wheel_v2', { user_id_in: user.id });

        if (error || !data || data.length === 0) {
            alert("Error spinning. Try again.");
            setSpinning(false);
            return;
        }

        const wonAmount = data[0].reward;
        const newSpins = data[0].new_spins_used;

        // B. CÁLCULO MATEMÁTICO
        const winningIndex = WHEEL_ITEMS.findIndex(item => item.value === wonAmount);
        const targetIndex = winningIndex !== -1 ? winningIndex : 3; 

        const segmentAngle = 360 / WHEEL_ITEMS.length; 
        const centerOffset = segmentAngle / 2;
        const baseRotation = 360 - (targetIndex * segmentAngle) - centerOffset;
        const randomWobble = Math.floor(Math.random() * 40) - 20;
        const finalRotation = rotation + 1800 + baseRotation + randomWobble;

        setRotation(finalRotation);

        setTimeout(() => {
            setSpinning(false);
            setSpinsUsed(newSpins);
            
            if (wonAmount > 0) {
                onUpdateScore(s => s + wonAmount);
                if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
                alert(`🎉 JACKPOT! +${wonAmount.toLocaleString()} Pts!`);
            } else {
                if (window.navigator.vibrate) window.navigator.vibrate(200);
                alert("💀 Missed! Try again!");
            }
        }, 4000);
    };

    const isFreeNext = spinsUsed < freeSpins;
    const isLimitReached = spinsUsed >= maxSpins;

    const conicGradient = `conic-gradient(
        ${WHEEL_ITEMS.map((item, i) => `${item.color} ${i * 72}deg ${(i + 1) * 72}deg`).join(', ')}
    )`;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 5, 10, 0.98)', zIndex: 6000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)'
        }}>
            
            <div style={{textAlign:'center', marginBottom:'30px', position:'relative'}}>
                <div style={{position:'absolute', top:'-20px', left:'50%', transform:'translateX(-50%)', width:'150px', height:'150px', background:'radial-gradient(circle, rgba(224,64,251,0.4) 0%, transparent 70%)', zIndex:-1}}></div>
                <h2 style={{
                    color:'#fff', textShadow:'0 0 20px #E040FB, 0 0 40px #E040FB', 
                    fontSize:'36px', margin:0, fontWeight:'900', letterSpacing:'2px', fontStyle:'italic'
                }}>
                    NEON SPIN
                </h2>
                
                <div style={{display:'flex', gap:'5px', justifyContent:'center', marginTop:'10px'}}>
                    {[...Array(maxSpins)].map((_, i) => (
                        <div key={i} style={{
                            width:'8px', height:'8px', borderRadius:'50%',
                            background: i < spinsUsed ? '#333' : (i < freeSpins ? '#4CAF50' : '#E040FB'),
                            boxShadow: i >= spinsUsed ? (i < freeSpins ? '0 0 5px #4CAF50' : '0 0 5px #E040FB') : 'none',
                            border: '1px solid #333'
                        }} />
                    ))}
                </div>
            </div>

            <div style={{ position: 'relative', width: '320px', height: '320px', marginBottom: '40px' }}>
                
                <div style={{
                    position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)',
                    width: '40px', height: '40px', background: '#fff', clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                    zIndex: 20, filter: 'drop-shadow(0 0 10px #fff)'
                }}></div>

                <div style={{
                    position:'absolute', top:'-10px', left:'-10px', right:'-10px', bottom:'-10px',
                    borderRadius:'50%', border:'2px dashed rgba(255,255,255,0.3)',
                    animation: 'spinSlow 10s linear infinite'
                }}></div>

                <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    border: '8px solid #1a1a1a', 
                    boxShadow: '0 0 50px rgba(224, 64, 251, 0.2), inset 0 0 30px rgba(0,0,0,0.5)',
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 4s cubic-bezier(0.1, 0, 0.2, 1)',
                    background: conicGradient,
                    position: 'relative'
                }}>
                    {WHEEL_ITEMS.map((item, i) => (
                        <WheelLabel 
                            key={i}
                            text={item.label} 
                            sub={item.sub} 
                            angle={(i * 72) + 36} 
                            color={item.textCol} 
                        />
                    ))}
                </div>

                <div style={{
                    position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
                    width:'70px', height:'70px', background:'#111', borderRadius:'50%',
                    border:'4px solid #E040FB', display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: '0 0 30px #E040FB'
                }}>
                    <Zap size={30} color="#fff" fill="#E040FB" />
                </div>
            </div>

            <button 
                className="btn-neon"
                disabled={spinning || isLimitReached}
                onClick={handleSpin}
                style={{
                    width: '85%', padding: '18px', fontSize: '18px', 
                    background: isLimitReached ? '#333' : (isFreeNext ? '#4CAF50' : '#E040FB'), 
                    color: '#fff', border: 'none', fontWeight:'900', borderRadius:'12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    boxShadow: isLimitReached ? 'none' : (isFreeNext ? '0 0 20px rgba(76, 175, 80, 0.4)' : '0 0 20px rgba(224, 64, 251, 0.4)'),
                    transform: spinning ? 'scale(0.95)' : 'scale(1)', transition: 'all 0.2s'
                }}
            >
                {isLimitReached ? (
                    "COME BACK TOMORROW"
                ) : (
                    spinning ? "ROLLING..." : (
                        isFreeNext ? <><Gift /> FREE SPIN ({freeSpins - spinsUsed} LEFT)</> : <><Video /> WATCH AD TO SPIN</>
                    )
                )}
            </button>
            
            <div style={{marginTop:'20px', display:'flex', gap:'20px', fontSize:'10px', color:'#888'}}>
                <div style={{display:'flex', alignItems:'center', gap:'5px'}}><div style={{width:6, height:6, borderRadius:'50%', background:'#4CAF50'}}></div> Free Spins</div>
                <div style={{display:'flex', alignItems:'center', gap:'5px'}}><div style={{width:6, height:6, borderRadius:'50%', background:'#E040FB'}}></div> Ad Spins</div>
            </div>

            <button onClick={onClose} style={{
                position:'absolute', top:20, right:20, background:'none', border:'none', color:'#fff', cursor:'pointer'
            }}><X size={32}/></button>

            <style>{`@keyframes spinSlow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const WheelLabel = ({ text, sub, angle, color }: { text: string, sub?: string, angle: number, color: string }) => (
    <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-110px)`,
        color: color, textAlign: 'center', width: '100px'
    }}>
        <div style={{fontWeight:'900', fontSize:'20px', textShadow:'0 1px 2px rgba(0,0,0,0.3)', transform: `rotate(${-angle}deg)`}}>{text}</div>
        {sub && <div style={{fontSize:'8px', fontWeight:'bold', opacity:0.8, transform: `rotate(${-angle}deg)`}}>{sub}</div>}
    </div>
);