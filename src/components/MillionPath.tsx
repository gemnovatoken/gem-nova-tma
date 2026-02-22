import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { CheckCircle2, Lock, Zap, Users, Trophy, Share2, X, Medal } from 'lucide-react';

const ADMIN_WALLET_ADDRESS = 'UQD7qJo2-AYe7ehX9_nEk4FutxnmbdiSx3aLlwlB9nENZ43q';

interface PathProgress {
    current_level: number;
    task_a_done: boolean;
    task_b_done: boolean;
    is_completed: boolean;
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
    onVerify: () => void;
}

const PATH_STEPS = [
    { lvl: 1, title: "Onboarding", taskA: "Get 5,000 Pts Available", taskB: "Do Daily Check-in Today" },
    { lvl: 2, title: "Financial Literacy", taskA: "Have 15,000 Pts Total Wealth", taskB: "Complete 1 Daily Bounty" },
    { lvl: 3, title: "Effort Filter", taskA: "Get 1 Lucky Ticket", taskB: "Have 1 Active Staking Deposit" },
    { lvl: 4, title: "In-App Engagement", taskA: "Upgrade Account to Level 3", taskB: "Play 10 Arcade Games" },
    { lvl: 5, title: "Medium Commitment", taskA: "Reach 3-Day Check-in Streak", taskB: "Play Lottery Event" },
    { lvl: 6, title: "Economic Filter", taskA: "Have 2 Active Stakings", taskB: "Get 2 Lucky Tickets Total" },
    { lvl: 7, title: "Wealth Growth", taskA: "Have 500,000 Pts Total Wealth", taskB: "Complete Both Daily Bounties" },
    { lvl: 8, title: "Network Expansion", taskA: "Upgrade Account to Level 4", taskB: "Play 15 Arcade Games" },
    { lvl: 9, title: "The Time Wall", taskA: "Reach 5-Day Check-in Streak", taskB: "Invite 2 New Agents" },
    { lvl: 10, title: "The Final Boss", taskA: "Buy Starter Node (0.15 TON)", taskB: "Get 3 Lucky Tickets Total" }
];

