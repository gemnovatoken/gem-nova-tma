import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { X, Zap, Video } from 'lucide-react'; // 🛡️ Quitamos Gift y Trophy
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
    const maxSpins = 5;

    // SEGMENTOS DE LA RUEDA (Orden visual)
    const segments = [10000, 500, 2000, 0, 1000];
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

        if(!window.confirm(`📺 Watch Ad to Spin? (${spinsUsed}/${maxSpins} Used)`)) return;
        
        console.log("Watching Ad...");
        await new Promise(r => setTimeout(r, 2000));

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
                alert(`🎉 RESULT: +${wonAmount.toLocaleString()} Pts!`);
            } else {
                alert("💀 Oops! Zero points. Try again!");
            }
        }, 4000);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 6000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <button onClick={onClose} style={{
                position:'absolute', top:20, right:20, background:'rgba(255,255,255,0.1)', 
                border:'none', borderRadius:'50%', width:'40px', height:'40px', color:'#fff', cursor:'pointer'
            }}>
                <X />
            </button>

            <div style={{textAlign:'center', marginBottom:'30px'}}>
                <h2 style={{
                    color:'#E040FB', textShadow:'0 0 20px #E040FB', 
                    fontSize:'32px', margin:0, fontFamily:'monospace', letterSpacing:'2px'
                }}>
                    CYBER SPIN
                </h2>
                <p style={{color:'#aaa', fontSize:'12px'}}>Daily limit: {spinsUsed}/{maxSpins}</p>
            </div>

            <div style={{ position: 'relative', width: '300px', height: '300px', marginBottom: '40px' }}>
                <div style={{
                    position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)',
                    width: 0, height: 0, 
                    borderLeft: '15px solid transparent', borderRight: '15px solid transparent',
                    borderTop: '30px solid #fff', zIndex: 20, filter: 'drop-shadow(0 0 5px #fff)'
                }}></div>

                <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    border: '4px solid #333', boxShadow: '0 0 50px rgba(224, 64, 251, 0.3)',
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 4s cubic-bezier(0.1, 0, 0.2, 1)',
                    background: `conic-gradient(
                        #FFD700 0deg 72deg,   
                        #333 72deg 144deg,    
                        #00F2FE 144deg 216deg,
                        #FF512F 216deg 288deg,
                        #4CAF50 288deg 360deg 
                    )`,
                    position: 'relative'
                }}>
                    <WheelLabel text="10K" angle={36} color="#000" />
                    <WheelLabel text="500" angle={108} color="#fff" />
                    <WheelLabel text="2K" angle={180} color="#000" />
                    <WheelLabel text="ZERO" angle={252} color="#fff" />
                    <WheelLabel text="1K" angle={324} color="#000" />
                </div>

                <div style={{
                    position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
                    width:'60px', height:'60px', background:'#111', borderRadius:'50%',
                    border:'2px solid #E040FB', display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: '0 0 20px #E040FB'
                }}>
                    <Zap size={24} color="#E040FB" />
                </div>
            </div>

            <button 
                className="btn-neon"
                disabled={spinning || spinsUsed >= maxSpins}
                onClick={handleSpin}
                style={{
                    width: '80%', padding: '15px', fontSize: '16px', 
                    background: spinsUsed >= maxSpins ? '#333' : '#E040FB', 
                    color: spinsUsed >= maxSpins ? '#aaa' : '#fff',
                    border: 'none', fontWeight:'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}
            >
                {spinsUsed >= maxSpins ? (
                    "LIMIT REACHED (5/5)"
                ) : (
                    spinning ? "GOOD LUCK..." : <><Video /> SPIN & WIN</>
                )}
            </button>
            
            <p style={{marginTop:'15px', fontSize:'10px', color:'#666'}}>Watch a video to spin. Prizes are random.</p>

        </div>
    );
};

const WheelLabel = ({ text, angle, color }: { text: string, angle: number, color: string }) => (
    <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-110px)`,
        color: color, fontWeight: 'bold', fontSize: '14px', textAlign: 'center'
    }}>
        {text}
    </div>
);