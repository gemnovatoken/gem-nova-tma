import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
// 1. Quitamos ChevronRight para evitar el error
import { Copy, Share2, Gift, Crown, Percent, CheckCircle2, X, Target, Zap, Users, DollarSign } from 'lucide-react';

interface RewardRowProps {
    icon: React.ReactNode;
    title: string;
    reward: string;
    isHighlight?: boolean;
    isGold?: boolean;
    desc?: string;
}

interface MilestoneRowProps {
    count: number;
    reward: string;
    done: boolean;
    isBig?: boolean;
}

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

    return (
        <div style={{ 
            position: 'relative', height: '260px', margin: '10px 0 20px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(255, 81, 47, 0.1) 0%, transparent 70%)',
            borderRadius: '20px', border: '1px solid rgba(255, 81, 47, 0.3)'
        }}>
            <div style={{ position: 'absolute', top: 10, left: 15, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Target size={14} color="#FF512F" />
                <span style={{ fontSize: '10px', color: '#FF512F', fontWeight: 'bold', letterSpacing: '1px' }}>TARGET LOCKED</span>
            </div>
            <div style={{ position: 'absolute', top: 10, right: 15, fontSize: '10px', color: '#aaa' }}>
                DMG: <span style={{color:'#fff'}}>{damageDealt.toLocaleString()}</span>
            </div>

            <div style={{
                position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
                border: '2px dashed rgba(255,255,255,0.1)', animation: 'spin 30s linear infinite'
            }}></div>

            <div onClick={handleHit} style={{
                width: '140px', height: '140px', borderRadius: '50%',
                background: overheated ? '#555' : 'radial-gradient(circle, #F09819 10%, #FF512F 90%)',
                boxShadow: overheated ? 'none' : `0 0 ${hpPercent / 2}px #FF512F`, cursor: 'pointer',
                transform: `scale(${scale})`, transition: 'transform 0.05s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `4px solid ${overheated ? '#FF0000' : 'rgba(255, 255, 255, 0.4)'}`, zIndex: 2
            }}>
                <span style={{ fontSize: '40px', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}>{overheated ? '🔥' : '☀️'}</span>
            </div>

            <div style={{ width: '60%', marginTop: '20px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#aaa', marginBottom: '3px' }}>
                    <span>BOSS HP</span>
                    <span>{(hpPercent).toFixed(1)}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${hpPercent}%`, height: '100%', background: '#FF512F', transition: 'width 0.2s' }} />
                </div>
            </div>
            
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export const SquadZone: React.FC = () => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState(0);
    const [showMilestones, setShowMilestones] = useState(false);
    const [tonEarnings, setTonEarnings] = useState(0);

    const BOT_USERNAME = "GemNova_GameBot"; 
    const inviteLink = `https://t.me/${BOT_USERNAME}?start=ref_${user?.id}`;

    useEffect(() => {
        if(user) {
            const load = async () => {
                const { data } = await supabase.from('user_score').select('referral_count, referral_ton_earnings').eq('user_id', user.id).single();
                if(data) {
                    setReferrals(data.referral_count);
                    setTonEarnings(data.referral_ton_earnings || 0);
                }
            };
            load();
        }
    }, [user]);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        alert("Link Copied!");
    };

    return (
        <div style={{ padding: '0 15px', paddingBottom: '100px', height: '100%', overflowY: 'auto' }}>
            
            <SunRaid />

            <div className="glass-card" style={{ 
                padding: '15px', marginBottom: '15px', 
                background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)',
                display: 'flex', justifyContent: 'space-around', alignItems: 'center'
            }}>
                <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'20px', fontWeight:'900', color:'#fff'}}>{referrals}</div>
                    <div style={{fontSize:'9px', color:'#aaa', display:'flex', alignItems:'center', gap:'4px', justifyContent:'center'}}>
                        <Users size={10}/> AGENTS
                    </div>
                </div>
                
                <div style={{width:'1px', height:'30px', background:'rgba(255,255,255,0.1)'}}></div>

                <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'20px', fontWeight:'900', color:'#4CAF50'}}>{tonEarnings.toFixed(2)}</div>
                    <div style={{fontSize:'9px', color:'#aaa', display:'flex', alignItems:'center', gap:'4px', justifyContent:'center'}}>
                        <DollarSign size={10}/> TON
                    </div>
                </div>

                 <div style={{width:'1px', height:'30px', background:'rgba(255,255,255,0.1)'}}></div>

                <button onClick={() => window.open(`https://t.me/share/url?url=${inviteLink}&text=🔥 Join Gem Nova!`, '_blank')} 
                    className="btn-neon" style={{ padding: '8px 15px', fontSize: '10px', background: '#00F2FE', color: '#000', height: 'auto' }}>
                    <Share2 size={14} style={{marginBottom:'2px'}}/>
                    <div>INVITE</div>
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <button onClick={handleCopy} className="glass-card" style={{ 
                    padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.05)', cursor: 'pointer', border: '1px solid #333'
                }}>
                    <Copy size={14} color="#aaa"/> <span style={{fontSize:'11px', color:'#fff'}}>COPY LINK</span>
                </button>
                
                <button onClick={() => setShowMilestones(true)} className="glass-card" style={{ 
                    padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: 'rgba(255, 215, 0, 0.1)', cursor: 'pointer', border: '1px solid #FFD700'
                }}>
                    <Crown size={14} color="#FFD700"/> <span style={{fontSize:'11px', color:'#FFD700', fontWeight:'bold'}}>MILESTONES</span>
                </button>
            </div>

            <div className="glass-card" style={{background: 'rgba(10, 10, 15, 0.8)'}}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px', borderBottom:'1px solid #333', paddingBottom:'8px' }}>
                    <h3 style={{ fontSize: '13px', margin: 0, color:'#aaa' }}>ACTIVE BOUNTIES</h3>
                    <div style={{fontSize:'9px', color:'#4CAF50', background:'rgba(76, 175, 80, 0.1)', padding:'2px 6px', borderRadius:'4px'}}>AUTO-CLAIM</div>
                </div>
                
                <RewardRow icon={<Gift size={12} color="#4CAF50"/>} title="New Recruit" reward="+2,500 Pts" />
                <RewardRow icon={<Zap size={12} color="#E040FB"/>} title="Active Miner" reward="+5,000 Pts" isHighlight desc="When they hit Lvl 4" />
                <RewardRow icon={<Percent size={12} color="#FFD700"/>} title="Commission" reward="1% in TON" isGold desc="On every purchase" />
            </div>

            {/* 2. Botón de Hitos reemplazado por texto simple ">" */}
            <button onClick={() => setShowMilestones(true)} className="glass-card" style={{
                width: '100%', padding: '10px', marginBottom: '15px', marginTop: '10px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.03)', border: '1px solid #333', cursor: 'pointer'
            }}>
                <span style={{ fontWeight: 'bold', color: '#aaa', fontSize:'12px' }}>📜 VIEW ALL MILESTONES</span>
                <span style={{color:'#aaa', fontSize:'14px', fontWeight:'bold'}}>&gt;</span>
            </button>

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

const RewardRow: React.FC<RewardRowProps> = ({ icon, title, reward, isHighlight, isGold, desc }) => (
    <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
            <div style={{background:'rgba(255,255,255,0.05)', padding:'6px', borderRadius:'6px'}}>{icon}</div>
            <div>
                <div style={{fontSize:'11px', fontWeight:'bold', color: isGold ? '#FFD700' : '#fff'}}>{title}</div>
                {desc && <div style={{ fontSize: '8px', color: '#666' }}>{desc}</div>}
            </div>
        </div>
        <div style={{ color: isGold ? '#FFD700' : (isHighlight ? '#E040FB' : '#4CAF50'), fontWeight: 'bold', fontSize: '11px' }}>{reward}</div>
    </div>
);

const MilestoneRow: React.FC<MilestoneRowProps> = ({ count, reward, done, isBig }) => (
    <div style={{ 
        display: 'flex', justifyContent: 'space-between', padding: '15px', marginBottom: '8px', borderRadius: '10px',
        background: done ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.03)',
        border: isBig ? '1px solid #FFD700' : '1px solid #333'
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