import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Copy, Share2, Gift, Crown, Percent, CheckCircle2, X, ChevronRight, Target, Zap, Users, DollarSign, Video, Rocket } from 'lucide-react';

// Interfaces
interface RewardCardProps {
    icon: React.ReactNode;
    title: string;
    reward: string;
    sub?: string;
    color: string;
}

interface MilestoneRowProps {
    count: number;
    reward: string;
    done: boolean;
    isBig?: boolean;
}

// Interfaz para la respuesta de la base de datos
interface UserScoreData {
    referral_ton_earnings: number;
    referral_count: number;
}

// --- 1. EL SOL (RAID CORE) ---
const SunRaid = () => {
    const [hp, setHp] = useState(50000000);
    const maxHp = 50000000;
    const [scale, setScale] = useState(1);
    const [damageDealt, setDamageDealt] = useState(0);
    const [heat, setHeat] = useState(0);
    const [overheated, setOverheated] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setHeat(h => Math.max(0, h - 5));
            if (heat === 0) setOverheated(false);
        }, 200);
        return () => clearInterval(interval);
    }, [heat]);

    const handleHit = () => {
        if (overheated) return;
        const newHeat = heat + 15;
        if (newHeat >= 100) {
            setOverheated(true);
            setHeat(100);
            if (window.navigator.vibrate) window.navigator.vibrate(500);
        } else {
            setHeat(newHeat);
            if (window.navigator.vibrate) window.navigator.vibrate(10);
            setHp(prev => Math.max(0, prev - 150));
            setDamageDealt(prev => prev + 150);
            setScale(0.95);
            setTimeout(() => setScale(1), 50);
        }
    };

    const hpPercent = (hp / maxHp) * 100;

    const handleSpecialAttack = (type: 'video' | 'ton') => {
        if (type === 'video') {
            if(!window.confirm("📺 Launch Solar Flare? (Watch Ad)")) return;
            setTimeout(() => {
                setHp(prev => Math.max(0, prev - 50000));
                alert("🔥 SOLAR FLARE HIT! -50,000 HP");
            }, 2000);
        } else {
            if(!window.confirm("💎 Launch Void Asteroid? (Cost: 0.5 TON)")) return;
            alert("☄️ ASTEROID IMPACT! -500,000 HP (Simulated)");
            setHp(prev => Math.max(0, prev - 500000));
        }
    };

    return (
        <div style={{ 
            position: 'relative', height: '240px', margin: '5px 0 10px 0', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(255, 81, 47, 0.1) 0%, transparent 70%)',
            borderRadius: '20px', border: '1px solid rgba(255, 81, 47, 0.3)'
        }}>
            <div style={{ position: 'absolute', top: 8, left: 12, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Target size={12} color="#FF512F" />
                <span style={{ fontSize: '9px', color: '#FF512F', fontWeight: 'bold', letterSpacing: '1px' }}>TARGET LOCKED</span>
            </div>
            <div style={{ position: 'absolute', top: 8, right: 12, fontSize: '9px', color: '#aaa' }}>
                 DMG: <span style={{color:'#fff'}}>{damageDealt.toLocaleString()}</span>
            </div>

            <div style={{
                position: 'absolute', width: '180px', height: '180px', borderRadius: '50%',
                border: '2px dashed rgba(255,255,255,0.1)', animation: 'spin 30s linear infinite'
            }}></div>

            <div onClick={handleHit} style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: overheated ? '#555' : 'radial-gradient(circle, #F09819 10%, #FF512F 90%)',
                boxShadow: overheated ? 'none' : `0 0 ${hpPercent / 2}px #FF512F`, cursor: 'pointer',
                transform: `scale(${scale})`, transition: 'transform 0.05s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `4px solid ${overheated ? '#FF0000' : 'rgba(255, 255, 255, 0.4)'}`, zIndex: 2
            }}>
                <span style={{ fontSize: '36px', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}>{overheated ? '🔥' : '☀️'}</span>
            </div>

            <div style={{ width: '50%', marginTop: '15px', textAlign: 'center' }}>
                <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${hpPercent}%`, height: '100%', background: '#FF512F', transition: 'width 0.2s' }} />
                </div>
                <div style={{fontSize:'8px', color:'#aaa', marginTop:'2px'}}>{hpPercent.toFixed(1)}% HP</div>
            </div>

            {/* BOTONES DE ATAQUE ESPECIAL */}
            <div style={{ position:'absolute', bottom: 10, display:'flex', gap:'10px' }}>
                 <button onClick={() => handleSpecialAttack('video')} className="glass-card" style={{
                    padding:'4px 8px', display:'flex', gap:'4px', alignItems:'center', cursor:'pointer',
                    border:'1px solid #E040FB', background:'rgba(224, 64, 251, 0.1)', borderRadius:'8px'
                }}>
                    <Video size={10} color="#E040FB"/> <span style={{fontSize:'8px', color:'#fff'}}>FLARE</span>
                </button>
                <button onClick={() => handleSpecialAttack('ton')} className="glass-card" style={{
                    padding:'4px 8px', display:'flex', gap:'4px', alignItems:'center', cursor:'pointer',
                    border:'1px solid #00F2FE', background:'rgba(0, 242, 254, 0.1)', borderRadius:'8px'
                }}>
                    <Rocket size={10} color="#00F2FE"/> <span style={{fontSize:'8px', color:'#fff'}}>VOID</span>
                </button>
            </div>
            
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export const SquadZone: React.FC = () => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState(0);
    const [showMilestones, setShowMilestones] = useState(false);
    const [tonEarnings, setTonEarnings] = useState(0);

    const BOT_USERNAME = "Gnovatoken_bot"; 

    const inviteLink = user 
        ? `https://t.me/${BOT_USERNAME}?start=${user.id}` 
        : "Loading...";

    // 🔥 LÓGICA DE REFERIDOS LIMPIA Y SEGURA
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                // 1. Obtener ganancias TON (Dato estático)
                const { data: scoreData } = await supabase
                    .from('user_score')
                    .select('referral_ton_earnings, referral_count')
                    .eq('user_id', user.id)
                    .single();
                
                // Tipamos la respuesta para evitar 'any'
                const userData = scoreData as unknown as UserScoreData;

                if (userData) {
                    setTonEarnings(userData.referral_ton_earnings || 0);
                }

                // 2. CONTAR REFERIDOS REALES (Función RPC SQL)
                const { data: count, error: rpcError } = await supabase
                    .rpc('get_my_referrals', { my_id: user.id });

                if (rpcError) {
                    console.error("Error en RPC (usando fallback):", rpcError);
                    // Fallback al dato estático si RPC falla
                    if (userData) {
                        setReferrals(userData.referral_count || 0);
                    }
                } else {
                    // Si RPC funciona, usamos el dato real
                    setReferrals(Number(count) || 0);
                }

            } catch (e) {
                console.error("Error crítico:", e);
            }
        };

        loadData();
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);

    }, [user]);

    const handleCopy = () => {
        if (!user) return; 
        navigator.clipboard.writeText(inviteLink);
        alert("✅ Link Copied!\n\nSend this to your friends.");
    };

    return (
        <div style={{ padding: '0 15px', paddingBottom: '100px', height: '100%', overflowY: 'auto' }}>
            
            <SunRaid />

            {/* 2. SQUAD DASHBOARD */}
            <div className="glass-card" style={{ 
                padding: '10px', marginBottom: '10px', 
                background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                {/* Stats */}
                <div style={{display:'flex', gap:'15px'}}>
                    <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'18px', fontWeight:'900', color:'#fff'}}>{referrals}</div>
                        <div style={{fontSize:'8px', color:'#aaa', display:'flex', alignItems:'center', gap:'2px', justifyContent:'center'}}>
                            <Users size={8}/> AGENTS
                        </div>
                    </div>
                    <div style={{width:'1px', height:'25px', background:'rgba(255,255,255,0.1)'}}></div>
                    <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'18px', fontWeight:'900', color:'#4CAF50'}}>{tonEarnings.toFixed(2)}</div>
                        <div style={{fontSize:'8px', color:'#aaa', display:'flex', alignItems:'center', gap:'2px', justifyContent:'center'}}>
                            <DollarSign size={8}/> TON
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div style={{display:'flex', gap:'5px'}}>
                    <button onClick={handleCopy} style={{ 
                        background: 'rgba(255,255,255,0.1)', border: '1px solid #444', 
                        padding: '8px', borderRadius: '8px', color: '#fff', cursor:'pointer' 
                    }}>
                        <Copy size={14} />
                    </button>
                    <button onClick={() => {
                        if (user) {
                            window.open(`https://t.me/share/url?url=${inviteLink}&text=🔥 Join Gem Nova! Mine crypto before launch! 🚀`, '_blank');
                        }
                    }} 
                        className="btn-neon" style={{ 
                            padding: '8px 12px', fontSize: '10px', background: '#00F2FE', color: '#000', height: 'auto',
                            display:'flex', alignItems:'center', gap:'4px'
                        }}>
                        <Share2 size={14}/> INVITE
                    </button>
                </div>
            </div>

            {/* 3. BOUNTY BOARD */}
            <div className="glass-card" style={{ padding:'10px', marginBottom:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', borderBottom:'1px solid #333', paddingBottom:'5px' }}>
                    <h3 style={{ fontSize: '12px', margin: 0, color:'#aaa' }}>ACTIVE BOUNTIES</h3>
                    <div style={{fontSize:'8px', color:'#4CAF50', background:'rgba(76, 175, 80, 0.1)', padding:'2px 6px', borderRadius:'4px'}}>AUTO-CLAIM</div>
                </div>
                
                {/* Fila 1 */}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                    <RewardCard icon={<Gift size={12} color="#4CAF50"/>} title="New Recruit" reward="+2,500 Pts" color="#4CAF50" />
                    <RewardCard icon={<Zap size={12} color="#E040FB"/>} title="Active Miner" reward="+5,000 Pts" sub="Lvl 4" color="#E040FB" />
                </div>

                {/* Fila 2 */}
                <div style={{
                    background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', 
                    borderRadius: '10px', padding: '10px', display:'flex', justifyContent:'space-between', alignItems:'center'
                }}>
                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                        <div style={{background:'rgba(255, 215, 0, 0.2)', padding:'6px', borderRadius:'6px'}}>
                            <Percent size={14} color="#FFD700"/>
                        </div>
                        <div>
                            <div style={{fontSize:'11px', fontWeight:'bold', color:'#FFD700'}}>SHOP COMMISSION</div>
                            <div style={{fontSize:'8px', color:'#aaa'}}>Earn Real TON Cash</div>
                        </div>
                    </div>
                    <div style={{fontSize:'14px', fontWeight:'900', color:'#FFD700'}}>1% - 5%</div>
                </div>
            </div>

            {/* 4. BOTÓN VIEW ALL MILESTONES */}
            <button onClick={() => setShowMilestones(true)} className="glass-card" style={{
                width: '100%', padding: '10px', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.03)', border: '1px solid #333', cursor: 'pointer'
            }}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <Crown size={18} color="#FFD700" />
                    <span style={{ fontWeight: 'bold', color: '#aaa', fontSize:'12px' }}>VIEW ALL MILESTONES</span>
                </div>
                <ChevronRight size={14} color="#aaa" />
            </button>

            {/* MODAL DE HITOS */}
            {showMilestones && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 6000,
                    background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxHeight: '70vh', overflowY: 'auto', border: '1px solid #FFD700', position: 'relative' }}>
                        <button onClick={() => setShowMilestones(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#fff' }}><X /></button>
                        <h3 style={{ textAlign: 'center', color: '#FFD700', marginTop: 0 }}>SQUAD GOALS</h3>
                        
                        <MilestoneRow count={5} reward="2.5k" done={referrals >= 5} />
                        <MilestoneRow count={10} reward="10k" done={referrals >= 10} />
                        <MilestoneRow count={25} reward="50k" done={referrals >= 25} />
                        <MilestoneRow count={50} reward="200k" done={referrals >= 50} isBig />
                        
                        <button onClick={() => setShowMilestones(false)} className="btn-neon" style={{ width: '100%', marginTop: '20px' }}>CLOSE</button>
                    </div>
                </div>
            )}

        </div>
    );
};

