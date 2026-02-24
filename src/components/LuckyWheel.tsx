import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { X, Ticket, Diamond, RefreshCw, Video } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

// 🔥 CORRECCIÓN TS: Creamos una interfaz para el tipo de metadatos del usuario


interface LuckyWheelProps {
    onClose: () => void;
    score: number; 
    onUpdateScore: Dispatch<SetStateAction<number>>;
}

const SPIN_COST = 25000;
const MAX_DAILY_SPINS = 2; // 2 Tiros de cortesía (cuestan 25k pts)
const MAX_AD_SPINS = 3;    // 3 Tiros por video (cuestan 25k pts)
const EXTRA_SPINS_PRICE_TON = 0.10; // Precio por 3 tiros VIP (Cuestan 0 pts)

// 🎲 9 PREMIOS (40 grados cada rebanada)
const WHEEL_ITEMS = [
    { value: '5TON',   label: "5 TON",  sub: "GRAND",  color: "#FF0055", textCol: "#fff" }, 
    { value: 25000,    label: "25K",    sub: "REFUND", color: "#222",    textCol: "#fff" }, 
    { value: '1TON',   label: "1 TON",  sub: "JACKPOT", color: "#0088CC", textCol: "#fff" }, 
    { value: 10000,    label: "10K",    sub: "PTS",     color: "#444",    textCol: "#aaa" }, 
    { value: '0.15TON',label: "0.15",   sub: "TON",     color: "#E040FB", textCol: "#fff" }, 
    { value: 0,        label: "FAIL",   sub: "SKULL",   color: "#111",    textCol: "#FF0055" }, 
    { value: '1GOLD',  label: "1 GOLD", sub: "VOUCHER", color: "#FFD700", textCol: "#000" }, 
    { value: 100000,   label: "100K",   sub: "MEGA",    color: "#00F2FE", textCol: "#000" }, 
    { value: 50000,    label: "50K",    sub: "DOUBLE",  color: "#333",    textCol: "#fff" }  
];

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ onClose, score, onUpdateScore }) => {
    const { user } = useAuth();
    const [tonConnectUI] = useTonConnectUI();
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    
    // Contadores de uso
    const [dailySpinsUsed, setDailySpinsUsed] = useState(0); 
    const [adSpinsUsed, setAdSpinsUsed] = useState(0); 
    const [premiumSpins, setPremiumSpins] = useState(0); 
    
    const [dataLoaded, setDataLoaded] = useState(false);

    // Memoria Persistente con LocalStorage (Lectura Segura)
    useEffect(() => {
        if (user) {
            setTimeout(() => {
                const today = new Date().toISOString().split('T')[0];
                const savedData = localStorage.getItem(`lucky_wheel_${user.id}`);
                
                if (savedData) {
                    try {
                        const parsed = JSON.parse(savedData);
                        if (parsed.date === today) {
                            setDailySpinsUsed(parsed.dailySpinsUsed || 0);
                            setAdSpinsUsed(parsed.adSpinsUsed || 0);
                            setPremiumSpins(parsed.premiumSpins || 0);
                        } else {
                            // Día nuevo: resetear diarios y ads, mantener premium
                            setDailySpinsUsed(0);
                            setAdSpinsUsed(0);
                            setPremiumSpins(parsed.premiumSpins || 0); 
                        }
                    } catch (e) {
                        console.error("Storage parse error", e);
                    }
                }
                setDataLoaded(true); // Se marca como completado de forma segura
            }, 0);
        }
    }, [user]);

    // Memoria Persistente con LocalStorage (Guardado Seguro)
    useEffect(() => {
        if (user && dataLoaded) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`lucky_wheel_${user.id}`, JSON.stringify({ 
                date: today, 
                dailySpinsUsed, 
                adSpinsUsed,
                premiumSpins 
            }));
        }
    }, [dailySpinsUsed, adSpinsUsed, premiumSpins, user, dataLoaded]);

    // Función principal de giro
    const executeSpin = async (spinType: 'premium' | 'daily' | 'ad') => {
        if (spinning || !user?.id) return;

        if (spinType === 'premium') {
            const confirmPremium = window.confirm(`💎 USE 1 VIP TICKET?\n\nThis spin will not consume any points. Good luck!`);
            if(!confirmPremium) return;
        } else {
            if (score < SPIN_COST) {
                alert(`🚫 INSUFFICIENT BALANCE\n\nYou need ${SPIN_COST.toLocaleString()} points to spin.`);
                return;
            }
            if (spinType === 'ad') {
                const confirmAd = window.confirm(`📺 WATCH AD TO UNLOCK SPIN?\n\nThis will still cost you ${SPIN_COST.toLocaleString()} points.`);
                if(!confirmAd) return;
                
                await new Promise(r => setTimeout(r, 2000));
            } else {
                const confirmDaily = window.confirm(`🪙 DEDUCT ${SPIN_COST.toLocaleString()} POINTS?\n\nAre you feeling lucky?`);
                if(!confirmDaily) return;
            }
        }

        setSpinning(true);
        
        if (spinType !== 'premium') {
            onUpdateScore(prev => prev - SPIN_COST);
        }

        try {
            // Buscamos el username EXACTO desde la tabla user_score
            const { data: scoreData } = await supabase
                .from('user_score')
                .select('username')
                .eq('user_id', user.id)
                .single();
                
            const exactUsername = scoreData?.username || "HiddenUser";

            const { data, error } = await supabase.rpc('spin_wheel_v2', { 
                user_id_in: user.id, 
                spin_type: spinType,
                username_in: exactUsername 
            });

            if (error) throw error;

            let wonAmount: string | number | undefined;
            
            if (Array.isArray(data) && data.length > 0) {
                wonAmount = data[0].reward !== undefined ? data[0].reward : data[0];
            } else if (data !== null && typeof data === 'object' && 'reward' in data) {
                wonAmount = (data as Record<string, unknown>).reward as string | number;
            } else if (data !== null && data !== undefined) {
                wonAmount = data as string | number;
            }

            if (wonAmount === undefined || wonAmount === null || (Array.isArray(data) && data.length === 0)) {
                throw new Error("Invalid or empty data returned from database.");
            }
            
            // CÁLCULO DE ROTACIÓN
            const winningIndex = WHEEL_ITEMS.findIndex(item => item.value === wonAmount);
            const targetIndex = winningIndex !== -1 ? winningIndex : 5; // Default to FAIL

            const segmentAngle = 360 / WHEEL_ITEMS.length; 
            const centerOffset = segmentAngle / 2; 
            const baseRotation = 360 - (targetIndex * segmentAngle) - centerOffset;
            const randomWobble = Math.floor(Math.random() * 26) - 13; 
            
            const currentFullSpins = Math.floor(rotation / 360);
            const finalRotation = ((currentFullSpins + 5) * 360) + baseRotation + randomWobble;

            setRotation(finalRotation);

            setTimeout(() => {
                setSpinning(false);
                
                // Restar el inventario
                if (spinType === 'premium') setPremiumSpins(prev => prev - 1);
                else if (spinType === 'daily') setDailySpinsUsed(prev => prev + 1);
                else if (spinType === 'ad') setAdSpinsUsed(prev => prev + 1);

                // MANEJO DE PREMIOS
                if (typeof wonAmount === 'string') {
                    if (wonAmount === '1GOLD') {
                        if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 500]);
                        alert(`🎟️ GOLDEN VOUCHER AQUIRED!\n\nYou found a legendary Golden Voucher. Keep collecting!`);
                    } else if (wonAmount.includes('TON')) {
                        if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200, 100, 500]);
                        alert(`💎 HOLY MOLY! YOU WON ${wonAmount}!\n\nContact support to claim your real crypto reward!`);
                    }
                } else if (typeof wonAmount === 'number' && wonAmount > 0) {
                    onUpdateScore(s => s + wonAmount);
                    if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
                    
                    if (spinType === 'premium') {
                        alert(`🎉 VIP WIN! +${wonAmount.toLocaleString()} Pts added to balance!`);
                    } else {
                        if (wonAmount > SPIN_COST) {
                            alert(`🎉 BIG WIN! +${wonAmount.toLocaleString()} Pts!`);
                        } else if (wonAmount === SPIN_COST) {
                            alert(`⚖️ Phew! You got your ${wonAmount.toLocaleString()} points back.`);
                        } else {
                            alert(`📉 Ouch! You only won ${wonAmount.toLocaleString()} points back.`);
                        }
                    }
                } else {
                    if (window.navigator.vibrate) window.navigator.vibrate(400);
                    alert("💀 BUSTED! The house wins. Better luck next time!");
                }
            }, 4000);

        } catch (err) {
            // 🔥 CORRECCIÓN TS: Manejo de error sin el tipo "any" explícito
            console.error("Spin DB Error:", err);
            const errorMessage = err instanceof Error ? err.message : "Connection failed";
            alert(`❌ DB Error: ${errorMessage}\n\nSpin refunded.`);
            if (spinType !== 'premium') onUpdateScore(prev => prev + SPIN_COST); 
            setSpinning(false);
        }
    };

    const handleBuyMoreSpins = async () => {
        if (!user) return; 
        if (!tonConnectUI.account) {
            alert("❌ Please connect your TON wallet first!");
            return;
        }

        const confirmBuy = window.confirm(`💳 PAY ${EXTRA_SPINS_PRICE_TON} TON?\n\nGet 3 VIP Tickets.\n(VIP spins cost 0 Points to use!).`);
        if(!confirmBuy) return;

        const ADMIN_WALLET = 'UQD7qJo2-AYe7ehX9_nEk4FutxnmbdiSx3aLlwlB9nENZ43q';

        try {
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [{ address: ADMIN_WALLET, amount: (EXTRA_SPINS_PRICE_TON * 1000000000).toString() }],
            };
            const result = await tonConnectUI.sendTransaction(transaction);
            if (result) {
                // Buscamos el username EXACTO desde la tabla user_score
                const { data: scoreData } = await supabase
                    .from('user_score')
                    .select('username')
                    .eq('user_id', user.id)
                    .single();
                    
                const exactUsername = scoreData?.username || "HiddenUser";

                await supabase.rpc('buy_vip_tickets', { 
                    user_id_in: user.id, 
                    ton_amount: EXTRA_SPINS_PRICE_TON, 
                    tickets_qty: 3,
                    username_in: exactUsername 
                });

                setPremiumSpins(prev => prev + 3);
                alert("🎉 SUCCESS! 3 VIP Tickets added to your account!");
            }
        } catch (err) {
            // 🔥 CORRECCIÓN TS: Tipado del Catch quitado
            console.error(err);
            alert("❌ Transaction cancelled.");
        }
    };

    const conicGradient = `conic-gradient(
        ${WHEEL_ITEMS.map((item, i) => `${item.color} ${i * (360 / WHEEL_ITEMS.length)}deg ${(i + 1) * (360 / WHEEL_ITEMS.length)}deg`).join(', ')}
    )`;

    const renderMainButton = () => {
        if (premiumSpins > 0) {
            return (
                <button className="btn-neon" disabled={spinning} onClick={() => executeSpin('premium')}
                    style={{ width: '100%', padding: '15px', background: 'linear-gradient(180deg, #0088CC 0%, #005580 100%)', color: '#fff', border: '1px solid #00F2FE', fontWeight:'900', borderRadius:'12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', boxShadow: !spinning ? '0 0 20px rgba(0, 136, 204, 0.5)' : 'none', transform: spinning ? 'scale(0.95)' : 'scale(1)', transition: 'all 0.2s' }}>
                    {spinning ? "SPINNING..." : <><span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Ticket size={18} /> USE VIP TICKET</span><span style={{fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px'}}>COST: 0 PTS</span></>}
                </button>
            );
        } else if (dailySpinsUsed < MAX_DAILY_SPINS) {
            return (
                <button className="btn-neon" disabled={spinning || score < SPIN_COST} onClick={() => executeSpin('daily')}
                    style={{ width: '100%', padding: '15px', background: score >= SPIN_COST ? '#333' : '#222', color: score >= SPIN_COST ? '#fff' : '#666', border: score >= SPIN_COST ? '1px solid #fff' : '1px solid #333', fontWeight:'900', borderRadius:'12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', transform: spinning ? 'scale(0.95)' : 'scale(1)', transition: 'all 0.2s' }}>
                    {spinning ? "SPINNING..." : <><span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>🎰 PLAY NOW</span><span style={{fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px'}}>COST: {SPIN_COST.toLocaleString()} PTS</span></>}
                </button>
            );
        } else if (adSpinsUsed < MAX_AD_SPINS) {
            return (
                <button className="btn-neon" disabled={spinning || score < SPIN_COST} onClick={() => executeSpin('ad')}
                    style={{ width: '100%', padding: '15px', background: score >= SPIN_COST ? 'rgba(76, 175, 80, 0.1)' : '#222', color: score >= SPIN_COST ? '#4CAF50' : '#666', border: score >= SPIN_COST ? '1px solid #4CAF50' : '1px solid #333', fontWeight:'900', borderRadius:'12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', transform: spinning ? 'scale(0.95)' : 'scale(1)', transition: 'all 0.2s' }}>
                    {spinning ? "SPINNING..." : <><span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Video size={18} /> WATCH AD TO UNLOCK</span><span style={{fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px'}}>COST: {SPIN_COST.toLocaleString()} PTS</span></>}
                </button>
            );
        } else {
            return (
                <button className="btn-neon" disabled style={{ width: '100%', padding: '15px', background: '#222', color: '#555', border: '1px solid #333', fontWeight:'900', borderRadius:'12px', display: 'flex', justifyContent: 'center' }}>
                    🛑 LIMIT REACHED. COME BACK TOMORROW.
                </button>
            );
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 5, 10, 0.98)', zIndex: 6000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)'
        }}>
            
            <div style={{textAlign:'center', marginBottom:'20px', position:'relative'}}>
                <div style={{position:'absolute', top:'-20px', left:'50%', transform:'translateX(-50%)', width:'150px', height:'150px', background:'radial-gradient(circle, rgba(0, 136, 204, 0.4) 0%, transparent 70%)', zIndex:-1}}></div>
                <h2 style={{
                    color:'#fff', textShadow:'0 0 20px #0088CC, 0 0 40px #0088CC', 
                    fontSize:'32px', margin:0, fontWeight:'900', letterSpacing:'2px'
                }}>
                    HIGH ROLLER <Diamond size={24} style={{verticalAlign: 'middle', color: '#00F2FE'}}/>
                </h2>
                <div style={{display:'flex', gap:'10px', justifyContent:'center', marginTop:'10px', fontSize:'10px', fontWeight:'bold', color:'#aaa'}}>
                    <span style={{background:'#222', padding:'2px 8px', borderRadius:'10px', border:'1px solid #444'}}>Daily: {MAX_DAILY_SPINS - dailySpinsUsed}</span>
                    <span style={{background:'#222', padding:'2px 8px', borderRadius:'10px', border:'1px solid #4CAF50', color:'#4CAF50'}}>Ads: {MAX_AD_SPINS - adSpinsUsed}</span>
                    <span style={{background:'#222', padding:'2px 8px', borderRadius:'10px', border:'1px solid #0088CC', color:'#00F2FE'}}>VIP: {premiumSpins}</span>
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
                            key={i} text={item.label} sub={item.sub} angle={(i * 40) + 20} color={item.textCol} 
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

            {/* CONTROLES */}
            <div style={{width: '85%', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                
                {/* Botón Principal Adaptativo */}
                {renderMainButton()}

                {/* Botón de Compra Siempre Visible */}
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
                    <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><RefreshCw size={16} /> BUY 3 VIP TICKETS</span>
                    <span style={{fontSize: '10px', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px', color: '#fff'}}>
                        PAY {EXTRA_SPINS_PRICE_TON} TON (NO POINT COST)
                    </span>
                </button>
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