import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { X, Ticket, Diamond, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

interface LuckyWheelProps {
    onClose: () => void;
    score: number; 
    onUpdateScore: Dispatch<SetStateAction<number>>;
}

const SPIN_COST = 50000;
const MAX_DAILY_SPINS = 3;
const EXTRA_SPINS_PRICE_TON = 3;

// 🎲 8 PREMIOS INTERCALADOS PARA MÁXIMA EMOCIÓN VISUAL
const WHEEL_ITEMS = [
    { value: '1TON',   label: "1 TON",  sub: "JACKPOT", color: "#0088CC", textCol: "#fff" }, 
    { value: 10000,    label: "10K",    sub: "PTS",     color: "#222",    textCol: "#fff" }, 
    { value: '0.5TON', label: "0.5",    sub: "TON",     color: "#FFD700", textCol: "#000" }, 
    { value: 5000,     label: "5K",     sub: "PTS",     color: "#444",    textCol: "#aaa" }, 
    { value: '0.15TON',label: "0.15",   sub: "TON",     color: "#E040FB", textCol: "#fff" }, 
    { value: 0,        label: "FAIL",   sub: "SKULL",   color: "#FF0055", textCol: "#fff" }, 
    { value: 100000,   label: "100K",   sub: "MEGA",    color: "#00F2FE", textCol: "#000" }, 
    { value: 50000,    label: "50K",    sub: "REFUND",  color: "#333",    textCol: "#fff" }  
];

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ onClose, score, onUpdateScore }) => {
    const { user } = useAuth();
    const [tonConnectUI] = useTonConnectUI();
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [spinsUsed, setSpinsUsed] = useState(0); 
    const [extraSpins, setExtraSpins] = useState(0); 

    // 🔥 SOLUCIÓN AL CASCADING RENDER: Ejecución Asíncrona 🔥
    useEffect(() => {
        if (user) {
            // El setTimeout(..., 0) evita el error de "setState synchronously" en React
            setTimeout(() => {
                const today = new Date().toISOString().split('T')[0];
                const savedData = localStorage.getItem(`lucky_wheel_${user.id}`);
                
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    if (parsed.date === today) {
                        setSpinsUsed(parsed.spinsUsed || 0);
                        setExtraSpins(parsed.extraSpins || 0);
                    } else {
                        // Si es un día nuevo, limpiamos la memoria
                        setSpinsUsed(0);
                        setExtraSpins(0);
                    }
                }
            }, 0);
        }
    }, [user]);

    // Guardar en memoria cada vez que cambien los tiros
    useEffect(() => {
        if (user) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`lucky_wheel_${user.id}`, JSON.stringify({ 
                date: today, 
                spinsUsed, 
                extraSpins 
            }));
        }
    }, [spinsUsed, extraSpins, user]);

    const spinsLeft = (MAX_DAILY_SPINS - spinsUsed) + extraSpins;

    const handleSpin = async () => {
        if (spinning || !user) return;

        if (spinsLeft <= 0) return;

        // 1. VERIFICAR SALDO
        if (score < SPIN_COST) {
            alert(`🚫 INSUFFICIENT BALANCE\n\nYou need ${SPIN_COST.toLocaleString()} points to spin the Wheel.`);
            return;
        }

        const confirmSpin = window.confirm(`💎 DEDUCT ${SPIN_COST.toLocaleString()} POINTS?\n\nAre you feeling lucky?`);
        if(!confirmSpin) return;

        setSpinning(true);
        
        // 2. DESCONTAR PUNTOS INMEDIATAMENTE
        onUpdateScore(prev => prev - SPIN_COST);

        // 3. LLAMADA A SUPABASE
        const { data, error } = await supabase.rpc('spin_wheel_v2', { user_id_in: user.id });

        if (error || !data || data.length === 0) {
            alert("Connection error. Your points have been refunded.");
            onUpdateScore(prev => prev + SPIN_COST); 
            setSpinning(false);
            return;
        }

        const wonAmount = data[0].reward; 
        
        // 4. CÁLCULO DE ROTACIÓN
        const winningIndex = WHEEL_ITEMS.findIndex(item => item.value === wonAmount);
        const targetIndex = winningIndex !== -1 ? winningIndex : 5; 

        const segmentAngle = 360 / WHEEL_ITEMS.length; 
        const centerOffset = segmentAngle / 2; 
        const baseRotation = 360 - (targetIndex * segmentAngle) - centerOffset;
        const randomWobble = Math.floor(Math.random() * 30) - 15; 
        
        const currentFullSpins = Math.floor(rotation / 360);
        const finalRotation = ((currentFullSpins + 5) * 360) + baseRotation + randomWobble;

        setRotation(finalRotation);

        setTimeout(() => {
            setSpinning(false);
            
            // Restar el giro de la UI
            if (extraSpins > 0) setExtraSpins(prev => prev - 1);
            else setSpinsUsed(prev => prev + 1);

            // MANEJO DE PREMIOS
            if (typeof wonAmount === 'string' && wonAmount.includes('TON')) {
                if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200, 100, 500]);
                alert(`💎 HOLY MOLY! YOU WON ${wonAmount}!\n\nContact support to claim your real crypto reward!`);
            } else if (typeof wonAmount === 'number' && wonAmount > 0) {
                onUpdateScore(s => s + wonAmount);
                if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
                
                if (wonAmount > SPIN_COST) {
                    alert(`🎉 BIG WIN! +${wonAmount.toLocaleString()} Pts!`);
                } else if (wonAmount === SPIN_COST) {
                    alert(`⚖️ Phew! You got your ${wonAmount.toLocaleString()} points back.`);
                } else {
                    alert(`📉 Ouch! You only won ${wonAmount.toLocaleString()} points back.`);
                }
            } else {
                if (window.navigator.vibrate) window.navigator.vibrate(400);
                alert("💀 BUSTED! The house wins. Better luck next time!");
            }
        }, 4000);
    };

    const handleBuyMoreSpins = async () => {
        if (!tonConnectUI.account) {
            alert("❌ Please connect your TON wallet first!");
            return;
        }

        const confirmBuy = window.confirm(`💳 PAY ${EXTRA_SPINS_PRICE_TON} TON?\n\nThis unlocks 3 more spins for today.\n(Each spin still costs 50k points).`);
        if(!confirmBuy) return;

        const ADMIN_WALLET = 'UQD7qJo2-AYe7ehX9_nEk4FutxnmbdiSx3aLlwlB9nENZ43q';

        try {
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [{ address: ADMIN_WALLET, amount: (EXTRA_SPINS_PRICE_TON * 1000000000).toString() }],
            };
            const result = await tonConnectUI.sendTransaction(transaction);
            if (result) {
                setExtraSpins(prev => prev + 3);
                alert("🎉 SUCCESS! You unlocked 3 extra spins!");
            }
        } catch (err) {
            console.error(err);
            alert("❌ Transaction cancelled.");
        }
    };

    const conicGradient = `conic-gradient(
        ${WHEEL_ITEMS.map((item, i) => `${item.color} ${i * (360 / WHEEL_ITEMS.length)}deg ${(i + 1) * (360 / WHEEL_ITEMS.length)}deg`).join(', ')}
    )`;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 5, 10, 0.98)', zIndex: 6000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)'
        }}>
            
            <div style={{textAlign:'center', marginBottom:'30px', position:'relative'}}>
                <div style={{position:'absolute', top:'-20px', left:'50%', transform:'translateX(-50%)', width:'150px', height:'150px', background:'radial-gradient(circle, rgba(0, 136, 204, 0.4) 0%, transparent 70%)', zIndex:-1}}></div>
                <h2 style={{
                    color:'#fff', textShadow:'0 0 20px #0088CC, 0 0 40px #0088CC', 
                    fontSize:'32px', margin:0, fontWeight:'900', letterSpacing:'2px'
                }}>
                    HIGH ROLLER <Diamond size={24} style={{verticalAlign: 'middle', color: '#00F2FE'}}/>
                </h2>
                <div style={{color: '#FFD700', fontSize: '12px', fontWeight: 'bold', marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}>
                    <AlertTriangle size={12} color="#FF0055" /> HIGH RISK, HIGH REWARD
                </div>
            </div>

            <div style={{ position: 'relative', width: '320px', height: '320px', marginBottom: '30px' }}>
                
                <div style={{
                    position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
                    width: '30px', height: '40px', background: '#FFD700', clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                    zIndex: 20, filter: 'drop-shadow(0 0 10px #FFD700)'
                }}></div>

                <div style={{
                    position:'absolute', top:'-10px', left:'-10px', right:'-10px', bottom:'-10px',
                    borderRadius:'50%', border:'2px solid rgba(0, 136, 204, 0.5)',
                    boxShadow: '0 0 30px rgba(0, 136, 204, 0.3)',
                    animation: 'spinSlow 15s linear infinite'
                }}></div>

                <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    border: '6px solid #111', 
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)',
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 4s cubic-bezier(0.1, 0, 0.2, 1)',
                    background: conicGradient,
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {WHEEL_ITEMS.map((item, i) => (
                        <WheelLabel 
                            key={i}
                            text={item.label} 
                            sub={item.sub} 
                            angle={(i * 45) + 22.5} 
                            color={item.textCol} 
                        />
                    ))}
                </div>

                <div style={{
                    position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
                    width:'60px', height:'60px', background:'#111', borderRadius:'50%',
                    border:'4px solid #0088CC', display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: '0 0 20px #0088CC'
                }}>
                    <Diamond size={24} color="#fff" fill="#0088CC" />
                </div>
            </div>

            <div style={{width: '85%', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <div style={{textAlign: 'center', color: '#aaa', fontSize: '12px', fontWeight: 'bold'}}>
                    SPINS LEFT: <span style={{color: spinsLeft > 0 ? '#4CAF50' : '#FF0055'}}>{spinsLeft}</span>
                </div>

                {spinsLeft > 0 ? (
                    <button 
                        className="btn-neon"
                        disabled={spinning || score < SPIN_COST}
                        onClick={handleSpin}
                        style={{
                            width: '100%', padding: '15px', fontSize: '16px', 
                            background: score >= SPIN_COST ? 'linear-gradient(180deg, #0088CC 0%, #005580 100%)' : '#333', 
                            color: score >= SPIN_COST ? '#fff' : '#888', border: score >= SPIN_COST ? '1px solid #00F2FE' : '1px solid #222', 
                            fontWeight:'900', borderRadius:'12px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                            boxShadow: score >= SPIN_COST && !spinning ? '0 0 20px rgba(0, 136, 204, 0.5)' : 'none',
                            transform: spinning ? 'scale(0.95)' : 'scale(1)', transition: 'all 0.2s'
                        }}
                    >
                        {spinning ? "SPINNING..." : (
                            <>
                                <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Ticket size={18} /> PLAY NOW</span>
                                <span style={{fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px'}}>
                                    COST: {SPIN_COST.toLocaleString()} PTS
                                </span>
                            </>
                        )}
                    </button>
                ) : (
                    <button 
                        className="btn-neon"
                        onClick={handleBuyMoreSpins}
                        style={{
                            width: '100%', padding: '15px', fontSize: '14px', 
                            background: 'linear-gradient(180deg, #FFD700 0%, #B8860B 100%)', 
                            color: '#000', border: '1px solid #FFF', 
                            fontWeight:'900', borderRadius:'12px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                            boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)'
                        }}
                    >
                        <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><RefreshCw size={16} /> UNLOCK +3 SPINS</span>
                        <span style={{fontSize: '10px', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px', color: '#fff'}}>
                            PAY 3 TON
                        </span>
                    </button>
                )}
            </div>

            <button onClick={onClose} style={{
                position:'absolute', top:20, right:20, border:'none', color:'#fff', cursor:'pointer',
                background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '5px'
            }}><X size={24}/></button>

            <style>{`@keyframes spinSlow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const WheelLabel = ({ text, sub, angle, color }: { text: string, sub?: string, angle: number, color: string }) => (
    <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-110px)`, 
        color: color, textAlign: 'center', width: '70px'
    }}>
        <div style={{fontWeight:'900', fontSize:'20px', textShadow:'0 1px 3px rgba(0,0,0,0.5)', transform: `rotate(${-angle}deg)`}}>{text}</div>
        {sub && <div style={{fontSize:'8px', fontWeight:'bold', opacity:0.9, transform: `rotate(${-angle}deg)`}}>{sub}</div>}
    </div>
);