export const MillionPath: React.FC<MillionPathProps> = ({ setGlobalScore }) => {
    const { user } = useAuth();
    const [tonConnectUI] = useTonConnectUI();
    const [progress, setProgress] = useState<PathProgress>({ current_level: 1, task_a_done: false, task_b_done: false, is_completed: false });
    const [loading, setLoading] = useState(false);
    
    // 🔥 Controladores del Modal Épico
    const [showEpicWin, setShowEpicWin] = useState(false); 
    const [hasClaimedReward, setHasClaimedReward] = useState(false); // Para no dar los 2.5M dos veces

    useEffect(() => {
        if (!user) return;
        const fetchProgress = async () => {
            const { data, error } = await supabase.from('user_million_path').select('*').eq('user_id', user.id).single();
            if (data) {
                setProgress(data);
                // Si ya está completado en DB, no abrimos el modal automáticamente al cargar,
                // solo si acaba de completarlo.
                if (data.is_completed) setHasClaimedReward(true);
            } else if (error?.code === 'PGRST116') {
                await supabase.from('user_million_path').insert([{ user_id: user.id }]);
            }
        };
        fetchProgress();
    }, [user]);

    const getSkipCost = (level: number) => {
        if (level <= 5) return { ton: 0.10, refs: 1 };
        if (level <= 8) return { ton: 0.15, refs: 1 };
        return { ton: 0.20, refs: 2 };
    };

    const handleSkipWithTON = async () => {
        if (!tonConnectUI.connected) return alert("⚠️ Please connect your wallet first.");
        const cost = getSkipCost(progress.current_level);
        
        if (!window.confirm(`⚠️ OVERRIDE PROTOCOL\n\nSkip Level ${progress.current_level} for ${cost.ton} TON?`)) return;

        setLoading(true);
        try {
            const amountInNano = (cost.ton * 1000000000).toFixed(0);
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [{ address: ADMIN_WALLET_ADDRESS, amount: amountInNano }],
            };

            await tonConnectUI.sendTransaction(transaction);
            await advanceLevel();
        } catch (err) {
            console.error(err);
            alert("Transaction cancelled or failed.");
        } finally {
            setLoading(false);
        }
    };

    // VALIDADOR MAESTRO
    const handleVerifyTask = async (taskLetter: 'A' | 'B') => {
        if (!user || loading) return;
        setLoading(true);

        try {
            const { data: userData } = await supabase.rpc('get_user_full_stats_for_path', { p_user_id: user.id });
            const stats = userData?.[0] || {};
            
            let passed = false;
            let errorMessage = "Requirements not met yet. Keep grinding!";
            const lvl = progress.current_level;

            if (lvl === 1) {
                if (taskLetter === 'A') { passed = (stats.score >= 5000); errorMessage = `You only have ${stats.score || 0} Pts.`; }
                if (taskLetter === 'B') { passed = (stats.checked_in_today === true); errorMessage = "You haven't claimed your daily check-in today."; }
            }
            else if (lvl === 2) {
                if (taskLetter === 'A') { passed = (stats.total_wealth >= 15000); errorMessage = `Your Total Wealth is ${stats.total_wealth || 0} Pts.`; }
                if (taskLetter === 'B') { passed = (stats.bounties_done_today >= 1); errorMessage = "Go to Mission Zone and complete at least 1 bounty."; }
            }
            else if (lvl === 3) {
                if (taskLetter === 'A') { passed = (stats.lucky_tickets >= 1); errorMessage = "You don't have any Lucky Tickets."; }
                if (taskLetter === 'B') { passed = (stats.active_stakes >= 1); errorMessage = "You need at least 1 active staking deposit."; }
            }
            else if (lvl === 4) {
                if (taskLetter === 'A') { passed = (stats.user_level >= 3); errorMessage = `You are Level ${stats.user_level || 1}. Upgrade in Shop.`; }
                if (taskLetter === 'B') { passed = (stats.arcade_games_played >= 10); errorMessage = `You've played ${stats.arcade_games_played || 0}/10 games.`; }
            }
            else if (lvl === 5) {
                if (taskLetter === 'A') { passed = (stats.current_streak >= 3); errorMessage = `Your streak is ${stats.current_streak || 0} Days.`; }
                if (taskLetter === 'B') { passed = (stats.lottery_played >= 1); errorMessage = "You haven't played the Lottery yet."; }
            }
            else if (lvl === 6) {
                if (taskLetter === 'A') { passed = (stats.active_stakes >= 2); errorMessage = `You have ${stats.active_stakes || 0}/2 active stakings.`; }
                if (taskLetter === 'B') { passed = (stats.lucky_tickets >= 2); errorMessage = `You have ${stats.lucky_tickets || 0}/2 Lucky Tickets.`; }
            }
            else if (lvl === 7) {
                if (taskLetter === 'A') { passed = (stats.total_wealth >= 500000); errorMessage = `Your Total Wealth is ${stats.total_wealth || 0} Pts.`; }
                if (taskLetter === 'B') { passed = (stats.bounties_done_today >= 2); errorMessage = "You need to complete BOTH daily bounties today."; }
            }
            else if (lvl === 8) {
                if (taskLetter === 'A') { passed = (stats.user_level >= 4); errorMessage = `You are Level ${stats.user_level || 1}. Upgrade in Shop.`; }
                if (taskLetter === 'B') { passed = (stats.arcade_games_played >= 15); errorMessage = `You've played ${stats.arcade_games_played || 0}/15 games.`; }
            }
            else if (lvl === 9) {
                if (taskLetter === 'A') { passed = (stats.current_streak >= 5); errorMessage = `Your streak is ${stats.current_streak || 0} Days.`; }
                if (taskLetter === 'B') { passed = (stats.new_referrals_since_lvl9 >= 2); errorMessage = "You haven't invited 2 new friends yet."; } 
            }
            else if (lvl === 10) {
                if (taskLetter === 'A') { passed = (stats.starter_pack_bought === true); errorMessage = "You haven't bought the Starter Node."; }
                if (taskLetter === 'B') { passed = (stats.lucky_tickets >= 3); errorMessage = `You have ${stats.lucky_tickets || 0}/3 Lucky Tickets.`; }
            }

            if (passed) {
                const updates = taskLetter === 'A' ? { task_a_done: true } : { task_b_done: true };
                await supabase.from('user_million_path').update(updates).eq('user_id', user.id);
                setProgress(prev => ({ ...prev, ...updates }));
                
                if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
            } else {
                alert(`❌ Verification Failed\n\n${errorMessage}`);
            }

        } catch (error) {
            console.error(error);
            alert("Error connecting to server. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const advanceLevel = async () => {
        const isFinal = progress.current_level === 10;
        
        if (isFinal) {
            await supabase.from('user_million_path').update({ is_completed: true }).eq('user_id', user!.id);
            
            // Solo sumamos los puntos si no los había reclamado antes (seguridad extra)
            if (!hasClaimedReward) {
                await supabase.rpc('increment_score', { p_user_id: user!.id, p_amount: 2500000 });
                setGlobalScore(prev => prev + 2500000);
                setHasClaimedReward(true);
            }
            
            setProgress(prev => ({ ...prev, is_completed: true }));
            setShowEpicWin(true); // Abrimos el modal de victoria
        } else {
            await supabase.rpc('increment_score', { p_user_id: user!.id, p_amount: 5000 });
            setGlobalScore(prev => prev + 5000);
            
            const nextLevel = progress.current_level + 1;
            const updates = { current_level: nextLevel, task_a_done: false, task_b_done: false };
            await supabase.from('user_million_path').update(updates).eq('user_id', user!.id);
            setProgress(prev => ({ ...prev, ...updates }));
            
            if (window.navigator.vibrate) window.navigator.vibrate(300);
            alert(`✅ LEVEL ${progress.current_level} CLEARED!\n\n+5,000 PTS awarded. Proceed to Level ${nextLevel}.`);
        }
    };

    useEffect(() => {
        if (progress.task_a_done && progress.task_b_done && !progress.is_completed) {
            advanceLevel();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progress.task_a_done, progress.task_b_done]);

    const handleShareVictory = () => {
        const mediaUrl = 'https://gem-nova-tma.vercel.app/epic-win.jpg'; 
        const inviteLink = `https://t.me/Gnovatoken_bot/app?startapp=${user?.id}`;
        try {
            // @ts-expect-error TypeScript does not know about Telegram WebApp API
            if (window.Telegram?.WebApp?.shareToStory) {
                // @ts-expect-error TypeScript does not know about Telegram WebApp API
                window.Telegram.WebApp.shareToStory(mediaUrl, {
                    text: `🏆 I just beat the Ultimate Protocol and won 2.5M Pts on Gnova! Join my squad: ${inviteLink}`
                });
            } else {
                window.open(`https://t.me/share/url?url=${inviteLink}&text=🏆 I just won 2.5M Pts on Gnova! Play now!`, '_blank');
            }
        } catch (e) { console.error(e); }
    };

    // 🔥 PANTALLA ÉPICA DE VICTORIA (MODAL)
    if (showEpicWin) {
        return (
            <div style={{ 
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
                background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(0,0,0,0.95) 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}>
                {/* 🌟 CONFETI CSS BÁSICO */}
                <div className="confetti" style={{ position:'absolute', top:0, left:'20%', width:'10px', height:'10px', background:'#00F2FE', animation:'fall 3s linear infinite' }}></div>
                <div className="confetti" style={{ position:'absolute', top:0, left:'50%', width:'10px', height:'10px', background:'#FFD700', animation:'fall 2s linear infinite' }}></div>
                <div className="confetti" style={{ position:'absolute', top:0, left:'80%', width:'10px', height:'10px', background:'#E040FB', animation:'fall 4s linear infinite' }}></div>

                {/* BOTÓN CERRAR ACCESIBLE (Z-INDEX ALTO) */}
                <button onClick={() => setShowEpicWin(false)} style={{ position: 'absolute', top: 30, right: 30, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%', padding: '10px', color: '#fff', cursor: 'pointer', zIndex: 10000 }}>
                    <X size={24} />
                </button>
                
                <div style={{ animation: 'bounce 2s infinite', zIndex: 2 }}>
                    <Trophy size={100} color="#FFD700" style={{ filter: 'drop-shadow(0 0 30px #FFD700)' }} />
                </div>
                
                <h1 style={{ color: '#FFD700', fontSize: '42px', textAlign: 'center', margin: '20px 0 10px', textShadow: '0 0 20px #FFD700', fontFamily: 'monospace', zIndex: 2 }}>
                    GOD MODE<br/>UNLOCKED
                </h1>
                
                <div style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid #FFD700', padding: '20px 40px', borderRadius: '20px', marginBottom: '30px', boxShadow: '0 0 40px rgba(255,215,0,0.3)', zIndex: 2 }}>
                    <div style={{ color: '#fff', fontSize: '14px', textAlign: 'center', marginBottom: '5px', letterSpacing:'2px' }}>REWARD SECURED</div>
                    <div style={{ color: '#4CAF50', fontSize: '38px', fontWeight: '900', textShadow: '0 0 15px rgba(76,175,80,0.5)' }}>+2,500,000 PTS</div>
                </div>

                <p style={{ color: '#aaa', textAlign: 'center', fontSize: '14px', marginBottom: '40px', maxWidth: '300px', lineHeight:'1.5', zIndex: 2 }}>
                    You have conquered the Ultimate Protocol. Your legacy is now permanently inscribed in the blockchain.
                </p>

                <button onClick={handleShareVictory} className="btn-neon" style={{ background: 'linear-gradient(90deg, #FFD700, #FFA500)', color: '#000', border: 'none', padding: '18px 40px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 0 30px rgba(255,215,0,0.5)', cursor: 'pointer', zIndex: 2, borderRadius: '30px' }}>
                    <Share2 size={24} /> BRAG ON TG STORY
                </button>
                
                <style>{`
                    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                    @keyframes fall { 0% { transform: translateY(-100px) rotate(0deg); opacity: 1; } 100% { transform: translateY(800px) rotate(360deg); opacity: 0; } }
                `}</style>
            </div>
        );
    }

    const currentStepConfig = PATH_STEPS[progress.current_level - 1];
    const skipCost = getSkipCost(progress.current_level);

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#fff', fontSize: '28px', margin: 0, textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>THE 2.5M PATH</h2>
                <p style={{ color: '#00F2FE', fontSize: '12px', letterSpacing: '2px' }}>ULTIMATE PROTOCOL</p>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px', transform: 'scale(0.8)' }}>
                    <TonConnectButton />
                </div>
            </div>

            {/* 🔥 HISTORIAL (Niveles Completados - Scroll Up) */}
            {progress.current_level > 1 && (
                <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ color: '#4CAF50', fontSize: '12px', marginBottom: '10px', letterSpacing: '1px' }}>COMPLETED NODES</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '10px', borderLeft: '2px solid #4CAF50', marginLeft: '10px' }}>
                        {PATH_STEPS.slice(0, progress.current_level - (progress.is_completed ? 0 : 1)).map(step => (
                            <div key={step.lvl} style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '-16px', background: '#4CAF50', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #000' }}></div>
                                <div style={{ padding: '10px', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '8px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>Level {step.lvl}</div>
                                        <div style={{ color: '#aaa', fontSize: '10px', textDecoration: 'line-through' }}>{step.title}</div>
                                    </div>
                                    <CheckCircle2 size={16} color="#4CAF50" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 🔥 VISTA SI ESTÁ COMPLETADO TODO EL MAPA */}
            {progress.is_completed ? (
                <div 
                    onClick={() => setShowEpicWin(true)}
                    className="glass-card" 
                    style={{ 
                        border: '2px solid #FFD700', background: 'rgba(255, 215, 0, 0.05)', 
                        boxShadow: '0 0 30px rgba(255, 215, 0, 0.2)', marginBottom: '30px', 
                        padding: '30px 20px', textAlign: 'center', cursor: 'pointer',
                        transition: 'transform 0.2s', transform: 'scale(1)'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Medal size={40} color="#FFD700" style={{ margin: '0 auto 10px' }} />
                    <h3 style={{ color: '#FFD700', margin: '0 0 5px 0', fontSize: '20px' }}>PROTOCOL COMPLETED</h3>
                    <p style={{ color: '#aaa', fontSize: '12px', margin: 0 }}>Tap to view your Golden Certificate</p>
                </div>
            ) : (
                /* NODO ACTUAL (ACTIVO) */
                <div className="glass-card" style={{ border: '1px solid #00F2FE', background: 'rgba(0, 242, 254, 0.05)', boxShadow: '0 0 20px rgba(0, 242, 254, 0.1)', marginBottom: '30px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -12, left: 20, background: '#00F2FE', color: '#000', padding: '4px 12px', borderRadius: '12px', fontWeight: '900', fontSize: '12px' }}>
                        LEVEL {progress.current_level} / 10
                    </div>
                    
                    <h3 style={{ marginTop: '15px', color: '#fff', textAlign: 'center' }}>{currentStepConfig.title}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                        <TaskRow letter="A" desc={currentStepConfig.taskA} isDone={progress.task_a_done} isLoading={loading} onVerify={() => handleVerifyTask('A')} />
                        <TaskRow letter="B" desc={currentStepConfig.taskB} isDone={progress.task_b_done} isLoading={loading} onVerify={() => handleVerifyTask('B')} />
                    </div>

                    {/* BOTONES DE SKIP */}
                    <div style={{ marginTop: '25px', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '15px' }}>
                        <div style={{ textAlign: 'center', fontSize: '10px', color: '#aaa', marginBottom: '10px' }}>OVERRIDE PROTOCOL (SKIP BOTH TASKS)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button onClick={handleSkipWithTON} disabled={loading} className="btn-cyber" style={{ background: 'transparent', borderColor: '#00F2FE', color: '#00F2FE', fontSize: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
                                <Zap size={14} /> PAY {skipCost.ton} TON
                            </button>
                            <button onClick={() => alert(`Redirect to invite page... You need ${skipCost.refs} new invite(s).`)} disabled={loading} className="btn-cyber" style={{ background: 'transparent', borderColor: '#E040FB', color: '#E040FB', fontSize: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
                                <Users size={14} /> INVITE {skipCost.refs} AGENT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAPA VISUAL (Niveles siguientes - Solo visible si no ha completado) */}
            {!progress.is_completed && (
                <>
                    <h4 style={{ color: '#666', fontSize: '12px', marginBottom: '15px', letterSpacing: '1px' }}>UPCOMING MILESTONES</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '10px', borderLeft: '2px solid #333', marginLeft: '10px' }}>
                        {PATH_STEPS.slice(progress.current_level, 10).map(step => (
                            <div key={step.lvl} style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '-16px', background: '#111', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #444' }}></div>
                                <div style={{ opacity: 0.5, padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>Level {step.lvl}</div>
                                        <div style={{ color: '#666', fontSize: '10px' }}>{step.title}</div>
                                    </div>
                                    <Lock size={14} color="#555" />
                                </div>
                            </div>
                        ))}
                        
                        {/* Meta Final */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', marginTop: '10px' }}>
                            <div style={{ position: 'absolute', left: '-20px', background: '#FFD700', width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 10px #FFD700' }}></div>
                            <div style={{ padding: '15px', background: 'linear-gradient(90deg, rgba(255,215,0,0.1) 0%, transparent 100%)', border: '1px solid #FFD700', borderRadius: '8px', width: '100%' }}>
                                <div style={{ color: '#FFD700', fontSize: '16px', fontWeight: '900' }}>2,500,000 PTS</div>
                                <div style={{ color: '#aaa', fontSize: '10px' }}>ULTIMATE REWARD</div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const TaskRow: React.FC<TaskRowProps> = ({ letter, desc, isDone, isLoading, onVerify }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isDone ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: isDone ? '1px solid #4CAF50' : '1px solid #333' }}>
        <div style={{ background: isDone ? '#4CAF50' : '#333', color: isDone ? '#000' : '#888', width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
            {letter}
        </div>
        <div style={{ flex: 1, fontSize: '12px', color: isDone ? '#fff' : '#aaa' }}>
            {desc}
        </div>
        {isDone ? (
            <CheckCircle2 size={20} color="#4CAF50" />
        ) : (
            <button 
                onClick={onVerify} disabled={isLoading}
                style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                VERIFY
            </button>
        )}
    </div>
);