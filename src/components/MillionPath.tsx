import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { CheckCircle2, Lock, Zap, Users, Star } from 'lucide-react';

const ADMIN_WALLET_ADDRESS = 'UQD7qJo2-AYe7ehX9_nEk4FutxnmbdiSx3aLlwlB9nENZ43q';

interface PathProgress {
    current_level: number;
    task_a_done: boolean;
    task_b_done: boolean;
    is_completed: boolean;
}

interface MillionPathProps {
    setGlobalScore: (val: number | ((prev: number) => number)) => void;
}

// 🔥 NUEVA INTERFAZ para solucionar el error "any" en TaskRow
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

    useEffect(() => {
        if (!user) return;
        const fetchProgress = async () => {
            const { data, error } = await supabase.from('user_million_path').select('*').eq('user_id', user.id).single();
            if (data) {
                setProgress(data);
            } else if (error?.code === 'PGRST116') {
                // Si no existe, lo creamos
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
            
            // Avanzar de nivel localmente y en DB
            await advanceLevel();
            
        } catch (err) {
            console.error(err);
            alert("Transaction cancelled or failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyTask = async (task: 'A' | 'B') => {
        // AQUÍ CONECTAREMOS LUEGO LAS VALIDACIONES REALES CON SUPABASE (RPC)
        // Por ahora simulamos que el usuario verifica manualmente para la UI
        setLoading(true);
        setTimeout(async () => {
            alert(`Checking Task ${task} requirements...`);
            // Simulación de éxito:
            const updates = task === 'A' ? { task_a_done: true } : { task_b_done: true };
            await supabase.from('user_million_path').update(updates).eq('user_id', user!.id);
            setProgress(prev => ({ ...prev, ...updates }));
            setLoading(false);
        }, 1500);
    };

    const advanceLevel = async () => {
        const isFinal = progress.current_level === 10;
        
        if (isFinal) {
            await supabase.from('user_million_path').update({ is_completed: true }).eq('user_id', user!.id);
            await supabase.rpc('increment_score', { p_user_id: user!.id, p_amount: 2500000 });
            setGlobalScore(prev => prev + 2500000);
            setProgress(prev => ({ ...prev, is_completed: true }));
            alert("🏆 GOD MODE UNLOCKED!\n\n+2,500,000 PTS ADDED TO YOUR BALANCE!");
        } else {
            // Damos 5k por pasar de nivel
            await supabase.rpc('increment_score', { p_user_id: user!.id, p_amount: 5000 });
            setGlobalScore(prev => prev + 5000);
            
            const nextLevel = progress.current_level + 1;
            const updates = { current_level: nextLevel, task_a_done: false, task_b_done: false };
            await supabase.from('user_million_path').update(updates).eq('user_id', user!.id);
            setProgress(prev => ({ ...prev, ...updates }));
            alert(`✅ LEVEL ${progress.current_level} CLEARED!\n\n+5,000 PTS awarded. Proceed to Level ${nextLevel}.`);
        }
    };

    // Auto-avance si hace A y B manualmente
    useEffect(() => {
        if (progress.task_a_done && progress.task_b_done && !progress.is_completed) {
            advanceLevel();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progress.task_a_done, progress.task_b_done]);

    if (progress.is_completed) {
        return (
            <div className="cyber-card" style={{ textAlign: 'center', padding: '40px 20px', border: '2px solid #FFD700', background: 'rgba(255,215,0,0.05)' }}>
                <Star size={50} color="#FFD700" style={{ margin: '0 auto 15px' }} />
                <h2 style={{ color: '#FFD700', margin: '0 0 10px 0' }}>PATH TO 2.5M COMPLETE</h2>
                <p style={{ color: '#aaa', fontSize: '14px' }}>You have reached the pinnacle of the ecosystem.</p>
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

            {/* NODO ACTUAL (ACTIVO) */}
            <div className="glass-card" style={{ border: '1px solid #00F2FE', background: 'rgba(0, 242, 254, 0.05)', boxShadow: '0 0 20px rgba(0, 242, 254, 0.1)', marginBottom: '30px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, left: 20, background: '#00F2FE', color: '#000', padding: '4px 12px', borderRadius: '12px', fontWeight: '900', fontSize: '12px' }}>
                    LEVEL {progress.current_level} / 10
                </div>
                
                <h3 style={{ marginTop: '15px', color: '#fff', textAlign: 'center' }}>{currentStepConfig.title}</h3>
                
                {/* TAREAS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    <TaskRow 
                        letter="A" desc={currentStepConfig.taskA} 
                        isDone={progress.task_a_done} isLoading={loading} 
                        onVerify={() => handleVerifyTask('A')} 
                    />
                    <TaskRow 
                        letter="B" desc={currentStepConfig.taskB} 
                        isDone={progress.task_b_done} isLoading={loading} 
                        onVerify={() => handleVerifyTask('B')} 
                    />
                </div>

                {/* BOTONES DE SKIP */}
                <div style={{ marginTop: '25px', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '15px' }}>
                    <div style={{ textAlign: 'center', fontSize: '10px', color: '#aaa', marginBottom: '10px' }}>OVERRIDE PROTOCOL (SKIP BOTH TASKS)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button 
                            onClick={handleSkipWithTON} disabled={loading}
                            className="btn-cyber" style={{ background: 'transparent', borderColor: '#00F2FE', color: '#00F2FE', fontSize: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <Zap size={14} /> PAY {skipCost.ton} TON
                        </button>
                        <button 
                            onClick={() => alert(`Redirect to invite page... You need ${skipCost.refs} new invite(s).`)} disabled={loading}
                            className="btn-cyber" style={{ background: 'transparent', borderColor: '#E040FB', color: '#E040FB', fontSize: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <Users size={14} /> INVITE {skipCost.refs} AGENT
                        </button>
                    </div>
                </div>
            </div>

            {/* MAPA VISUAL (Niveles siguientes) */}
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
        </div>
    );
};

// 🔥 Componente TaskRow corregido con su interfaz
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