// --- COMPONENTES AUXILIARES ---

const RewardCard: React.FC<RewardCardProps> = ({ icon, title, reward, sub, color }) => (
    <div style={{ 
        background: `rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.1)`, 
        border: `1px solid ${color}40`, borderRadius: '10px', padding: '8px',
        display: 'flex', flexDirection: 'column', gap:'4px'
    }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            {icon}
            {sub && <span style={{fontSize:'8px', background:'#333', padding:'1px 4px', borderRadius:'3px', color:'#aaa'}}>{sub}</span>}
        </div>
        <div style={{fontSize:'10px', color:'#ddd'}}>{title}</div>
        <div style={{fontSize:'12px', fontWeight:'bold', color: color}}>{reward}</div>
    </div>
);

const MilestoneRow: React.FC<MilestoneRowProps> = ({ count, reward, done, isBig }) => (
    <div style={{ 
        display: 'flex', justifyContent: 'space-between', padding: '15px', marginBottom: '8px', borderRadius: '10px',
        background: done ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.03)',
        border: isBig ? '1px solid #FFD700' : '1px solid #333',
        opacity: done ? 1 : 0.7
    }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: done ? '#4CAF50' : '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', border:'1px solid #444' }}>
                {done ? <CheckCircle2 size={12} color="#000" /> : <span style={{ fontSize: '9px', color:'#aaa' }}>{count}</span>}
            </div>
            <span style={{ color: done ? '#fff' : '#aaa', fontWeight: 'bold', fontSize:'12px' }}>{count} Invites</span>
        </div>
        <span style={{ color: isBig ? '#FFD700' : '#4CAF50', fontWeight: 'bold', fontSize:'12px' }}>+{reward}</span>
    </div>
);