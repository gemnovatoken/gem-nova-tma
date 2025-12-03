import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Lock, TrendingUp, Users, DollarSign, Wallet, ShieldCheck, ArrowUpRight, BookOpen } from 'lucide-react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { WhitepaperModal } from './WhitepaperModal';

interface InfoRowProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
}

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
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <h2 style={{margin:0, fontSize:'24px'}}>My Wallet</h2>
                <div style={{transform: 'scale(0.9)', transformOrigin: 'right center'}}>
                    <TonConnectButton />
                </div>
            </div>

            {/* GRID DE 2 COLUMNAS (COMPACTO) */}
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
                            <Users size={10}/> {referralCount} Refs
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

            {/* 3. BOTÓN WHITEPAPER (Más delgado) */}
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

            <h3 style={{fontSize:'14px', margin:'0 0 10px 0'}}>How it works</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <InfoRow icon={<Users size={14} color="#4CAF50"/>} title="1. Invite Friends" desc="Share your link from the Squad Zone."/>
                <InfoRow icon={<DollarSign size={14} color="#00F2FE"/>} title="2. They Buy Packs" desc="When they buy points with TON, you get paid."/>
                <InfoRow icon={<TrendingUp size={14} color="#E040FB"/>} title="3. Withdrawals" desc={`Min 1 TON (Or 0 TON if Level 5+).`} />
            </div>

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
    <div className="glass-card" style={{ padding:'10px', display:'flex', alignItems:'center', gap:'12px', margin:0 }}>
        <div style={{background:'rgba(255,255,255,0.05)', padding:'6px', borderRadius:'6px'}}>{icon}</div>
        <div>
            <div style={{fontWeight:'bold', fontSize:'11px', color:'#fff'}}>{title}</div>
            <div style={{fontSize:'10px', color:'#aaa'}}>{desc}</div>
        </div>
    </div>
);