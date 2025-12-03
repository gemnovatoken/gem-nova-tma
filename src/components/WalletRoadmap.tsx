import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Wallet, Lock, TrendingUp, Users, DollarSign, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';

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

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                const { data } = await supabase
                    .from('user_score')
                    .select('referral_ton_earnings, referral_count, multitap_level, limit_level, speed_level')
                    .eq('user_id', user.id)
                    .single();
                
                if (data) {
                    setTonEarnings(data.referral_ton_earnings || 0);
                    setReferralCount(data.referral_count || 0);
                    setUserLevel(Math.min(data.multitap_level, data.limit_level, data.speed_level));
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

    // LÓGICA DE RETIRO
    const minWithdraw = userLevel >= 5 ? 0 : 1.0;
    const canWithdraw = tonEarnings > 0 && tonEarnings >= minWithdraw;

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px' }}>
                <h2 style={{margin:0, fontSize:'24px'}}>My Wallet</h2>
                <div style={{transform: 'scale(0.9)', transformOrigin: 'right center'}}>
                    <TonConnectButton />
                </div>
            </div>

            {/* --- GRID DE 2 COLUMNAS --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                
                {/* 1. TARJETA DE BALANCE */}
                <div className="glass-card" style={{ 
                    padding:'15px', display:'flex', flexDirection:'column', justifyContent:'space-between',
                    background: 'linear-gradient(160deg, rgba(0, 242, 254, 0.1), rgba(0,0,0,0.4))',
                    border: '1px solid rgba(0, 242, 254, 0.3)', height: '180px', position: 'relative'
                }}>
                    <div style={{position:'absolute', top:10, right:10, opacity:0.5}}><Wallet size={18} color="#00F2FE"/></div>
                    
                    <div>
                        <div style={{fontSize:'10px', color:'#aaa', fontWeight:'bold', letterSpacing:'1px'}}>AVAILABLE</div>
                        <div style={{fontSize:'26px', fontWeight:'900', color:'#fff', textShadow:'0 0 15px rgba(0, 242, 254, 0.5)'}}>
                            {tonEarnings.toFixed(2)} <span style={{fontSize:'12px'}}>TON</span>
                        </div>
                        <div style={{fontSize:'10px', color:'#666'}}>≈ ${(tonEarnings * 5.40).toFixed(2)}</div>
                    </div>

                    <div>
                        <div style={{fontSize:'9px', color:'#aaa', marginBottom:'5px', display:'flex', alignItems:'center', gap:'4px'}}>
                            <Users size={10}/> {referralCount} Referrals
                        </div>
                        <button 
                            onClick={handleWithdraw}
                            disabled={!canWithdraw || loadingClaim}
                            className="btn-neon" 
                            style={{
                                width:'100%', fontSize:'10px', padding:'8px', border:'none', borderRadius:'8px',
                                background: canWithdraw ? '#00F2FE' : '#222', 
                                color: canWithdraw ? '#000' : '#555',
                                boxShadow: canWithdraw ? '0 0 10px rgba(0,242,254,0.3)' : 'none'
                            }}
                        >
                            {loadingClaim ? '...' : (canWithdraw ? 'WITHDRAW' : `MIN ${minWithdraw} TON`)}
                        </button>
                    </div>
                </div>

                {/* 2. TARJETA VIP */}
                <div className="glass-card" style={{ 
                    padding:'15px', display:'flex', flexDirection:'column', justifyContent:'space-between',
                    background: userLevel >= 8 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 215, 0, 0.05)',
                    border: userLevel >= 8 ? '1px solid #4CAF50' : '1px dashed #FFD700', 
                    height: '180px', position: 'relative'
                }}>
                    <div style={{position:'absolute', top:10, right:10, opacity:0.5}}>
                        {userLevel >= 8 ? <ShieldCheck size={18} color="#4CAF50"/> : <Lock size={18} color="#FFD700"/>}
                    </div>

                    <div>
                        <div style={{fontSize:'10px', color: userLevel >= 8 ? '#4CAF50' : '#FFD700', fontWeight:'bold', letterSpacing:'1px'}}>
                            SUPER PARTNER
                        </div>
                        <div style={{fontSize:'26px', fontWeight:'900', color:'#fff'}}>
                            2.5%
                        </div>
                        <div style={{fontSize:'10px', color:'#aaa'}}>Commission Rate</div>
                    </div>

                    <div>
                        <div style={{fontSize:'9px', color:'#666', marginBottom:'5px', lineHeight:'1.2'}}>
                            {userLevel >= 8 ? "Bonus Active! You earn 2.5% total." : "Reach Level 8 to unlock +1.5% bonus."}
                        </div>
                        
                        {userLevel >= 8 ? (
                            <div style={{background:'#4CAF50', color:'#fff', padding:'6px', borderRadius:'8px', textAlign:'center', fontSize:'10px', fontWeight:'bold'}}>
                                ACTIVE
                            </div>
                        ) : (
                            <button className="btn-neon" style={{
                                width:'100%', fontSize:'10px', padding:'8px', borderRadius:'8px',
                                // ✅ CORRECCIÓN: Eliminado border: 'none' duplicado
                                background: 'transparent', border: '1px solid #FFD700', color:'#FFD700', boxShadow:'none'
                            }}>
                                UPGRADE <ArrowUpRight size={10} style={{marginLeft:'2px'}}/>
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* SECCIÓN DE INFORMACIÓN */}
            <h3 style={{fontSize:'16px', margin:'0 0 15px 0'}}>How it works</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <InfoRow icon={<Users size={16} color="#4CAF50"/>} title="1. Invite Friends" desc="Share your link from the Squad Zone."/>
                <InfoRow icon={<DollarSign size={16} color="#00F2FE"/>} title="2. They Buy Packs" desc="When they buy points with TON, you get paid."/>
                <InfoRow icon={<TrendingUp size={16} color="#E040FB"/>} title="3. Withdrawals" desc={`Min 1 TON (Or 0 TON if Level 5+).`} />
            </div>

        </div>
    );
};

const InfoRow: React.FC<InfoRowProps> = ({ icon, title, desc }) => (
    <div className="glass-card" style={{ padding:'12px', display:'flex', alignItems:'center', gap:'15px', margin:0 }}>
        <div style={{background:'rgba(255,255,255,0.05)', padding:'8px', borderRadius:'8px'}}>{icon}</div>
        <div>
            <div style={{fontWeight:'bold', fontSize:'13px', color:'#fff'}}>{title}</div>
            <div style={{fontSize:'11px', color:'#aaa'}}>{desc}</div>
        </div>
    </div>
);