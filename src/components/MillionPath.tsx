import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { CheckCircle2, Lock, Zap, Trophy, Share2, X, Play, ChevronDown, ChevronUp, Gift, RefreshCcw } from 'lucide-react';

const ADMIN_WALLET_ADDRESS = 'UQD7qJo2-AYe7ehX9_nEk4FutxnmbdiSx3aLlwlB9nENZ43q';

interface PathProgress {
    current_level: number;
    task_a_done: boolean;
    task_b_done: boolean;
    is_completed: boolean;
    task_a_start_value: number | null | undefined;
    task_b_start_value: number | null | undefined;
    reward_5k_claimed: boolean;
    premium_rewards_claimed: number;
}

interface MillionPathProps {
    setGlobalScore: (val: number | ((prev: number) => number)) => void;
    onClose?: () => void; 
}

interface TaskRowProps {
    letter: string;
    desc: string;
    isDone: boolean;
    isLoading: boolean;
    startValue: number | null | undefined;
    currentValue: number;
    targetAmount: number;
    type: string;
    onStart: () => void;
    onVerify: () => void;
}

interface LiveStats {
    score: number;
    total_wealth: number;
    lucky_tickets: number;
    active_stakes: number;
    user_level: number;
    arcade_games_played: number;
    current_streak: number;
    lottery_played: number;
    bounties_done_today: number;
    checked_in_today: boolean;
    new_referrals_since_lvl9: number;
    starter_pack_bought: boolean;
}

const PATH_STEPS = [
    { lvl: 1, title: "Onboarding", taskA: { desc: "Get 5,000 Pts", target: 5000, type: 'wealth' }, taskB: { desc: "Do Daily Check-in", target: 1, type: 'checkin' } },
    { lvl: 2, title: "First Steps", taskA: { desc: "Play 1 Arcade Game", target: 1, type: 'arcade' }, taskB: { desc: "Complete 3 Daily Bounties", target: 3, type: 'bounty' } },
    { lvl: 3, title: "Gamer", taskA: { desc: "Get 15,000 Pts", target: 15000, type: 'wealth' }, taskB: { desc: "Spin Lucky Wheel", target: 1, type: 'lottery' } },
    { lvl: 4, title: "Investor", taskA: { desc: "Hold 1 Lucky Ticket", target: 1, type: 'ticket' }, taskB: { desc: "Have 1 Active Staking", target: 1, type: 'staking' } },
    { lvl: 5, title: "Growing", taskA: { desc: "Get 30,000 Pts", target: 30000, type: 'wealth' }, taskB: { desc: "Play 3 Arcade Games", target: 3, type: 'arcade' } },
    { lvl: 6, title: "Wealth Builder", taskA: { desc: "Have 2 Active Stakings", target: 2, type: 'staking' }, taskB: { desc: "Hold 2 Lucky Tickets", target: 2, type: 'ticket' } },
    { lvl: 7, title: "Dedication", taskA: { desc: "Get 50,000 Pts", target: 50000, type: 'wealth' }, taskB: { desc: "Play 6 Arcade Games", target: 6, type: 'arcade' } },
    { lvl: 8, title: "The Final Boss", taskA: { desc: "Get 80,000 Pts", target: 80000, type: 'wealth' }, taskB: { desc: "Spin Lucky Wheel 2 Times", target: 2, type: 'lottery' } }
];

const STATIC_TYPES = ['wealth', 'ticket', 'staking', 'level', 'level_static', 'streak', 'checkin', 'buy', 'arcade', 'lottery', 'bounty'];

