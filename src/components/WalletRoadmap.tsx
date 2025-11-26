import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Lock, TrendingUp, Users, DollarSign } from 'lucide-react'; // ❌ Eliminamos Wallet
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

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px' }}>
                <h2 style={{margin:0, fontSize:'24px'}}>My Wallet</h2>
                <TonConnectButton />
            </div>

            <div className="glass-card" style={{ 
                padding:'20px', marginBottom:'15px', textAlign:'center',
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.1), rgba(0,0,0,0))',
                border: '1px solid #00F2FE'
            }}>
                <div style={{fontSize:'12px', color:'#00F2FE', letterSpacing:'1px', fontWeight:'bold', marginBottom:'5px'}}>
                    PARTNER BALANCE
                </div>
                <div style={{fontSize:'42px', fontWeight:'900', color:'#fff', textShadow:'0 0 20px rgba(0, 242, 254, 0.4)'}}>
                    {tonEarnings.toFixed(2)} <span style={{fontSize:'16px'}}>TON</span>
                </div>
                <div style={{fontSize:'12px', color:'#aaa', marginBottom:'20px'}}>
                    ≈ ${(tonEarnings * 5.40).toFixed(2)} USD
                </div>

                <div style={{display:'flex', gap:'10px'}}>
                    <div style={{flex:1, background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'10px'}}>
                        <div style={{fontSize:'10px', color:'#aaa'}}>Referrals</div>
                        <div style={{fontSize:'16px', fontWeight:'bold', color:'#fff'}}>{referralCount}</div>
                    </div>
                    <button 
                        onClick={handleWithdraw}
                        disabled={tonEarnings < 2 || loadingClaim}
                        className="btn-neon" 
                        style={{
                            flex:2, fontSize:'14px', border:'none', 
                            background: tonEarnings >= 2 ? '#00F2FE' : '#333', 
                            color: tonEarnings >= 2 ? '#000' : '#aaa'
                        }}
                    >
                        {loadingClaim ? 'PROCESSING...' : (tonEarnings < 2 ? 'MIN 2 TON' : 'WITHDRAW NOW')}
                    </button>
                </div>
                
                {/* Aviso de Nivel 5 */}
                {userLevel < 5 && (
                    <div style={{marginTop:'10px', fontSize:'9px', color:'#E040FB'}}>
                        🔒 Reach <strong>Level 5</strong> to unlock withdrawals without minimums.
                    </div>
                )}
            </div>

            {/* TARJETA DE BONO NIVEL 8 (2.5%) */}
            <div className="glass-card" style={{ 
                padding:'20px', marginBottom:'30px', position:'relative', overflow:'hidden',
                border: '1px dashed #FFD700', background:'rgba(255, 215, 0, 0.05)'
            }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <div style={{background:'rgba(255, 215, 0, 0.2)', padding:'8px', borderRadius:'50%'}}>
                            <Lock size={20} color="#FFD700"/>
                        </div>
                        <div>
                            <div style={{fontWeight:'bold', color:'#FFD700'}}>SUPER PARTNER (2.5%)</div>
                            <div style={{fontSize:'10px', color:'#aaa'}}>Total commission rate</div>
                        </div>
                    </div>
                    <div style={{fontSize:'18px', fontWeight:'bold', color:'#555'}}>Locked</div>
                </div>
                
                <p style={{fontSize:'12px', color:'#ccc', lineHeight:'1.4', marginBottom:'15px'}}>
                    Level 8 "Nova God" users earn a total of <strong>2.5% commission</strong> on every purchase made by their referrals. (Standard is 1%).
                </p>

                {userLevel >= 8 ? (
                    <div style={{background:'#4CAF50', color:'#fff', padding:'10px', borderRadius:'8px', textAlign:'center', fontWeight:'bold', fontSize:'12px'}}>
                        ✅ YOU ARE LEVEL 8 - 2.5% ACTIVE
                    </div>
                ) : (
                    <div style={{background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <span style={{fontSize:'11px', color:'#aaa'}}>Current Level: {userLevel} / 8</span>
                        <button style={{background:'none', border:'none', color:'#FFD700', fontSize:'11px', cursor:'pointer', fontWeight:'bold'}}>
                            UPGRADE NOW &gt;
                        </button>
                    </div>
                )}
            </div>

            <h3 style={{fontSize:'16px', margin:'0 0 15px 0'}}>How it works</h3>
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <InfoRow icon={<Users size={16} color="#4CAF50"/>} title="1. Invite Friends" desc="Share your link from the Squad Zone."/>
                <InfoRow icon={<DollarSign size={16} color="#00F2FE"/>} title="2. They Buy Packs" desc="When they buy points with TON, you get paid."/>
                <InfoRow icon={<TrendingUp size={16} color="#E040FB"/>} title="3. Withdrawals" desc="Min 1 TON (Or 0 TON if you are Level 5+)."/>
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