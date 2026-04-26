import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { X, Ticket, Diamond, Video, Trophy, Clock, CheckCircle2, Send, Star, Zap, Flame, Lock } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { PuzzleWidget } from './PuzzleWidget';
import { PuzzleModal } from './PuzzleModal'; 
import { VipStoreModal } from './VipStoreModal'; 
import confetti from 'canvas-confetti';

// 🔥 REGISTRAMOS ADSGRAM EN TYPESCRIPT PARA LA RULETA 🔥
declare global {
    interface Window {
        Adsgram: {
            init: (config: { blockId: string }) => { show: () => Promise<void> };
        };
    }
}

interface LuckyWheelProps {
    onClose?: () => void; 
    score: number; 
    onUpdateScore: Dispatch<SetStateAction<number>>;
}

interface WheelWinner {
    username: string;
    prize: string;
    status: string;
}

const MAX_DAILY_SPINS = 3; 
const MAX_AD_SPINS = 10;   
const EXTRA_SPINS_PRICE_TON = 0.10; 
const SPIN_COST = 15000; 

const ADMIN_WALLET = 'UQD7qJo2-AYe7ehX9_nEk4FutxnmbdiSx3aLlwlB9nENZ43q';

const FAIL_MESSAGES = [
    "💀 BUSTED! The house wins. Did you really think it would be that easy? 🤡",
    "💨 POOF! Your points just vaporized. Try closing your eyes next time. 🙈",
    "📉 FAIL! The Gnova Gods are laughing at you right now. 🌩️",
    "🐢 NOPE! My grandma spins better than that. 👵",
    "🗑️ YIKES! That spin belongs in the trash can. 🚮",
    "⛔ DENIED! Are you using Internet Explorer to spin? 🐌",
    "💸 BUSTED! We appreciate your generous donation to the casino. 🎩",
    "🎪 FAIL! Welcome to the circus, clown! 🤡",
    "🥊 OUCH! Right in the points. Maybe watch an ad to heal? 🩹",
    "🧊 NOPE! Cold as ice. Better luck next time... 🥶",
    "🪨 BUSTED! I've seen rocks with better luck than you. 🗿",
    "🌬️ FAIL! Have you tried blowing on the screen? Doesn't work, but try it. 🤣",
    "🏖️ YIKES! Your luck is on vacation today. 🍹",
    "🔌 DENIED! Error 404: Luck not found. Please insert more points. 💻",
    "🤏 BUSTED! That was almost a win... just kidding, total fail. 🤪",
    "🎯 FAIL! You missed the target by a mile. 🏹",
    "🧲 OOF! You're magically attracted to this skull, aren't you? 💀",
    "💸 NOPE! We're sending your points to a better place... our pockets. 🏦",
    "🎢 YIKES! What a roller coaster of disappointment. 🎢",
    "🏆 DENIED! Wow, 20 fails in a row? You're actually breaking records! 🥇"
];

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ onClose, score, onUpdateScore }) => {
    const { user } = useAuth();
    const [tonConnectUI] = useTonConnectUI();
    const [spinning, setSpinning] = useState(false);
    const [failIndex, setFailIndex] = useState(0);
    const [rotation, setRotation] = useState(0);
    
    const [dailySpinsUsed, setDailySpinsUsed] = useState(0); 
    const [adSpinsUsed, setAdSpinsUsed] = useState(0); 
    const [premiumSpins, setPremiumSpins] = useState(0); 
    const [dataLoaded, setDataLoaded] = useState(false);

    const [wonTonPrize, setWonTonPrize] = useState<string | null>(null);
    const [walletInput, setWalletInput] = useState("");
    const [isSubmittingWallet, setIsSubmittingWallet] = useState(false);
    const [showWinners, setShowWinners] = useState(false);
    
    // 🔥 ESTADOS REALES PARA EL ROMPECABEZAS 🔥
    const [showPuzzleModal, setShowPuzzleModal] = useState(false);
    const [puzzlePieces, setPuzzlePieces] = useState(0);
    const [puzzlePiecesBought, setPuzzlePiecesBought] = useState(0); // NUEVO ESTADO
    const [puzzlePremiumBought, setPuzzlePremiumBought] = useState(0);
    const [puzzleReward, setPuzzleReward] = useState(0.10);
    const [puzzleLocked, setPuzzleLocked] = useState(false);
    const [puzzleTimeLeft, setPuzzleTimeLeft] = useState("48h 00m");

    const [showVipStore, setShowVipStore] = useState(false); 
    const [winnersList, setWinnersList] = useState<WheelWinner[]>([]);
    const [activeTab, setActiveTab] = useState<'crypto' | 'points'>('crypto');

    const isFlashSaleActive = true; 
    const isBlackMarketUnlocked = dailySpinsUsed >= MAX_DAILY_SPINS && adSpinsUsed >= MAX_AD_SPINS;
    const isFeverReady = isBlackMarketUnlocked;

    const WHEEL_ITEMS = [
        { value: '1TON',   label: "1 TON",  sub: "JACKPOT", color: "#0088CC", textCol: "#fff" }, 
        { value: 50000,    label: "50K",    sub: "PTS",     color: "#222",    textCol: "#fff" }, 
        { value: '0.01TON',label: isFlashSaleActive ? "0.02" : "0.01", sub: "TON", color: isFlashSaleActive ? "#FF0055" : "#00F2FE", textCol: "#fff" }, 
        isFeverReady 
            ? { value: 'PUZZLE', label: "+1",   sub: "PIEZA", color: "#FFD700", textCol: "#000" }
            : { value: 100000,   label: "100K", sub: "PTS",   color: "#7B2CBF", textCol: "#fff" }, 
        { value: '0.03TON',label: isFlashSaleActive ? "0.06" : "0.03", sub: "TON", color: isFlashSaleActive ? "#FF0055" : "#00F2FE", textCol: "#fff" }, 
        isFeverReady 
            ? { value: '0.05TON',label: isFlashSaleActive ? "0.10" : "0.05", sub: "TON", color: "#FF0055", textCol: "#fff" }
            : { value: 0,        label: "FAIL", sub: "SKULL", color: "#111",    textCol: "#FF0055" }, 
        isFeverReady
            ? { value: '0.10TON',label: isFlashSaleActive ? "0.20" : "0.10", sub: "TON", color: "#FF0055", textCol: "#fff" }
            : { value: 25000,    label: "25K",  sub: "PTS",   color: "#FF9800", textCol: "#fff" },
        isFeverReady
            ? { value: 100000,   label: "100K", sub: "PTS",   color: "#7B2CBF", textCol: "#fff" }
            : { value: 10000,    label: "10K",  sub: "PTS",   color: "#888",    textCol: "#fff" } 
    ];

    // 🔥 FUNCIÓN PARA LEER EL PUZLE DESDE SUPABASE (Blindada Nivel PRO)
    const fetchPuzzleData = useCallback(async () => {
        if (!user) return;
        try {
            // 🔥 CAMBIO PRO 1: Le pedimos a Supabase el dato de piezas compradas
            const { data, error } = await supabase
                .from('user_puzzles')
                .select('pieces_collected, pieces_bought_current_cycle, premium_bought_current_cycle, current_reward, is_locked, expires_at')                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.warn("Puzzle DB Warning:", error.message);
            }

            if (data) {
                setPuzzlePieces(data.pieces_collected || 0);
                // 🔥 CAMBIO PRO 2: Guardamos las piezas compradas en el estado de React
                setPuzzlePiecesBought(data.pieces_bought_current_cycle || 0); 
                setPuzzlePremiumBought(data.premium_bought_current_cycle || 0);
                setPuzzleReward(data.current_reward || 0.10);
                setPuzzleLocked(data.is_locked || false);
                
                if (data.expires_at) {
                    const diff = new Date(data.expires_at).getTime() - new Date().getTime();
                    if (diff > 0) {
                        const h = Math.floor(diff / (1000 * 60 * 60));
                        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        setPuzzleTimeLeft(`${h}h ${m}m`);
                    } else {
                        setPuzzleTimeLeft("0h 0m");
                        setPuzzleLocked(true);
                    }
                }
            }
        } catch (err: unknown) {
            console.error("Error fetching puzzle", err);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchPuzzleData(); 
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
                    } catch (e: unknown) {
                        console.error("Storage parse error", e);
                    }
                }
                setDataLoaded(true); 
            }, 0);
        }
    }, [user, fetchPuzzleData]);

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

    const fetchWinners = async () => {
        const { data, error } = await supabase
            .from('wheel_winners')
            .select('username, prize, status')
            .order('created_at', { ascending: false })
            .limit(50); 
            
        if (!error && data) {
            setWinnersList(data as WheelWinner[]);
        }
    };

    useEffect(() => {
        fetchWinners();
    }, []);

    const registerPointWinner = async (prizeLabel: string) => {
        if (!user) return;
        try {
            const { data: scoreData } = await supabase.from('user_score').select('username').eq('user_id', user.id).single();
            const exactUsername = scoreData?.username || "HiddenUser";

            await supabase.rpc('claim_ton_prize', {
                user_id_in: user.id,
                username_in: exactUsername,
                prize_in: prizeLabel,
                wallet_in: null 
            });
            fetchWinners(); 
        } catch (e: unknown) {
            console.error("Error logging point winner", e);
        }
    };

    const handleBuyMoreSpins = async () => {
        if (!user) return; 
        if (!tonConnectUI.account) {
            alert("❌ Please connect your TON wallet first!");
            return;
        }

        const confirmBuy = window.confirm(`💎 BUY 50,000 POINTS FOR ${EXTRA_SPINS_PRICE_TON} TON?\n\n🎁 BONUS: You will also receive 3 VIP Free Spins!`);
        if(!confirmBuy) return;

        try {
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [{ address: ADMIN_WALLET, amount: (EXTRA_SPINS_PRICE_TON * 1000000000).toString() }],
            };
            const result = await tonConnectUI.sendTransaction(transaction);
            
            if (result) {
                const { data: scoreData } = await supabase.from('user_score').select('username').eq('user_id', user.id).single();
                const exactUsername = scoreData?.username || "HiddenUser";

                const { error: vipError } = await supabase.rpc('buy_vip_tickets', { 
                    user_id_in: user.id, 
                    ton_amount: EXTRA_SPINS_PRICE_TON, 
                    tickets_qty: 3,
                    username_in: exactUsername 
                });
                if (vipError) throw vipError;

                const { error: pointsError } = await supabase.rpc('increment_score', { 
                    p_user_id: user.id, 
                    p_amount: 50000 
                });
                if (pointsError) throw pointsError;

                setPremiumSpins(prev => prev + 3);
                onUpdateScore(prev => prev + 50000); 

                alert("🎉 SUCCESS!\n\n+50,000 Points have been added to your balance.\n+3 VIP Spins are ready to use!");
                try { 
                    if (typeof confetti === 'function') {
                        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                    }
                } catch (e: unknown) {
                    console.log("Confetti animation skipped", e);
                }
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

    const executeSpin = async (spinType: 'premium' | 'daily' | 'ad') => {
        if (spinning || !user?.id) return;

        if (spinType === 'premium') {
            const confirmPremium = window.confirm(`💎 USE 1 VIP TICKET?\n\nThis spin will not consume any points. Guaranteed Wins active!`);
            if(!confirmPremium) return;
        } else {
            if (score < SPIN_COST) {
                alert(`🚫 INSUFFICIENT BALANCE\n\nYou need ${SPIN_COST.toLocaleString()} points to spin.`);
                return;
            }
            if (spinType === 'ad') {
                const confirmAd = window.confirm(`📺 WATCH AD TO UNLOCK SPIN?\n\nThis will cost ${SPIN_COST.toLocaleString()} points.`);
                if(!confirmAd) return;
                
                try {
                    const AdController = window.Adsgram.init({ blockId: "24433" });
                    await AdController.show();
                } catch (err: unknown) {
                    console.log("Ad Error", err);
                    alert("⚠️ You must watch the full video to spin the wheel!");
                    return; 
                }
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

            let rawWonAmount: unknown;

            if (Array.isArray(data) && data.length > 0) {
                const firstItem = data[0] as Record<string, unknown>;
                rawWonAmount = firstItem.prize_value !== undefined ? firstItem.prize_value : (firstItem.reward !== undefined ? firstItem.reward : data[0]);
            } else if (data !== null && typeof data === 'object') {
                const dataObj = data as Record<string, unknown>;
                rawWonAmount = ('prize_value' in dataObj) ? dataObj.prize_value : ('reward' in dataObj ? dataObj.reward : data);
            } else {
                rawWonAmount = data;
            }

            if (rawWonAmount === undefined || rawWonAmount === null) {
                throw new Error("Invalid or empty data returned from database.");
            }
            
            let wonAmount = rawWonAmount as string | number;
            
            if (typeof wonAmount === 'string') {
                wonAmount = wonAmount.replace(/^"|"$/g, '');
                if (/^\d+$/.test(wonAmount)) {
                    wonAmount = parseInt(wonAmount, 10);
                }
            }
            
            let effectiveWonAmount = wonAmount;
            
            if (isFeverReady) {
                if (wonAmount === 0) effectiveWonAmount = '0.05TON';
                if (wonAmount === 10000) effectiveWonAmount = 'PUZZLE';
                if (wonAmount === 25000) effectiveWonAmount = 100000;
            } else {
                if (wonAmount === '0.10TON' || wonAmount === '0.05TON') {
                    effectiveWonAmount = '0.03TON'; 
                }
            }

            const winningIndex = WHEEL_ITEMS.findIndex(item => item.value === effectiveWonAmount);
            const targetIndex = winningIndex !== -1 ? winningIndex : 5;

            const segmentAngle = 360 / WHEEL_ITEMS.length; 
            const centerOffset = segmentAngle / 2; 
            const baseRotation = 360 - (targetIndex * segmentAngle) - centerOffset;
            const randomWobble = Math.floor(Math.random() * (segmentAngle - 10)) - ((segmentAngle - 10) / 2); 
            
            const currentFullSpins = Math.floor(rotation / 360);
            const finalRotation = ((currentFullSpins + 5) * 360) + baseRotation + randomWobble;

            setRotation(finalRotation);

            setTimeout(() => {
                setSpinning(false);
                
                if (spinType === 'premium') setPremiumSpins(prev => prev - 1);
                else if (spinType === 'daily') setDailySpinsUsed(prev => prev + 1);
                else if (spinType === 'ad') setAdSpinsUsed(prev => prev + 1);

                if (typeof effectiveWonAmount === 'string') {
                    if (effectiveWonAmount === 'PUZZLE') {
                        if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 500]);
                        alert(`🧩 PUZZLE PIECE FOUND!\n\nIt has been added to your Gnova Tree.`);
                        fetchPuzzleData(); 
                    } else if (effectiveWonAmount.includes('TON')) {
                        if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200, 100, 500]);
                        
                        const finalPrize = isFlashSaleActive ? `${parseFloat(effectiveWonAmount.replace('TON','')) * 2} TON` : effectiveWonAmount;
                        setWonTonPrize(finalPrize);
                        
                        if (tonConnectUI.account?.address) {
                            setWalletInput(tonConnectUI.account.address);
                        }
                    }
                } else if (typeof effectiveWonAmount === 'number' && effectiveWonAmount > 0) {
                    onUpdateScore(s => s + effectiveWonAmount);
                    if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
                    
                    if (effectiveWonAmount >= 25000) {
                        registerPointWinner(`${(effectiveWonAmount/1000).toFixed(0)}K PTS`);
                    }

                    if (spinType === 'premium') {
                        alert(`🎉 VIP WIN! +${effectiveWonAmount.toLocaleString()} Pts added to balance!`);
                    } else {
                        if (effectiveWonAmount > SPIN_COST) {
                            const profit = effectiveWonAmount - SPIN_COST;
                            alert(`🎉 BIG WIN! You profited +${profit.toLocaleString()} Pts!`);
                        } else if (effectiveWonAmount === SPIN_COST) {
                            alert(`⚖️ Phew! You got your ${effectiveWonAmount.toLocaleString()} points back.`);
                        } else {
                            alert(`📉 Ouch! You only won ${effectiveWonAmount.toLocaleString()} points back.`);
                        }
                    }
                } else {
                    if (window.navigator.vibrate) window.navigator.vibrate(400);
                    alert(FAIL_MESSAGES[failIndex]);
                    
                    setFailIndex((prevIndex) => (prevIndex + 1) % FAIL_MESSAGES.length);
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
            fetchWinners();
        } catch (err: unknown) {
            console.error(err);
            alert("Error submitting claim. Please contact support.");
        }
        setIsSubmittingWallet(false);
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
                    {spinning ? "SPINNING..." : <><span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Ticket size={18} /> PLAY NOW</span><span style={{fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px'}}>COST: {SPIN_COST.toLocaleString()} PTS</span></>}
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

    const cryptoWinners = winnersList.filter(w => w.prize.includes('TON'));
    const pointsWinners = winnersList.filter(w => !w.prize.includes('TON'));

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBottom: '100px', position: 'relative'
        }}>
            
            {!onClose && <PuzzleWidget onClick={() => setShowPuzzleModal(true)} />}

            {onClose && (
                <button onClick={onClose} style={{
                    position:'absolute', top: 10, right: 10, border:'none', color:'#fff', cursor:'pointer',
                    background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '8px', zIndex: 7000
                }}><X size={24}/></button>
            )}

            {isFlashSaleActive && (
                <div style={{ width: '100%', maxWidth: '350px', background: 'linear-gradient(90deg, #FF0055 0%, #FF4400 100%)', borderRadius: '15px', padding: '15px', marginBottom: '25px', boxShadow: '0 10px 25px rgba(255,0,85,0.4)', border: '2px solid #FFAA00', textAlign: 'center', animation: 'pulse 2s infinite', marginTop: onClose ? '40px' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <Flame color="#FFD700" fill="#FFD700" />
                        <h2 style={{ margin: 0, color: '#FFF', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Double Rewards Active!</h2>
                        <Flame color="#FFD700" fill="#FFD700" />
                    </div>
                    <p style={{ margin: '0 0 10px 0', color: '#FFF', fontSize: '13px', fontWeight: 'bold' }}>All TON Micro-Prizes are doubled!</p>
                    <div style={{ background: 'rgba(0,0,0,0.3)', display: 'inline-block', padding: '5px 15px', borderRadius: '20px', color: '#FFD700', fontWeight: '900', fontSize: '18px', letterSpacing: '2px' }}>
                        <Clock size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '5px' }}/> 
                        03:59:59
                    </div>
                </div>
            )}

            <div style={{textAlign:'center', marginBottom:'30px', position:'relative'}}>
                <div style={{position:'absolute', top:'-20px', left:'50%', transform:'translateX(-50%)', width:'150px', height:'150px', background:'radial-gradient(circle, rgba(0, 136, 204, 0.4) 0%, transparent 70%)', zIndex:-1}}></div>
                <h2 style={{
                    color:'#fff', textShadow: isFlashSaleActive ? '0 0 20px #FF0055' : '0 0 20px #0088CC', 
                    fontSize:'32px', margin:0, fontWeight:'900', letterSpacing:'2px', marginTop: '20px'
                }}>
                    GNOVA WHEEL <Diamond size={24} style={{verticalAlign: 'middle', color: isFlashSaleActive ? '#FFD700' : '#00F2FE'}}/>
                </h2>
                <div style={{display:'flex', gap:'10px', justifyContent:'center', marginTop:'10px', fontSize:'11px', fontWeight:'bold', color:'#aaa'}}>
                    <span style={{background:'#222', padding:'4px 10px', borderRadius:'10px', border:'1px solid #444'}}>Free: {MAX_DAILY_SPINS - dailySpinsUsed}</span>
                    <span style={{background:'#222', padding:'4px 10px', borderRadius:'10px', border:'1px solid #4CAF50', color:'#4CAF50'}}>Ads: {MAX_AD_SPINS - adSpinsUsed}</span>
                    <span style={{background:'#222', padding:'4px 10px', borderRadius:'10px', border:'1px solid #FFD700', color:'#FFD700'}}>VIP: {premiumSpins}</span>
                </div>

                <div style={{ margin: '15px auto 0 auto', width: '250px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '5px', border: isFeverReady ? '1px solid #FF0055' : '1px solid #333', boxShadow: isFeverReady ? '0 0 15px rgba(255,0,85,0.4)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', color: isFeverReady ? '#FF0055' : '#888', marginBottom: '4px', padding: '0 5px' }}>
                        <span>{isFeverReady ? '🔥 FEVER MODE READY 🔥' : 'FEVER MODE CHARGE'}</span>
                        <span>{adSpinsUsed}/{MAX_AD_SPINS}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#111', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                            height: '100%', 
                            width: `${(adSpinsUsed / MAX_AD_SPINS) * 100}%`, 
                            background: isFeverReady ? 'linear-gradient(90deg, #FF0055, #FFD700)' : '#4CAF50',
                            transition: 'width 0.5s ease-out' 
                        }}></div>
                    </div>
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
                    borderRadius:'50%', border: isFlashSaleActive ? '2px solid rgba(255, 0, 85, 0.8)' : '2px solid rgba(0, 136, 204, 0.5)',
                    boxShadow: isFlashSaleActive ? '0 0 40px rgba(255, 0, 85, 0.5)' : '0 0 30px rgba(0, 136, 204, 0.3)',
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
                            key={i} text={item.label} sub={item.sub} angle={(i * (360/WHEEL_ITEMS.length)) + (360/WHEEL_ITEMS.length/2)} color={item.textCol} 
                        />
                    ))}
                </div>

                <div style={{
                    position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
                    width:'60px', height:'60px', background:'#111', borderRadius:'50%',
                    border: isFlashSaleActive ? '4px solid #FF0055' : '4px solid #0088CC', display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: isFlashSaleActive ? '0 0 20px #FF0055' : '0 0 20px #0088CC'
                }}>
                    <Diamond size={24} color="#fff" fill={isFlashSaleActive ? "#FF0055" : "#0088CC"} />
                </div>
            </div>

            <div style={{width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                {renderMainButton()}
                
                {/* 🔥 BOTÓN CLÁSICO (EL ANZUELO) 🔥 */}
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
                    <span style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '16px'}}>
                        <Zap size={18} /> GET 50K PTS + 3 VIP SPINS
                    </span>
                    <span style={{fontSize: '11px', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px', color: '#fff'}}>
                        PAY {EXTRA_SPINS_PRICE_TON} TON
                    </span>
                </button>

                {/* 🔥 BOTÓN INTELIGENTE DEL BLACK MARKET 🔥 */}
                {isBlackMarketUnlocked ? (
                    <button 
                        className="btn-neon"
                        onClick={() => setShowVipStore(true)}
                        style={{
                            width: '100%', padding: '16px', fontSize: '16px', 
                            background: 'linear-gradient(90deg, #FF0055 0%, #FF4400 100%)', 
                            color: '#FFF', border: '1px solid #FFAA00', 
                            fontWeight:'900', borderRadius:'14px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                            boxShadow: '0 5px 20px rgba(255,0,85,0.4)', textTransform: 'uppercase', letterSpacing: '1px'
                        }}
                    >
                        <Flame size={20} fill="#FFF" /> ENTER BLACK MARKET
                    </button>
                ) : (
                    <button 
                        onClick={() => alert("🔒 BLACK MARKET LOCKED\n\nYou must complete 3 Daily Spins and 10 Ad Spins today to unlock the exclusive Guaranteed Wins market!")}
                        style={{
                            width: '100%', padding: '16px', fontSize: '14px', 
                            background: 'rgba(255,255,255,0.05)', 
                            color: '#666', border: '1px dashed #444', 
                            fontWeight:'900', borderRadius:'14px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer'
                        }}
                    >
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Lock size={16} /> BLACK MARKET LOCKED</div>
                        <div style={{fontSize: '10px', color: '#555'}}>COMPLETE 13 SPINS TO UNLOCK</div>
                    </button>
                )}

                <button onClick={() => setShowWinners(true)} style={{ width: '100%', padding: '15px', background: '#222', border: '1px solid #444', color: '#FFF', borderRadius: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Trophy size={18} color="#FFD700" /> VIEW LEADERBOARD
                </button>
            </div>

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

            {showWinners && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 10, 0.98)', zIndex: 7500, display: 'flex', flexDirection: 'column', padding: '20px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', marginTop: '40px' }}>
                        <h2 style={{ color: '#FFD700', fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Trophy /> LEADERBOARD</h2>
                        <button onClick={() => setShowWinners(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 7600 }}><X size={28} /></button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <button 
                            onClick={() => setActiveTab('crypto')}
                            style={{ flex: 1, padding: '10px', background: activeTab === 'crypto' ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === 'crypto' ? '1px solid #00F2FE' : '1px solid #333', color: activeTab === 'crypto' ? '#00F2FE' : '#888', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', transition: 'all 0.3s' }}
                        >
                            <Diamond size={16}/> CRYPTO
                        </button>
                        <button 
                            onClick={() => setActiveTab('points')}
                            style={{ flex: 1, padding: '10px', background: activeTab === 'points' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === 'points' ? '1px solid #FFD700' : '1px solid #333', color: activeTab === 'points' ? '#FFD700' : '#888', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', transition: 'all 0.3s' }}
                        >
                            <Star size={16}/> HIGH ROLLERS
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '20px' }}>
                        {(activeTab === 'crypto' ? cryptoWinners : pointsWinners).length === 0 ? (
                            <div style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>No winners yet. Be the first!</div>
                        ) : (
                            (activeTab === 'crypto' ? cryptoWinners : pointsWinners).map((w, index) => (
                                <div key={index} style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>@{w.username}</div>
                                        <div style={{ color: activeTab === 'crypto' ? '#00F2FE' : '#FFD700', fontSize: '16px', fontWeight: '900', marginTop: '4px' }}>{w.prize}</div>
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

            {/* 🔥 EL MODAL DEL PUZLE CONECTADO A LOS ESTADOS REALES 🔥 */}
            {showPuzzleModal && (
                <PuzzleModal 
                    onClose={() => setShowPuzzleModal(false)}
                    piecesCollected={puzzlePieces}
                    piecesBought={puzzlePiecesBought} // 🔥 CAMBIO PRO: Pasamos la variable
                    premiumPiecesBought={puzzlePremiumBought}
                    currentReward={puzzleReward}
                    isLocked={puzzleLocked}
                    timeLeft={puzzleTimeLeft}
                    onPuzzleUpdate={fetchPuzzleData} 
                />
            )}
            
            {showVipStore && (
                <VipStoreModal 
                    onClose={() => setShowVipStore(false)} 
                    userLevel={1} 
                    onUpdateScore={onUpdateScore} 
                    setPremiumSpins={setPremiumSpins} 
                />
            )}
            
            <style>{`
                @keyframes spinSlow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse-dot { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
            `}</style>
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