export const MillionPath: React.FC<MillionPathProps> = ({ setGlobalScore, onClose }) => {
    const { user } = useAuth();
    const [tonConnectUI] = useTonConnectUI();
    const [progress, setProgress] = useState<PathProgress>({ 
        current_level: 1, task_a_done: false, task_b_done: false, is_completed: false, 
        task_a_start_value: undefined, task_b_start_value: undefined, reward_5k_claimed: false, premium_rewards_claimed: 0
    });
    const [loading, setLoading] = useState(false);
    
    const [showEpicWin, setShowEpicWin] = useState(false); 
    const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
    
    const [liveStats, setLiveStats] = useState<LiveStats>({
        score: 0, total_wealth: 0, lucky_tickets: 0, active_stakes: 0, user_level: 1,
        arcade_games_played: 0, current_streak: 0, lottery_played: 0, bounties_done_today: 0,
        checked_in_today: false, new_referrals_since_lvl9: 0, starter_pack_bought: false
    });

    const loadProgress = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase.from('user_million_path').select('*').eq('user_id', user.id).single();
        if (data) {
            setProgress({ 
                ...data, 
                premium_rewards_claimed: data.premium_rewards_claimed || 0,
                reward_5k_claimed: data.reward_5k_claimed || false,
                task_a_start_value: data.task_a_start_value !== undefined ? data.task_a_start_value : null,
                task_b_start_value: data.task_b_start_value !== undefined ? data.task_b_start_value : null
            });
        } else if (error?.code === 'PGRST116') {
            await supabase.from('user_million_path').insert([{ user_id: user.id }]);
            setProgress(prev => ({...prev, task_a_start_value: null, task_b_start_value: null}));
        }
    }, [user]);

    // 🔥 SISTEMA DE RESPALDO (FALLBACK) PARA STATS
    const loadLiveStats = useCallback(async () => {
        if (!user) return;
        try {
            // Intento 1: Llamar al RPC
            const { data: userData, error } = await supabase.rpc('get_user_full_stats_for_path', { p_user_id: user.id });
            
            if (!error && userData && userData[0]) {
                setLiveStats(prev => ({ ...prev, ...userData[0] }));
            } else {
                // Intento 2 (FALLBACK): Si el RPC falla o no existe, leer directo de user_score
                const { data: scoreData } = await supabase.from('user_score').select('*').eq('user_id', user.id).single();
                if (scoreData) {
                    setLiveStats(prev => ({
                        ...prev,
                        score: scoreData.score || 0,
                        total_wealth: scoreData.total_wealth || scoreData.score || 0,
                        arcade_games_played: scoreData.arcade_games_played || 0,
                        lottery_played: scoreData.lottery_played || 0,
                        lucky_tickets: scoreData.lucky_tickets || 0
                    }));
                }
            }
        } catch (e) { console.error("Error loading live stats:", e); }
    }, [user]);

    useEffect(() => {
        loadProgress();
        loadLiveStats();
        const handleFocus = () => { loadProgress(); loadLiveStats(); };
        window.addEventListener('focus', handleFocus);

        const interval = setInterval(loadLiveStats, 3000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [loadProgress, loadLiveStats]);

    const getGateCost = (level: number) => {
        if (level <= 6) return 0.35; 
        return 0.45;
    };

    // 🔥 LECTURA BLINDADA: Prioriza el "score" real para tareas de Wealth
    const getStatValueByType = (type: string): number => {
        switch(type) {
            case 'score': return liveStats.score || 0;
            case 'wealth': return liveStats.total_wealth > 0 ? liveStats.total_wealth : (liveStats.score || 0);
            case 'ticket': return liveStats.lucky_tickets || 0;
            case 'staking': return liveStats.active_stakes || 0;
            case 'level': return liveStats.user_level || 1;
            case 'level_static': return liveStats.user_level || 1; 
            case 'arcade': return liveStats.arcade_games_played || 0;
            case 'streak': return liveStats.current_streak || 0;
            case 'lottery': return liveStats.lottery_played || 0;
            case 'bounty': return liveStats.bounties_done_today || 0;
            case 'checkin': return liveStats.checked_in_today ? 1 : 0;
            case 'referral': return liveStats.new_referrals_since_lvl9 || 0;
            case 'buy': return liveStats.starter_pack_bought ? 1 : 0;
            default: return 0;
        }
    };

    const handleStartTask = async (taskLetter: 'A' | 'B', type: string) => {
        if (!user || loading) return;
        setLoading(true);
        
        try {
            const currentValue = getStatValueByType(type) ?? 0;
            const columnToUpdate = taskLetter === 'A' ? 'task_a_start_value' : 'task_b_start_value';
            
            setProgress(prev => ({ ...prev, [columnToUpdate]: currentValue }));

            const { error } = await supabase
                .from('user_million_path')
                .upsert({ 
                    user_id: user.id, 
                    [columnToUpdate]: currentValue 
                })
                .select(); 

            if (error) {
                console.error("Fallo al guardar en DB:", error);
                setProgress(prev => ({ ...prev, [columnToUpdate]: null }));
                alert(`❌ DB Error: ${error.message}`);
            }

        } catch (e) {
            console.error(e);
            alert("Error starting task");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyTask = async (taskLetter: 'A' | 'B', type: string, target: number) => {
        if (!user || loading) return;
        setLoading(true);

        try {
            await loadLiveStats(); 
            const currentValue = getStatValueByType(type) ?? 0;
            const startValue = taskLetter === 'A' ? progress.task_a_start_value : progress.task_b_start_value;
            
            let passed = false;
            let progressAmount = 0;

            if (STATIC_TYPES.includes(type)) {
                progressAmount = currentValue;
                passed = currentValue >= target;
            } else {
                progressAmount = Math.max(0, currentValue - (startValue ?? 0));
                passed = progressAmount >= target;
            }

            if (passed) {
                const updates = taskLetter === 'A' ? { task_a_done: true } : { task_b_done: true };
                await supabase.from('user_million_path').update(updates).eq('user_id', user.id);
                setProgress(prev => ({ ...prev, ...updates }));
                if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
            } else {
                alert(`❌ Mission Incomplete\n\nProgress: ${progressAmount.toLocaleString()} / ${target.toLocaleString()}\n\nKeep grinding!`);
            }
        } catch (error) {
            console.error(error);
            alert("Error verifying task.");
        } finally {
            setLoading(false);
        }
    };

    const handleClaimBaseReward = async () => {
        if (!user || loading || progress.reward_5k_claimed) return;
        setLoading(true);
        try {
            const { error: updateError } = await supabase.from('user_million_path').update({ reward_5k_claimed: true }).eq('user_id', user.id);
            if (updateError) {
                console.error(updateError);
                alert("⚠️ Database Error: Could not verify claim state.");
                setLoading(false);
                return;
            }
            await supabase.rpc('increment_score', { p_user_id: user.id, p_amount: 5000 });
            setGlobalScore(prev => prev + 5000);
            setProgress(prev => ({ ...prev, reward_5k_claimed: true }));
            
            alert("✅ +5,000 PTS SECURED!\n\nNow unlock the Premium Gate to advance and claim your Premium Reward!");
        } catch { 
            alert("Error claiming. Please try again."); 
        }
        setLoading(false);
    };

    const handlePayGateToAdvance = async () => {
        if (!tonConnectUI.connected) return alert("⚠️ Please connect your wallet first.");
        const cost = getGateCost(progress.current_level);
        if (!window.confirm(`🔓 PREMIUM GATE\n\nPay ${cost} TON to unlock Level ${progress.current_level + 1} and your Premium Reward?`)) return;

        setLoading(true);
        try {
            const amountInNano = (cost * 1000000000).toFixed(0);
            const transaction = { validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: ADMIN_WALLET_ADDRESS, amount: amountInNano }] };
            await tonConnectUI.sendTransaction(transaction);
            await advanceLevel();
        } catch (err) {
            console.error(err);
            alert("Transaction cancelled or failed.");
            setLoading(false);
        }
    };

    const advanceLevel = async () => {
        const isFinal = progress.current_level === 8;
        if (isFinal) {
            await supabase.from('user_million_path').update({ is_completed: true }).eq('user_id', user!.id);
            setProgress(prev => ({ ...prev, is_completed: true }));
            alert("🎉 FINAL NODE COMPLETED!\n\nScroll up to the Premium Track to claim your Ultimate Reward!");
            setLoading(false);
        } else {
            const nextLevel = progress.current_level + 1;
            const updates = { 
                current_level: nextLevel, task_a_done: false, task_b_done: false, 
                task_a_start_value: null, task_b_start_value: null, reward_5k_claimed: false
            };
            await supabase.from('user_million_path').update(updates).eq('user_id', user!.id);
            setProgress(prev => ({ ...prev, ...updates }));
            
            if (window.navigator.vibrate) window.navigator.vibrate(300);
            alert(`🔓 GATE UNLOCKED!\n\nLevel ${nextLevel} reached. Scroll up to claim your PTS!`);
            setLoading(false);
        }
    };

    const handleResetPath = async () => {
        if (!user || loading) return;
        if (!tonConnectUI.connected) return alert("⚠️ Please connect your wallet first.");
        
        if (!window.confirm("🔄 PRESTIGE MODE\n\nPay 0.15 TON to reset the entire path and earn another 5,000,000 PTS?")) return;

        setLoading(true);
        try {
            const amountInNano = (0.15 * 1000000000).toFixed(0);
            const transaction = { validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: ADMIN_WALLET_ADDRESS, amount: amountInNano }] };
            await tonConnectUI.sendTransaction(transaction);
            
            const resetData = {
                current_level: 1, 
                task_a_done: false, 
                task_b_done: false, 
                is_completed: false, 
                task_a_start_value: null, 
                task_b_start_value: null, 
                reward_5k_claimed: false, 
                premium_rewards_claimed: 0
            };
            
            await supabase.from('user_million_path').update(resetData).eq('user_id', user.id);
            setProgress(prev => ({ ...prev, ...resetData }));
            setShowEpicWin(false);
            
            alert("🔄 PATH RESET SUCCESSFUL!\n\nGood luck on your next run!");
        } catch (err) {
            console.error(err);
            alert("Transaction cancelled or failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleClaimPremiumReward = async () => {
        if (!user || loading) return;
        setLoading(true);

        const { data, error } = await supabase.rpc('claim_premium_path_reward', { user_id_in: user.id });

        if (!error && data && data[0].success) {
            const newClaimedLevel = data[0].new_claimed_level;
            const rewardAmount = newClaimedLevel === 8 ? 3250000 : 250000;
            
            setGlobalScore(prev => prev + rewardAmount);
            setProgress(prev => ({ ...prev, premium_rewards_claimed: newClaimedLevel }));
            
            if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
            
            if (newClaimedLevel === 8) {
                setShowEpicWin(true);
            } else {
                alert(`🎁 PREMIUM REWARD CLAIMED!\n\n+${rewardAmount.toLocaleString()} PTS added to your balance.`);
            }
        } else {
            alert(data?.[0]?.message || "Error claiming reward.");
        }
        setLoading(false);
    };

    const handleShareVictory = () => {
        const mediaUrl = 'https://gem-nova-tma.vercel.app/epic-win.jpg'; 
        const inviteLink = `https://t.me/Gnovatoken_bot/app?startapp=${user?.id}`;
        try {
            // @ts-expect-error TypeScript
            if (window.Telegram?.WebApp?.shareToStory) {
                // @ts-expect-error TypeScript
                window.Telegram.WebApp.shareToStory(mediaUrl, { text: `🏆 I just unlocked the 5,000,000 Pts Premium Prize on Gnova! Join my squad: ${inviteLink}` });
            } else {
                window.open(`https://t.me/share/url?url=${inviteLink}&text=🏆 I just won 5M Pts on Gnova! Play now!`, '_blank');
            }
        } catch (e) { console.error(e); }
    };

    const toggleHistoryLevel = (level: number) => {
        if (expandedLevel === level) {
            setExpandedLevel(null);
        } else {
            setExpandedLevel(level);
        }
    };

    const renderPremiumTrack = () => {
        const boxes = [];
        for (let i = 1; i <= 8; i++) {
            const isClaimed = progress.premium_rewards_claimed >= i;
            const isUnlocked = progress.is_completed ? true : progress.current_level > i;
            const isNextToClaim = isUnlocked && progress.premium_rewards_claimed === i - 1;
            
            const rewardText = i === 8 ? '3.25M' : '250K';
            
            let bgColor = 'rgba(255,255,255,0.02)';
            let borderColor = '#333';
            let iconColor = '#555';
            
            if (isClaimed) {
                bgColor = 'rgba(76, 175, 80, 0.1)';
                borderColor = '#4CAF50';
                iconColor = '#4CAF50';
            } else if (isNextToClaim) {
                bgColor = i === 8 ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 242, 254, 0.2)';
                borderColor = i === 8 ? '#FFD700' : '#00F2FE';
                iconColor = i === 8 ? '#FFD700' : '#00F2FE';
            }

            boxes.push(
                <div key={i} style={{ 
                    minWidth: '80px', padding: '10px 5px', borderRadius: '10px', 
                    background: bgColor, border: `1px solid ${borderColor}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    boxShadow: isNextToClaim ? `0 0 10px ${borderColor}` : 'none',
                    opacity: (!isUnlocked && !isClaimed) ? 0.5 : 1, transition: 'all 0.3s'
                }}>
                    <div style={{ fontSize: '10px', color: '#aaa', fontWeight: 'bold' }}>LVL {i}</div>
                    {isClaimed ? (
                        <CheckCircle2 size={20} color={iconColor} />
                    ) : isUnlocked ? (
                        <Gift size={20} color={iconColor} style={{ animation: isNextToClaim ? 'bounce 1s infinite' : 'none' }} />
                    ) : (
                        <Lock size={20} color={iconColor} />
                    )}
                    <div style={{ fontSize: '12px', fontWeight: '900', color: isNextToClaim ? '#fff' : iconColor }}>{rewardText}</div>
                </div>
            );
        }
        return boxes;
    };

    if (showEpicWin) {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(0,0,0,0.95) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="confetti" style={{ position:'absolute', top:0, left:'20%', width:'10px', height:'10px', background:'#00F2FE', animation:'fall 3s linear infinite' }}></div>
                <div className="confetti" style={{ position:'absolute', top:0, left:'50%', width:'10px', height:'10px', background:'#FFD700', animation:'fall 2s linear infinite' }}></div>
                <div className="confetti" style={{ position:'absolute', top:0, left:'80%', width:'10px', height:'10px', background:'#E040FB', animation:'fall 4s linear infinite' }}></div>
                
                {/* BOTON X EPIC WIN BAJADO */}
                <button onClick={() => setShowEpicWin(false)} style={{ position: 'fixed', top: 60, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%', padding: '10px', color: '#fff', cursor: 'pointer', zIndex: 10000 }}><X size={24} /></button>
                
                <div style={{ animation: 'bounce 2s infinite', zIndex: 2 }}><Trophy size={100} color="#FFD700" style={{ filter: 'drop-shadow(0 0 30px #FFD700)' }} /></div>
                <h1 style={{ color: '#FFD700', fontSize: '42px', textAlign: 'center', margin: '20px 0 10px', textShadow: '0 0 20px #FFD700', fontFamily: 'monospace', zIndex: 2 }}>GOD MODE<br/>UNLOCKED</h1>
                <div style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid #FFD700', padding: '20px 40px', borderRadius: '20px', marginBottom: '30px', boxShadow: '0 0 40px rgba(255,215,0,0.3)', zIndex: 2 }}>
                    <div style={{ color: '#fff', fontSize: '14px', textAlign: 'center', marginBottom: '5px', letterSpacing:'2px' }}>ULTIMATE REWARD SECURED</div>
                    <div style={{ color: '#4CAF50', fontSize: '38px', fontWeight: '900', textShadow: '0 0 15px rgba(76,175,80,0.5)' }}>+3,250,000 PTS</div>
                </div>
                
                <div style={{display:'flex', flexDirection:'column', gap:'15px', width:'100%', maxWidth:'300px', zIndex:2}}>
                    <button onClick={handleShareVictory} className="btn-neon" style={{ background: 'linear-gradient(90deg, #FFD700, #FFA500)', color: '#000', border: 'none', padding: '15px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 0 30px rgba(255,215,0,0.5)', cursor: 'pointer', borderRadius: '30px', fontWeight: 'bold' }}>
                        <Share2 size={20} /> BRAG ON TG STORY
                    </button>
                    
                    <button onClick={handleResetPath} disabled={loading} className="btn-neon" style={{ background: 'transparent', color: '#00F2FE', border: '1px solid #00F2FE', padding: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', borderRadius: '30px', fontWeight: 'bold' }}>
                        <RefreshCcw size={20} /> RESTART PATH (0.15 TON)
                    </button>
                </div>

                <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } } @keyframes fall { 0% { transform: translateY(-100px) rotate(0deg); opacity: 1; } 100% { transform: translateY(800px) rotate(360deg); opacity: 0; } }`}</style>
            </div>
        );
    }

    const currentStepConfig = PATH_STEPS[Math.min(progress.current_level - 1, 7)];
    const hasUnclaimedPremium = (progress.is_completed && progress.premium_rewards_claimed < 8) || (!progress.is_completed && progress.premium_rewards_claimed < progress.current_level - 1);

    const totalClaimed = progress.premium_rewards_claimed < 8 
        ? progress.premium_rewards_claimed * 250000 
        : 5000000;
    const progressPercent = (totalClaimed / 5000000) * 100;

    return (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(5, 5, 10, 0.95)', zIndex: 5000, 
            overflowY: 'auto', padding: '20px', paddingBottom: '100px', backdropFilter: 'blur(10px)'
        }}>
            {/* 🔥 BOTÓN CERRAR GENERAL */}
            {onClose && (
                <button onClick={onClose} style={{
                    position:'fixed', top: 60, right: 20, border:'none', color:'#fff', cursor:'pointer',
                    background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '8px', zIndex: 9999
                }}>
                    <X size={24}/>
                </button>
            )}

            <div style={{ textAlign: 'center', marginBottom: '25px', marginTop: '40px' }}>
                <h2 style={{ color: '#fff', fontSize: '28px', margin: 0, textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>THE 5M PATH</h2>
                <p style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px' }}>PREMIUM BATTLE PASS</p>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px', transform: 'scale(0.8)' }}>
                    <TonConnectButton />
                </div>
            </div>

            {/* MASTER PROGRESS BAR */}
            <div className="glass-card" style={{ padding: '15px', marginBottom: '25px', background: 'rgba(255, 215, 0, 0.05)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#FFD700', letterSpacing: '1px', marginBottom: '8px', fontWeight: '900' }}>
                    ULTIMATE REWARD POOL
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                    <span style={{ color: '#fff' }}>{totalClaimed.toLocaleString()} <span style={{fontSize:'9px', color:'#aaa'}}>CLAIMED</span></span>
                    <span style={{ color: '#FFD700' }}>5,000,000 PTS</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '5px', overflow: 'hidden', border: '1px solid #444' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #FF8C00, #FFD700)', boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)', transition: 'width 0.5s ease-in-out' }}></div>
                </div>
            </div>

            {/* PREMIUM REWARD TRACK */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ color: '#00F2FE', fontSize: '12px', margin: 0, letterSpacing: '1px' }}>PREMIUM REWARDS</h4>
                    {hasUnclaimedPremium && (
                        <button onClick={handleClaimPremiumReward} disabled={loading} className="btn-neon" style={{ background: '#00F2FE', color: '#000', border: 'none', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', borderRadius: '20px', cursor: 'pointer', boxShadow: '0 0 10px rgba(0, 242, 254, 0.4)' }}>
                            CLAIM REWARD!
                        </button>
                    )}
                </div>
                <div className="no-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px', maskImage: 'linear-gradient(to right, black 90%, transparent)' }}>
                    {renderPremiumTrack()}
                </div>
            </div>

            {/* ROADMAP VERTICAL */}
            <div style={{ marginBottom: '30px' }}>
                <h4 style={{ color: '#aaa', fontSize: '12px', marginBottom: '15px', letterSpacing: '1px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>MISSION ROADMAP</h4>
                
                {/* BOTÓN PRESTIGIO */}
                {progress.is_completed && progress.premium_rewards_claimed === 8 && (
                    <div style={{ background: 'rgba(0, 242, 254, 0.1)', border: '1px dashed #00F2FE', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
                        <RefreshCcw size={40} color="#00F2FE" style={{ marginBottom: '10px' }}/>
                        <h3 style={{ margin: '0 0 10px', color: '#fff', fontSize: '18px' }}>PATH COMPLETED</h3>
                        <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '15px' }}>Want to earn another 5,000,000 Points? Reset your path and start over!</p>
                        <button onClick={handleResetPath} disabled={loading} className="btn-neon" style={{ width: '100%', background: '#00F2FE', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <Zap size={16} /> PAY 0.15 TON TO RESTART
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '10px', borderLeft: '2px solid #333', marginLeft: '10px' }}>
                    
                    {PATH_STEPS.map(step => {
                        const isPast = step.lvl < progress.current_level;
                        const isCurrent = step.lvl === progress.current_level && !progress.is_completed;
                        const isFuture = step.lvl > progress.current_level;
                        const isCompletedMode = progress.is_completed && step.lvl === 8;

                        // RENDER DE NIVELES PASADOS
                        if (isPast || isCompletedMode) {
                            return (
                                <div key={step.lvl} style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-16px', top: '15px', background: '#4CAF50', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #000' }}></div>
                                    <div onClick={() => toggleHistoryLevel(step.lvl)} style={{ padding: '10px', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '8px', width: '100%', cursor: 'pointer', transition: 'all 0.3s' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>Level {step.lvl}</div>
                                                <div style={{ color: '#aaa', fontSize: '10px', textDecoration: 'line-through' }}>{step.title}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <CheckCircle2 size={16} color="#4CAF50" />
                                                {expandedLevel === step.lvl ? <ChevronUp size={16} color="#4CAF50" /> : <ChevronDown size={16} color="#4CAF50" />}
                                            </div>
                                        </div>
                                        {expandedLevel === step.lvl && (
                                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(76, 175, 80, 0.3)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: 'rgba(76, 175, 80, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#4CAF50', fontWeight: 'bold' }}>A</div><div style={{ fontSize: '10px', color: '#888', textDecoration: 'line-through' }}>{step.taskA.desc}</div></div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: 'rgba(76, 175, 80, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#4CAF50', fontWeight: 'bold' }}>B</div><div style={{ fontSize: '10px', color: '#888', textDecoration: 'line-through' }}>{step.taskB.desc}</div></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // RENDER DEL NIVEL ACTUAL
                        if (isCurrent) {
                            return (
                                <div key={step.lvl} style={{ position: 'relative', margin: '15px 0' }}>
                                    <div style={{ position: 'absolute', left: '-18px', top: '15px', background: '#00F2FE', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #000', boxShadow: '0 0 10px #00F2FE' }}></div>
                                    <div className="glass-card" style={{ border: '1px solid #00F2FE', background: 'rgba(0, 242, 254, 0.05)', boxShadow: '0 0 20px rgba(0, 242, 254, 0.1)', position: 'relative', padding: '15px' }}>
                                        <div style={{ position: 'absolute', top: -12, left: 20, background: '#00F2FE', color: '#000', padding: '4px 12px', borderRadius: '12px', fontWeight: '900', fontSize: '12px' }}>CURRENT NODE</div>
                                        <h3 style={{ marginTop: '10px', color: '#fff', textAlign: 'center' }}>{currentStepConfig.title}</h3>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                            <TaskRow 
                                                letter="A" desc={currentStepConfig.taskA.desc} isDone={progress.task_a_done} isLoading={loading} 
                                                startValue={progress.task_a_start_value} currentValue={getStatValueByType(currentStepConfig.taskA.type)} targetAmount={currentStepConfig.taskA.target} type={currentStepConfig.taskA.type}
                                                onStart={() => handleStartTask('A', currentStepConfig.taskA.type)} 
                                                onVerify={() => handleVerifyTask('A', currentStepConfig.taskA.type, currentStepConfig.taskA.target)} 
                                            />
                                            <TaskRow 
                                                letter="B" desc={currentStepConfig.taskB.desc} isDone={progress.task_b_done} isLoading={loading} 
                                                startValue={progress.task_b_start_value} currentValue={getStatValueByType(currentStepConfig.taskB.type)} targetAmount={currentStepConfig.taskB.target} type={currentStepConfig.taskB.type}
                                                onStart={() => handleStartTask('B', currentStepConfig.taskB.type)} 
                                                onVerify={() => handleVerifyTask('B', currentStepConfig.taskB.type, currentStepConfig.taskB.target)} 
                                            />
                                        </div>

                                        {/* PEAJE PREMIUM */}
                                        {progress.task_a_done && progress.task_b_done && (
                                            <div style={{ marginTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '15px' }}>
                                                {!progress.reward_5k_claimed ? (
                                                    <button onClick={handleClaimBaseReward} disabled={loading} className="btn-neon" style={{ width: '100%', background: '#4CAF50', color: '#000', border: 'none', padding: '15px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 0 20px rgba(76, 175, 80, 0.4)' }}>
                                                        <Gift size={18} /> CLAIM 5,000 PTS
                                                    </button>
                                                ) : (
                                                    <div>
                                                        <div style={{ textAlign: 'center', fontSize: '10px', color: '#FFD700', marginBottom: '10px', fontWeight: 'bold' }}>🔓 PREMIUM GATE TO UNLOCK NEXT LEVEL</div>
                                                        <button onClick={handlePayGateToAdvance} disabled={loading} className="btn-cyber" style={{ width: '100%', background: '#FFD700', color: '#000', border: 'none', fontSize: '14px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                            <Zap size={16} fill="#000" /> PAY {getGateCost(progress.current_level)} TON TO ADVANCE
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // 🔥 RENDER DE NIVELES FUTUROS CON TAREAS Y COSTOS VISIBLES
                        if (isFuture) {
                            return (
                                <div key={step.lvl} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', position: 'relative', marginTop: '10px' }}>
                                    <div style={{ position: 'absolute', left: '-16px', top: '15px', background: '#111', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #444' }}></div>
                                    <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', width: '100%', border: '1px solid #222', position: 'relative', overflow: 'hidden' }}>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <div>
                                                <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>Level {step.lvl}</div>
                                                <div style={{ color: '#666', fontSize: '10px' }}>{step.title}</div>
                                            </div>
                                            <div style={{ background: 'rgba(255, 0, 85, 0.1)', border: '1px solid rgba(255, 0, 85, 0.3)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Lock size={12} color="#FF0055" />
                                                <span style={{ fontSize: '10px', color: '#FF0055', fontWeight: 'bold' }}>{getGateCost(step.lvl - 1)} TON REQ.</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', opacity: 0.3 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: '#333', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#888', fontWeight: 'bold' }}>A</div><div style={{ fontSize: '11px', color: '#888' }}>{step.taskA.desc}</div></div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '16px', height: '16px', background: '#333', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#888', fontWeight: 'bold' }}>B</div><div style={{ fontSize: '11px', color: '#888' }}>{step.taskB.desc}</div></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })}
                </div>
            </div>

            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
};

const TaskRow: React.FC<TaskRowProps> = ({ letter, desc, isDone, isLoading, startValue, currentValue, targetAmount, type, onStart, onVerify }) => {
    // Si startValue es undefined, el backend todavía no carga
    if (startValue === undefined) return <div style={{ height: '50px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>;

    const isStarted = startValue !== null;
    let progressVisual = 0;
    
    if (isStarted && !isDone) {
        if (STATIC_TYPES.includes(type)) progressVisual = currentValue;
        else progressVisual = Math.max(0, currentValue - startValue);
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isDone ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: isDone ? '1px solid #4CAF50' : '1px solid #333' }}>
            <div style={{ background: isDone ? '#4CAF50' : '#333', color: isDone ? '#000' : '#888', width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>{letter}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: isDone ? '#fff' : '#aaa', fontWeight: isDone ? 'bold' : 'normal' }}>{desc}</div>
                {isStarted && !isDone && (
                    <div style={{ fontSize: '9px', color: '#00F2FE', marginTop: '2px' }}>Progress: {Math.min(progressVisual, targetAmount).toLocaleString()} / {targetAmount.toLocaleString()}</div>
                )}
            </div>
            {isDone ? (
                <CheckCircle2 size={24} color="#4CAF50" />
            ) : !isStarted ? (
                <button onClick={onStart} disabled={isLoading} style={{ background: '#FFD700', color: '#000', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                    <Play size={10} fill="#000"/> START
                </button>
            ) : (
                <button onClick={onVerify} disabled={isLoading} style={{ background: '#00F2FE', color: '#000', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>VERIFY</button>
            )}
        </div>
    );
};