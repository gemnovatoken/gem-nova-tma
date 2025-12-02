import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
// 1. Eliminamos 'useRef', 'Users' y 'Zap' que no se usaban
import { Copy, Share2, Gift, Crown, Percent, CheckCircle2, X, ChevronRight } from 'lucide-react';

// Interfaces
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

// --- COMPONENTE INTERNO: EL SOL (RAID) ---
const SunRaid = () => {
    const [hp, setHp] = useState(1000000); 
    const maxHp = 1000000;
    const [scale, setScale] = useState(1);

    const handleHit = () => {
        if (window.navigator.vibrate) window.navigator.vibrate(10);
        setHp(prev => Math.max(0, prev - 100)); 
        setScale(0.95);
        setTimeout(() => setScale(1), 50);
    };

    return (
        <div style={{ position: 'relative', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom:'10px' }}>
            <div style={{ width: '80%', height: '8px', background: '#333', borderRadius: '4px', marginBottom: '15px', overflow: 'hidden', border: '1px solid #555' }}>
                <div style={{ width: `${(hp / maxHp) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #FF512F, #F09819)' }} />
            </div>
            <div style={{ position: 'absolute', top: '10px', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>
                SOLAR BOSS: {hp.toLocaleString()} HP
            </div>

            <div 
                onClick={handleHit}
                style={{
                    width: '160px', height: '160px', borderRadius: '50%',
                    background: 'radial-gradient(circle, #F09819 20%, #FF512F 100%)',
                    boxShadow: '0 0 60px #FF512F', cursor: 'pointer',
                    transform: `scale(${scale})`, transition: 'transform 0.05s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '4px solid rgba(255, 255, 255, 0.2)'
                }}
            >
                <span style={{ fontSize: '40px' }}>☀️</span>
            </div>
            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '10px' }}>TAP TO DAMAGE!</div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export const SquadZone: React.FC = () => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState(0);
    const [showMilestones, setShowMilestones] = useState(false); 

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

    return (
        <div style={{ padding: '10px 20px', paddingBottom: '100px', height: '100%', overflowY: 'auto' }}>
            
            <SunRaid />

            {/* TARJETA DE INVITACIÓN */}
            <div className="glass-card" style={{ 
                padding: '12px', marginBottom: '15px', 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: '1px solid #00F2FE'
            }}>
                <div>
                    <div style={{ fontSize: '10px', color: '#aaa' }}>YOUR SQUAD</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{referrals} <span style={{fontSize:'12px'}}>Agents</span></div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={handleCopy} style={{ background: '#333', border: 'none', padding: '10px', borderRadius: '8px', color: '#fff' }}>
                        <Copy size={16} />
                    </button>
                    <button onClick={() => window.open(`https://t.me/share/url?url=${inviteLink}&text=🔥 Join Gem Nova!`, '_blank')} 
                        className="btn-neon" style={{ padding: '10px 20px', fontSize: '12px', border: 'none', background: '#00F2FE', color: '#000' }}>
                        <Share2 size={16} style={{marginRight:'5px'}}/> INVITE
                    </button>
                </div>
            </div>

            {/* BOTÓN DE HITOS */}
            <button onClick={() => setShowMilestones(true)} className="glass-card" style={{
                width: '100%', padding: '15px', marginBottom: '15px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrophyIcon />
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>MISSION MILESTONES</span>
                </div>
                <ChevronRight size={20} color="#aaa" />
            </button>

            {/* BOUNTY BOARD */}
            <div className="glass-card">
                <h3 style={{ fontSize: '14px', marginBottom: '10px', margin: 0, paddingBottom: '10px', borderBottom: '1px solid #333' }}>Bounty Board</h3>
                <RewardRow icon={<Gift size={14} color="#4CAF50"/>} title="Sign Up Bonus" reward="+2,500 Pts" />
                <RewardRow icon={<Crown size={14} color="#E040FB"/>} title="Active Miner" reward="+5,000 Pts" isHighlight desc="Level 4 Recruit" />
                <RewardRow icon={<Percent size={14} color="#FFD700"/>} title="Shop Commission" reward="1% - 5%" isGold desc="Real TON" />
            </div>

            {/* MODAL DE HITOS */}
            {showMilestones && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 6000,
                    background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
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

// 2. Usamos la interfaz RewardRowProps en lugar de 'any'
const RewardRow: React.FC<RewardRowProps> = ({ icon, title, reward, isHighlight, isGold, desc }) => (
    <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#ddd' }}>
                {icon} {title}
            </span>
            <span style={{ color: isGold ? '#FFD700' : (isHighlight ? '#E040FB' : '#4CAF50'), fontWeight: 'bold', fontSize: '12px' }}>{reward}</span>
        </div>
        {desc && <div style={{ fontSize: '9px', color: '#666', marginLeft: '22px' }}>{desc}</div>}
    </div>
);

// 3. Usamos la interfaz MilestoneRowProps en lugar de 'any'
const MilestoneRow: React.FC<MilestoneRowProps> = ({ count, reward, done, isBig }) => (
    <div style={{ 
        display: 'flex', justifyContent: 'space-between', padding: '15px', marginBottom: '8px', borderRadius: '10px',
        background: done ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.05)',
        border: isBig ? '1px solid #FFD700' : '1px solid #333'
    }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: done ? '#4CAF50' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? <CheckCircle2 size={14} /> : <span style={{ fontSize: '10px' }}>{count}</span>}
            </div>
            <span style={{ color: done ? '#fff' : '#aaa', fontWeight: 'bold' }}>Invite {count} Friends</span>
        </div>
        <span style={{ color: isBig ? '#FFD700' : '#4CAF50', fontWeight: 'bold' }}>+{reward}</span>
    </div>
);

const TrophyIcon = () => <Crown size={20} color="#FFD700" />;