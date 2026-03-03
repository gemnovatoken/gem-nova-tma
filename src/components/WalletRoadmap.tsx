import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
// Agregamos los iconos necesarios para la rifa
import { Lock, TrendingUp, Users, DollarSign, Wallet, ShieldCheck, ArrowUpRight, BookOpen, Trophy, X, Gift, Star, Target, Zap, Unlock } from 'lucide-react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { WhitepaperModal } from './WhitepaperModal';
import EarnTonSection from './EarnTonSection';

// --- INTERFACES ORIGINALES ---
interface InfoRowProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
}

// --- NUEVAS INTERFACES PARA LA RIFA ---
interface Referrer {
    telegram_id: string;
    referrals: number;
}

interface RaffleData {
    global_total: number;
    leaderboard: Referrer[];
}

// --- COMPONENTE NUEVO: MODAL DE RIFA ---
const AirdropRaffleModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [globalTotal, setGlobalTotal] = useState(0);
    const [leaderboard, setLeaderboard] = useState<Referrer[]>([]);

    const COMMUNITY_GOAL = 1000;
    const progressPercent = Math.min((globalTotal / COMMUNITY_GOAL) * 100, 100);
    const goalReached = globalTotal >= COMMUNITY_GOAL;

    useEffect(() => {
        if (isOpen) {
            const fetchRaffleData = async () => {
                setLoading(true);
                const { data, error } = await supabase.rpc('get_airdrop_raffle_data');
                
                if (!error && data) {
                    const parsedData = data as unknown as RaffleData;
                    setGlobalTotal(parsedData.global_total);
                    setLeaderboard(parsedData.leaderboard);
                }
                setLoading(false);
            };
            fetchRaffleData();
        }
    }, [isOpen]);

    const tier3 = leaderboard.filter(u => u.referrals > 5);
    const tier2 = leaderboard.filter(u => u.referrals >= 3 && u.referrals <= 5);
    const tier1 = leaderboard.filter(u => u.referrals >= 1 && u.referrals <= 2);

    return (
        <div style={{ marginBottom: '15px' }}>
            <button 
                onClick={() => setIsOpen(true)}
                className="cyber-card" 
                style={{ 
                    width: '100%', padding: '12px 15px', borderRadius: '16px', background: 'linear-gradient(135deg, #FF512F 0%, #F09819 100%)', 
                    border: 'none', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 0 15px rgba(255, 81, 47, 0.4)', cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%' }}>
                        <Gift size={20} color="#fff" />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '1px' }}>SQUAD RAFFLE</div>
                        <div style={{ fontSize: '9px', opacity: 0.9 }}>Unlock 2nd Winners at 1K Invites!</div>
                    </div>
                </div>
                <Trophy size={18} opacity={0.8} />
            </button>

            {isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                    <div className="glass-card" style={{ width: '100%', maxHeight: '85vh', overflowY: 'auto', background: '#111', border: '1px solid #F09819', borderRadius: '20px', position: 'relative', padding: '20px' }}>
                        
                        <button onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', padding: '5px', cursor: 'pointer' }}>
                            <X size={18} />
                        </button>

                        <h2 style={{ textAlign: 'center', color: '#F09819', marginTop: 0, marginBottom: '5px', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Trophy size={22} /> RAFFLE LEADERBOARD
                        </h2>
                        <p style={{ textAlign: 'center', color: '#aaa', fontSize: '11px', marginTop: 0, marginBottom: '20px' }}>1 Referral = 1 Raffle Ticket</p>

                        <div style={{ background: 'rgba(255, 81, 47, 0.1)', border: '1px solid rgba(255, 81, 47, 0.3)', borderRadius: '12px', padding: '15px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Target size={14} color="#F09819" />
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>GLOBAL QUEST</span>
                                </div>
                                <span style={{ fontSize: '12px', color: '#F09819', fontWeight: 'bold' }}>{globalTotal} / {COMMUNITY_GOAL}</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #FF512F, #F09819)', transition: 'width 0.5s', boxShadow: '0 0 10px #F09819' }}></div>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: '10px', color: goalReached ? '#4CAF50' : '#aaa', fontWeight: goalReached ? 'bold' : 'normal' }}>
                                {goalReached ? '🎉 TARGET REACHED! 2ND WINNERS UNLOCKED 🎉' : 'Reach 1,000 global referrals to unlock a 2nd Winner!'}
                            </div>
                        </div>

                        {loading ? (
                            <p style={{ textAlign: 'center', color: '#aaa' }}>Loading blockchain data...</p>
                        ) : (
                            <>
                                <TierSection title="WHALE TIER (>5 Referrals)" prize1="25 TON" prize2="12.5 TON" goalReached={goalReached} color="#E040FB" icon={<Crown size={16} color="#E040FB" />} users={tier3} />
                                <TierSection title="ELITE TIER (3-5 Referrals)" prize1="10 TON" prize2="5 TON" goalReached={goalReached} color="#00F2FE" icon={<Zap size={16} color="#00F2FE" />} users={tier2} />
                                <TierSection title="STARTER TIER (1-2 Referrals)" prize1="$5" prize2="$2.5" goalReached={goalReached} color="#4CAF50" icon={<Star size={16} color="#4CAF50" />} users={tier1} />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const TierSection = ({ title, prize1, prize2, goalReached, color, icon, users }: { title: string, prize1: string, prize2: string, goalReached: boolean, color: string, icon: React.ReactNode, users: Referrer[] }) => (
    <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '10px', border: `1px solid ${color}30` }}>
        <div style={{ display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${color}40`, paddingBottom: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {icon}
                    <span style={{ fontSize: '13px', fontWeight: '900', color: color }}>{title}</span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, background: `${color}20`, padding: '6px', borderRadius: '6px', textAlign: 'center', border: `1px solid ${color}50` }}>
                    <div style={{ fontSize: '9px', color: '#ccc' }}>1st Winner</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: color }}>{prize1}</div>
                </div>
                <div style={{ flex: 1, background: goalReached ? `${color}20` : '#222', padding: '6px', borderRadius: '6px', textAlign: 'center', border: goalReached ? `1px solid ${color}50` : '1px solid #333' }}>
                    <div style={{ fontSize: '9px', color: goalReached ? '#ccc' : '#666', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px' }}>
                        {goalReached ? <Unlock size={10} color={color}/> : <Lock size={10} color="#666"/>} 2nd Winner
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: goalReached ? color : '#666' }}>{prize2}</div>
                </div>
            </div>
        </div>
        
        {users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '10px', fontSize: '11px', color: '#666' }}>No agents in this tier yet.</div>
        ) : (
            <div style={{ display: 'grid', gap: '6px' }}>
                {users.map((u, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#666', fontSize: '10px', width: '15px' }}>#{i + 1}</span>
                            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>{u.telegram_id}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#222', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${color}30` }}>
                            <span style={{ color: color, fontSize: '12px', fontWeight: '900' }}>{u.referrals}</span>
                            <span style={{ color: '#aaa', fontSize: '9px' }}>Pts</span>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const Crown = ({ size, color }: { size: number, color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="2 4 12 2 22 4 18 14 6 14 2 4"></polygon>
        <rect x="6" y="14" width="12" height="6"></rect>
    </svg>
);


// --- TU COMPONENTE ORIGINAL INTACTO ---
export const WalletRoadmap: React.FC = () => {
    const { user } = useAuth();
    const userFriendlyAddress = useTonAddress();
    
    const [tonEarnings, setTonEarnings] = useState(0);
    const [referralCount, setReferralCount] = useState(0);
    const [userLevel, setUserLevel] = useState(1);
    const [loadingClaim, setLoadingClaim] = useState(false);
    
    // Estados para Whitepaper
    const [showWhitepaper, setShowWhitepaper] = useState(false);
    const [wpClaimed, setWpClaimed] = useState(true); 
    const [claimingWp, setClaimingWp] = useState(false);

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                const { data } = await supabase
                    .from('user_score')
                    .select('referral_ton_earnings, referral_count, multitap_level, limit_level, speed_level, whitepaper_claimed')
                    .eq('user_id', user.id)
                    .single();
                
                if (data) {
                    setTonEarnings(data.referral_ton_earnings || 0);
                    setReferralCount(data.referral_count || 0);
                    setUserLevel(Math.min(data.multitap_level, data.limit_level, data.speed_level));
                    setWpClaimed(data.whitepaper_claimed || false);
                }
            };
            fetchData();
        }
    }, [user]);

    const handleWithdraw = async () => {
        if (tonEarnings < 2) {
            alert("⚠️ Minimum withdrawal is 2 TON.");
            return;
        }
        if (!userFriendlyAddress) {
            alert("⚠️ Please connect your TON wallet first.");
            return;
        }
        setLoadingClaim(true);
        setTimeout(() => {
            alert("✅ Withdrawal Request Sent! Funds will arrive in 24-48h.");
            setLoadingClaim(false);
        }, 1000);
    };

    const handleClaimWhitepaper = async () => {
        if (!user) return;
        setClaimingWp(true);
        const { data } = await supabase.rpc('claim_whitepaper_bonus', { user_id_in: user.id });
        
        if (data === true) {
            alert("🎉 +2,500 PTS ADDED! Knowledge is power.");
            setWpClaimed(true);
            setWpClaimed(true);
            setShowWhitepaper(false);
        } else {
            alert("⚠️ Bonus already claimed.");
            setWpClaimed(true);
            setShowWhitepaper(false);
        }
        setClaimingWp(false);
    };

    // LÓGICA DE RETIRO
    const minWithdraw = userLevel >= 5 ? 0 : 1.0;
    const canWithdraw = tonEarnings > 0 && tonEarnings >= minWithdraw;

    return (
        <div style={{ padding: '20px', paddingBottom: '120px' }}>
            
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <h2 style={{margin:0, fontSize:'24px'}}>My Wallet</h2>
                <div style={{transform: 'scale(0.9)', transformOrigin: 'right center'}}>
                    <TonConnectButton />
                </div>
            </div>

            {/* GRID DE 2 COLUMNAS (COMPACTO) - BALANCE Y VIP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                
                {/* 1. BALANCE */}
                <div className="glass-card" style={{ 
                    padding:'12px', display:'flex', flexDirection:'column', justifyContent:'space-between',
                    background: 'linear-gradient(160deg, rgba(0, 242, 254, 0.1), rgba(0,0,0,0.4))',
                    border: '1px solid rgba(0, 242, 254, 0.3)', height: '140px', position: 'relative'
                }}>
                    <div style={{position:'absolute', top:8, right:8, opacity:0.5}}><Wallet size={16} color="#00F2FE"/></div>
                    
                    <div>
                        <div style={{fontSize:'9px', color:'#aaa', fontWeight:'bold', letterSpacing:'1px'}}>AVAILABLE</div>
                        <div style={{fontSize:'22px', fontWeight:'900', color:'#fff', lineHeight:1.2}}>
                            {tonEarnings.toFixed(2)} <span style={{fontSize:'10px'}}>TON</span>
                        </div>
                        <div style={{fontSize:'9px', color:'#666'}}>≈ ${(tonEarnings * 5.40).toFixed(2)}</div>
                    </div>

                    <div>
                        <div style={{fontSize:'9px', color:'#aaa', marginBottom:'4px', display:'flex', alignItems:'center', gap:'4px'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'4px'}}><Users size={10}/> {referralCount} Refs</div>
                        </div>
                        <button 
                            onClick={handleWithdraw}
                            disabled={!canWithdraw || loadingClaim}
                            className="btn-neon" 
                            style={{
                                width:'100%', fontSize:'9px', padding:'6px', border:'none', borderRadius:'6px',
                                background: canWithdraw ? '#00F2FE' : '#222', 
                                color: canWithdraw ? '#000' : '#555',
                                boxShadow: canWithdraw ? '0 0 10px rgba(0,242,254,0.3)' : 'none'
                            }}
                        >
                            {loadingClaim ? '...' : (canWithdraw ? 'WITHDRAW' : `MIN ${minWithdraw} TON`)}
                        </button>
                    </div>
                </div>

                {/* 2. VIP CARD */}
                <div className="glass-card" style={{ 
                    padding:'12px', display:'flex', flexDirection:'column', justifyContent:'space-between',
                    background: userLevel >= 8 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 215, 0, 0.05)',
                    border: userLevel >= 8 ? '1px solid #4CAF50' : '1px dashed #FFD700', 
                    height: '140px', position: 'relative'
                }}>
                    <div style={{position:'absolute', top:8, right:8, opacity:0.5}}>
                        {userLevel >= 8 ? <ShieldCheck size={16} color="#4CAF50"/> : <Lock size={16} color="#FFD700"/>}
                    </div>

                    <div>
                        <div style={{fontSize:'9px', color: userLevel >= 8 ? '#4CAF50' : '#FFD700', fontWeight:'bold', letterSpacing:'1px'}}>
                            SUPER PARTNER
                        </div>
                        <div style={{fontSize:'22px', fontWeight:'900', color:'#fff', lineHeight:1.2}}>2.5%</div>
                        <div style={{fontSize:'9px', color:'#aaa'}}>Commission</div>
                    </div>

                    <div>
                        <div style={{fontSize:'8px', color:'#666', marginBottom:'4px', lineHeight:'1.1'}}>
                            {userLevel >= 8 ? "Active! 2.5% total." : "Lvl 8 unlocks +1.5%."}
                        </div>
                        
                        {userLevel >= 8 ? (
                            <div style={{background:'#4CAF50', color:'#fff', padding:'4px', borderRadius:'6px', textAlign:'center', fontSize:'9px', fontWeight:'bold'}}>ACTIVE</div>
                        ) : (
                            <button className="btn-neon" style={{
                                width:'100%', fontSize:'9px', padding:'6px', borderRadius:'6px',
                                background: 'transparent', border: '1px solid #FFD700', color:'#FFD700', boxShadow:'none'
                            }}>
                                UPGRADE <ArrowUpRight size={8} style={{marginLeft:'2px'}}/>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- 🔥 NUEVO: COMPONENTE DE LA RIFA 🔥 --- */}
            <AirdropRaffleModal />

            {/* 3. BOTÓN WHITEPAPER (ARRIBA DE HOW IT WORKS) */}
            <button onClick={() => setShowWhitepaper(true)} className="glass-card" style={{
                width: '100%', padding: '10px 12px', marginBottom: '20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: '1px solid #E040FB', background: 'rgba(224, 64, 251, 0.05)'
            }}>
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    <div style={{background:'rgba(224, 64, 251, 0.1)', padding:'6px', borderRadius:'8px'}}>
                        <BookOpen color="#E040FB" size={18} />
                    </div>
                    <div style={{textAlign:'left'}}>
                        <div style={{color:'#fff', fontWeight:'bold', fontSize:'12px'}}>READ WHITEPAPER</div>
                        <div style={{fontSize:'9px', color: wpClaimed ? '#4CAF50' : '#FFD700'}}>
                            {wpClaimed ? "✅ Completed" : "🎁 Reward: 2,500 Pts"}
                        </div>
                    </div>
                </div>
                <ArrowUpRight color="#E040FB" size={16} />
            </button>

            {/* 4. HOW IT WORKS (REDISEÑADO - 2 COLUMNAS) */}
            <h3 style={{fontSize:'14px', margin:'0 0 10px 0'}}>How it works</h3>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px', 
                marginBottom: '25px' 
            }}>
                <InfoRow icon={<Users size={14} color="#4CAF50"/>} title="1. Invite" desc="Share link"/>
                
                <InfoRow icon={<DollarSign size={14} color="#00F2FE"/>} title="2. They Buy" desc="Get paid in TON"/>
                
                <div style={{ gridColumn: 'span 2' }}>
                     <InfoRow icon={<TrendingUp size={14} color="#E040FB"/>} title="3. Withdraw" desc={`Min 1 TON (Or 0 TON if Level 5+)`}/>
                </div>
            </div>

            {/* 5. EARN TON SECTION (MOVIDO AL FINAL) */}
            {user && (
                <div style={{ marginTop: 'auto' }}>
                    <EarnTonSection userId={user.id} />
                </div>
            )}

            {/* MODAL DE WHITEPAPER */}
            {showWhitepaper && (
                <WhitepaperModal 
                    onClose={() => setShowWhitepaper(false)} 
                    onClaim={handleClaimWhitepaper} 
                    canClaim={!wpClaimed} 
                    isClaiming={claimingWp} 
                />
            )}

        </div>
    );
};

const InfoRow: React.FC<InfoRowProps> = ({ icon, title, desc }) => (
    <div className="glass-card" style={{ 
        padding:'10px', 
        display:'flex', 
        alignItems:'center', 
        gap:'10px', 
        margin:0,
        height: '100%', 
        boxSizing: 'border-box'
    }}>
        <div style={{background:'rgba(255,255,255,0.05)', padding:'6px', borderRadius:'6px', flexShrink: 0}}>
            {icon}
        </div>
        <div style={{overflow: 'hidden'}}>
            <div style={{fontWeight:'bold', fontSize:'11px', color:'#fff', whiteSpace: 'nowrap'}}>{title}</div>
            <div style={{fontSize:'10px', color:'#aaa', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>{desc}</div>
        </div>
    </div>
);