import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Users, Copy, Share2, Gift, Crown, Percent, CheckCircle2 } from 'lucide-react';

export const SquadZone: React.FC = () => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState(0);
    
    const BOT_USERNAME = "GemNova_GameBot"; 
    const inviteLink = `https://t.me/${BOT_USERNAME}?start=ref_${user?.id}`;

    useEffect(() => {
        if(user) {
            supabase.from('user_score').select('referral_count').eq('user_id', user.id).single()
                .then(({data}) => { if(data) setReferrals(data.referral_count) });
        }
    }, [user]);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        alert("Link Copied!");
    };

    const milestones = [
        { count: 5, reward: "2.5k", done: referrals >= 5 },
        { count: 10, reward: "10k", done: referrals >= 10 },
        { count: 25, reward: "50k", done: referrals >= 25 },
        { count: 50, reward: "200k 🔥", done: referrals >= 50 },
    ];

    const nextMilestone = milestones.find(m => !m.done) || milestones[milestones.length - 1];
    const prevMilestoneCount = milestones[milestones.indexOf(nextMilestone) - 1]?.count || 0;
    const progressPercent = Math.min(100, ((referrals - prevMilestoneCount) / (nextMilestone.count - prevMilestoneCount)) * 100);

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            
            <div style={{ textAlign:'center', marginBottom:'30px' }}>
                <h2 style={{ margin: 0, fontSize:'28px', color:'#fff', textShadow:'0 0 10px #00F2FE' }}>SQUAD OPS</h2>
                <p style={{ color:'#00F2FE', fontSize:'12px' }}>Recruit agents. Unlock milestones.</p>
            </div>

            {/* Tarjeta Principal */}
            <div className="glass-card" style={{ textAlign:'center', border: '1px solid #00F2FE', position:'relative', overflow:'hidden' }}>
                <div style={{position:'absolute', top:-20, left:-20, width:100, height:100, background:'rgba(0, 242, 254, 0.2)', borderRadius:'50%', filter:'blur(30px)'}}></div>
                
                <div style={{ fontSize:'48px', fontWeight:'900', color:'#fff', lineHeight:1 }}>{referrals}</div>
                
                {/* ✅ SOLUCIÓN: Usamos el icono Users aquí */}
                <div style={{ fontSize:'12px', color:'#aaa', marginBottom:'20px', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
                    <Users size={14}/> Active Recruits
                </div>

                {/* Barra de Progreso */}
                <div style={{ marginBottom:'20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ccc', marginBottom: '5px' }}>
                        <span>Next Goal: {nextMilestone.count} Recruits</span>
                        <span style={{color:'#FFD700', fontWeight:'bold'}}>Bonus: +{nextMilestone.reward}</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#333', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #00F2FE, #4FACFE)' }} />
                    </div>
                </div>

                <button className="btn-neon" onClick={() => window.open(`https://t.me/share/url?url=${inviteLink}&text=🔥 Join Gem Nova! Get a Starter Bonus!`, '_blank')}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize:'14px' }}>
                    <Share2 size={18} /> INVITE NOW
                </button>
                
                <button onClick={handleCopy} style={{ marginTop:'15px', background:'none', border:'none', color:'#00F2FE', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', width:'100%' }}>
                    <Copy size={14} /> Copy Link
                </button>
            </div>

            {/* Mapa de Hitos */}
            <h3 style={{ fontSize:'16px', margin:'0 0 15px 0' }}>Mission Milestones</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {milestones.map((m, i) => (
                    <div key={i} className="glass-card" style={{ 
                        margin:0, padding:'15px', display:'flex', alignItems:'center', justifyContent:'space-between',
                        border: m.done ? '1px solid #4CAF50' : (m === nextMilestone ? '1px solid #FFD700' : '1px solid #333'),
                        background: m.done ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.02)'
                    }}>
                        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                            <div style={{
                                width:'30px', height:'30px', borderRadius:'8px', 
                                background: m.done ? '#4CAF50' : '#222', color: m.done ? '#fff' : '#555',
                                display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'12px'
                            }}>
                                {m.done ? <CheckCircle2 size={16}/> : (i+1)}
                            </div>
                            <div>
                                <div style={{fontWeight:'bold', color: m.done ? '#fff' : '#888', fontSize:'13px'}}>
                                    Recruit {m.count} Agents
                                </div>
                            </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                            <div style={{fontWeight:'bold', color: m.done ? '#4CAF50' : '#FFD700', fontSize:'13px'}}>
                                +{m.reward}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabla de Beneficios */}
            <div className="glass-card" style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize:'14px', marginBottom:'10px' }}>Bounty Board</h3>
                
                <RewardRow 
                    icon={<Gift size={14} color="#4CAF50"/>}
                    title="Sign Up Bonus" 
                    reward="+2,500 Pts" 
                    desc="Instant reward"
                />
                <RewardRow 
                    icon={<Crown size={14} color="#E040FB"/>}
                    title="Active Miner" 
                    reward="+5,000 Pts" 
                    isHighlight 
                    desc="When recruit hits Level 4"
                />
                <RewardRow 
                    icon={<Percent size={14} color="#FFD700"/>}
                    title="Commission" 
                    reward="1% - 5%" 
                    isGold 
                    desc="On Token Purchases"
                />
            </div>
        </div>
    );
};

interface RewardRowProps {
    icon: React.ReactNode;
    title: string;
    reward: string;
    isHighlight?: boolean;
    isGold?: boolean;
    desc?: string;
}

const RewardRow: React.FC<RewardRowProps> = ({ icon, title, reward, isHighlight, isGold, desc }) => (
    <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize:'13px', color:'#ddd' }}>
                {icon} {title}
            </span>
            <span style={{ color: isGold ? '#FFD700' : (isHighlight ? '#E040FB' : '#4CAF50'), fontWeight: 'bold', fontSize:'13px' }}>{reward}</span>
        </div>
        {desc && <div style={{ fontSize:'10px', color:'#666', marginLeft:'22px', marginTop:'2px' }}>{desc}</div>}
    </div>
);