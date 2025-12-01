import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { X, Zap, Video, Gift } from 'lucide-react'; // 🛡️ Eliminamos 'Sparkles' y 'Trophy'
import type { Dispatch, SetStateAction } from 'react';

interface LuckyWheelProps {
    onClose: () => void;
    onUpdateScore: Dispatch<SetStateAction<number>>;
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ onClose, onUpdateScore }) => {
    const { user } = useAuth();
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [spinsUsed, setSpinsUsed] = useState(0);
    const maxSpins = 7; // 7 Intentos
    const freeSpins = 2; // 2 Gratis

    const segments = [5000, 500, 2000, 0, 1000];
    const segmentAngle = 360 / segments.length;

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

        if (!isFree) {
            if(!window.confirm(`📺 Watch Ad to Spin? (${maxSpins - spinsUsed} left)`)) return;
            console.log("Watching Ad...");
            await new Promise(r => setTimeout(r, 2000));
        }

        setSpinning(true);

        const { data, error } = await supabase.rpc('spin_wheel_v2', { user_id_in: user.id });

        if (error || !data || data.length === 0) {
            alert("Error spinning. Try again.");
            setSpinning(false);
            return;
        }

        const wonAmount = data[0].reward;
        const newSpins = data[0].new_spins_used;

        const targetIndices = segments.map((val, idx) => val === wonAmount ? idx : -1).filter(i => i !== -1);
        const targetIndex = targetIndices[Math.floor(Math.random() * targetIndices.length)];
        const extraSpins = 5; 
        const randomOffset = Math.floor(Math.random() * 40) - 20; 
        const targetAngle = (360 - (targetIndex * segmentAngle)) + (360 * extraSpins) + randomOffset;

        setRotation(rotation + targetAngle);

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
                    background: `conic-gradient(
                        #FFD700 0deg 72deg,   
                        #222 72deg 144deg,    
                        #00F2FE 144deg 216deg,
                        #FF512F 216deg 288deg,
                        #E040FB 288deg 360deg 
                    )`,
                    position: 'relative'
                }}>
                    <WheelLabel text="5K" sub="JACKPOT" angle={36} color="#000" />
                    <WheelLabel text="500" angle={108} color="#fff" />
                    <WheelLabel text="2K" angle={180} color="#000" />
                    <WheelLabel text="FAIL" angle={252} color="#fff" />
                    <WheelLabel text="1K" angle={324} color="#000" />
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
        color: color, textAlign: 'center'
    }}>
        <div style={{fontWeight:'900', fontSize:'20px', textShadow:'0 1px 2px rgba(0,0,0,0.3)'}}>{text}</div>
        {sub && <div style={{fontSize:'8px', fontWeight:'bold', opacity:0.8}}>{sub}</div>}
    </div>
);