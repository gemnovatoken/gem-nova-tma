import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { X, Ticket, Diamond, RefreshCw, Video, Trophy, Clock, CheckCircle2, Send } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

interface LuckyWheelProps {
    onClose: () => void;
    score: number; 
    onUpdateScore: Dispatch<SetStateAction<number>>;
}

interface WheelWinner {
    username: string;
    prize: string;
    status: string;
}

const SPIN_COST = 25000;
const MAX_DAILY_SPINS = 2; 
const MAX_AD_SPINS = 3;    
const EXTRA_SPINS_PRICE_TON = 0.10; 

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
    
    const [dailySpinsUsed, setDailySpinsUsed] = useState(0); 
    const [adSpinsUsed, setAdSpinsUsed] = useState(0); 
    const [premiumSpins, setPremiumSpins] = useState(0); 
    const [dataLoaded, setDataLoaded] = useState(false);

    // 🔥 NUEVOS ESTADOS PARA LOS GANADORES Y RECLAMOS
    const [wonTonPrize, setWonTonPrize] = useState<string | null>(null);
    const [walletInput, setWalletInput] = useState("");
    const [isSubmittingWallet, setIsSubmittingWallet] = useState(false);
    const [showWinners, setShowWinners] = useState(false);
    const [winnersList, setWinnersList] = useState<WheelWinner[]>([]);

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
                            setDailySpinsUsed(0);
                            setAdSpinsUsed(0);
                            setPremiumSpins(parsed.premiumSpins || 0); 
                        }
                    } catch (e) {
                        console.error("Storage parse error", e);
                    }
                }
                setDataLoaded(true); 
            }, 0);
        }
    }, [user]);

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

    // 🔥 CARGAR LISTA DE GANADORES
    const fetchWinners = async () => {
        const { data, error } = await supabase
            .from('wheel_winners')
            .select('username, prize, status')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (!error && data) {
            setWinnersList(data as WheelWinner[]);
        }
    };

    useEffect(() => {
        fetchWinners();
    }, []);

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
            
            const winningIndex = WHEEL_ITEMS.findIndex(item => item.value === wonAmount);
            const targetIndex = winningIndex !== -1 ? winningIndex : 5; 

            const segmentAngle = 360 / WHEEL_ITEMS.length; 
            const centerOffset = segmentAngle / 2; 
            const baseRotation = 360 - (targetIndex * segmentAngle) - centerOffset;
            const randomWobble = Math.floor(Math.random() * 26) - 13; 
            
            const currentFullSpins = Math.floor(rotation / 360);
            const finalRotation = ((currentFullSpins + 5) * 360) + baseRotation + randomWobble;

            setRotation(finalRotation);

            setTimeout(() => {
                setSpinning(false);
                
                if (spinType === 'premium') setPremiumSpins(prev => prev - 1);
                else if (spinType === 'daily') setDailySpinsUsed(prev => prev + 1);
                else if (spinType === 'ad') setAdSpinsUsed(prev => prev + 1);

                if (typeof wonAmount === 'string') {
                    if (wonAmount === '1GOLD') {
                        if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 500]);
                        alert(`🎟️ GOLDEN VOUCHER AQUIRED!\n\nYou found a legendary Golden Voucher. Keep collecting!`);
                    } else if (wonAmount.includes('TON')) {
                        if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200, 100, 500]);
                        // 🔥 EN LUGAR DE LA ALERTA, ABRIMOS EL MODAL DE WALLET
                        setWonTonPrize(wonAmount);
                        // Autocompletar wallet si ya está conectada
                        if (tonConnectUI.account?.address) {
                            setWalletInput(tonConnectUI.account.address);
                        }
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

        } catch (err: unknown) {
            console.error("Spin DB Error:", err);
            let errorMessage = "Connection failed";
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (err && typeof err === 'object' && 'message' in err) {
                errorMessage = String((err as Record<string, unknown>).message);
            }
            alert(`❌ DB Error: ${errorMessage}\n\nSpin refunded.`);
            if (spinType !== 'premium') onUpdateScore(prev => prev + SPIN_COST); 
            setSpinning(false);
        }
    };

    // 🔥 FUNCIÓN PARA ENVIAR EL RECLAMO A SUPABASE
    const handleSubmitWallet = async () => {
        if (!user || !wonTonPrize) return;
        if (walletInput.trim().length < 20) {
            alert("⚠️ Please enter a valid TON wallet address.");
            return;
        }

        setIsSubmittingWallet(true);
        try {
            const { data: scoreData } = await supabase.from('user_score').select('username').eq('user_id', user.id).single();
            const exactUsername = scoreData?.username || "HiddenUser";

            await supabase.rpc('claim_ton_prize', {
                user_id_in: user.id,
                username_in: exactUsername,
                prize_in: wonTonPrize,
                wallet_in: walletInput.trim()
            });

            alert(`✅ REWARD CLAIMED!\n\nPrize: ${wonTonPrize}\nStatus: PENDING.\n\nYour reward will be sent to your wallet soon.`);
            setWonTonPrize(null);
            fetchWinners(); // Refrescar la lista de ganadores
        } catch (err) {
            console.error(err);
            alert("Error submitting claim. Please contact support.");
        }
        setIsSubmittingWallet(false);
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
                const { data: scoreData } = await supabase.from('user_score').select('username').eq('user_id', user.id).single();
                const exactUsername = scoreData?.username || "HiddenUser";

                const { error } = await supabase.rpc('buy_vip_tickets', { 
                    user_id_in: user.id, 
                    ton_amount: EXTRA_SPINS_PRICE_TON, 
                    tickets_qty: 3,
                    username_in: exactUsername 
                });
                
                if (error) throw error;

                setPremiumSpins(prev => prev + 3);
                alert("🎉 SUCCESS! 3 VIP Tickets added to your account!");
            }
        } catch (err: unknown) {
            console.error(err);
            let errorMessage = "Transaction cancelled.";
            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (err && typeof err === 'object' && 'message' in err) {
                errorMessage = String((err as Record<string, unknown>).message);
            }
            alert(`❌ Error: ${errorMessage}`);
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
            
            {/* BOTÓN CÍRCULO DE GANADORES (IZQUIERDA) 🔥 Bajado a top: 80px */}
            <button onClick={() => setShowWinners(true)} style={{
                position:'absolute', top:80, left:20, border:'1px solid #FFD700', color:'#FFD700', cursor:'pointer',
                background: 'rgba(255, 215, 0, 0.1)', borderRadius: '50%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)', zIndex: 7000
            }}><Trophy size={20}/></button>

            {/* BOTÓN CERRAR (DERECHA) 🔥 Bajado a top: 80px */}
            <button onClick={onClose} style={{
                position:'absolute', top:80, right:20, border:'none', color:'#fff', cursor:'pointer',
                background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '8px', zIndex: 7000
            }}><X size={24}/></button>

            <div style={{textAlign:'center', marginBottom:'20px', position:'relative'}}>
                <div style={{position:'absolute', top:'-20px', left:'50%', transform:'translateX(-50%)', width:'150px', height:'150px', background:'radial-gradient(circle, rgba(0, 136, 204, 0.4) 0%, transparent 70%)', zIndex:-1}}></div>
                <h2 style={{
                    color:'#fff', textShadow:'0 0 20px #0088CC, 0 0 40px #0088CC', 
                    fontSize:'32px', margin:0, fontWeight:'900', letterSpacing:'2px', marginTop: '20px'
                }}>
                    HIGH ROLLER <Diamond size={24} style={{verticalAlign: 'middle', color: '#00F2FE'}}/>
                </h2>
                <div style={{display:'flex', gap:'10px', justifyContent:'center', marginTop:'10px', fontSize:'10px', fontWeight:'bold', color:'#aaa'}}>
                    <span style={{background:'#222', padding:'2px 8px', borderRadius:'10px', border:'1px solid #444'}}>Daily: {MAX_DAILY_SPINS - dailySpinsUsed}</span>
                    <span style={{background:'#222', padding:'2px 8px', borderRadius:'10px', border:'1px solid #4CAF50', color:'#4CAF50'}}>Ads: {MAX_AD_SPINS - adSpinsUsed}</span>
                    <span style={{background:'#222', padding:'2px 8px', borderRadius:'10px', border:'1px solid #0088CC', color:'#00F2FE'}}>VIP: {premiumSpins}</span>
                </div>
            </div>

            {/* RULETA */}
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
                {renderMainButton()}
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

            {/* 🔥 MODAL: INGRESO DE WALLET (SÓLO CUANDO GANAN TON) */}
            {wonTonPrize && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 8000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <Diamond size={60} color="#00F2FE" style={{ filter: 'drop-shadow(0 0 20px #00F2FE)', marginBottom: '20px' }} />
                    <h2 style={{ color: '#fff', fontSize: '28px', textAlign: 'center', margin: '0 0 10px' }}>JACKPOT!</h2>
                    <p style={{ color: '#00F2FE', fontSize: '18px', fontWeight: 'bold', marginBottom: '30px' }}>YOU WON {wonTonPrize}</p>
                    
                    <div style={{ width: '100%', maxWidth: '300px', background: '#111', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
                        <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '8px' }}>Enter your TON Wallet Address:</label>
                        <input 
                            type="text" 
                            value={walletInput} 
                            onChange={(e) => setWalletInput(e.target.value)}
                            placeholder="EQD..."
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#000', color: '#fff', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box' }}
                        />
                        <button 
                            onClick={handleSubmitWallet} 
                            disabled={isSubmittingWallet}
                            style={{ width: '100%', padding: '15px', background: '#00F2FE', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <Send size={18} /> {isSubmittingWallet ? 'SAVING...' : 'CLAIM REWARD'}
                        </button>
                    </div>
                </div>
            )}

            {/* 🔥 MODAL: LISTA DE GANADORES */}
            {showWinners && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 10, 0.98)', zIndex: 7500, display: 'flex', flexDirection: 'column', padding: '20px', backdropFilter: 'blur(10px)' }}>
                    {/* Botón cerrar del Modal de Ganadores, también ajustado */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '40px' }}>
                        <h2 style={{ color: '#FFD700', fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Trophy /> RECENT WINNERS</h2>
                        <button onClick={() => setShowWinners(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 7600 }}><X size={28} /></button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '20px' }}>
                        {winnersList.length === 0 ? (
                            <div style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>No winners yet. Be the first!</div>
                        ) : (
                            winnersList.map((w, index) => (
                                <div key={index} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>@{w.username}</div>
                                        <div style={{ color: '#00F2FE', fontSize: '16px', fontWeight: '900', marginTop: '4px' }}>{w.prize}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {w.status === 'Completed' ? (
                                            <div style={{ background: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12}/> COMPLETED</div>
                                        ) : (
                                            <div style={{ background: 'rgba(255, 152, 0, 0.2)', color: '#FF9800', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> PENDING</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

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