import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Wallet, Users, TrendingUp, PieChart, Lock, RefreshCcw } from 'lucide-react';

export const WalletRoadmap: React.FC = () => {
    const { user } = useAuth();
    const [recruitCount, setRecruitCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const estimatedEarnings = recruitCount * 5000; 

    useEffect(() => {
        if (!user) return;

        const fetchReferralStats = async () => {
            const { count, error } = await supabase
                .from('user_score')
                .select('*', { count: 'exact', head: true }) 
                .eq('referred_by', user.id);

            if (!error && count !== null) setRecruitCount(count);
            setLoading(false);
        };

        fetchReferralStats();
    }, [user]);

    return (
        <div style={{ padding: '20px', textAlign: 'left', paddingBottom: '100px' }}>
            
            <h2 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                <Wallet size={28} color="#00F2FE" /> Wallet & Assets
            </h2>

            {/* --- TARJETA TOKENOMICS --- */}
            <div className="glass-card" style={{border: '1px solid rgba(189, 0, 255, 0.3)'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                    <h3 style={{margin:0, fontSize:'16px', color:'#fff', display:'flex', gap:'8px', alignItems:'center'}}>
                        <PieChart size={18} color="#bd00ff"/> GNOVA ALLOCATION
                    </h3>
                    <span style={{fontSize:'10px', background:'linear-gradient(90deg, #bd00ff, #00F2FE)', padding:'4px 8px', borderRadius:'12px', color:'#000', fontWeight:'bold'}}>
                        1 BILLION SUPPLY
                    </span>
                </div>

                {/* Barra 1: Comunidad (La Masiva - 70%) */}
                <div style={{marginBottom: '15px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'5px'}}>
                        <span style={{color:'#ddd', display:'flex', alignItems:'center', gap:'5px'}}>
                            <Users size={12}/> Community (Mining + Bulk)
                        </span>
                        <span style={{color:'#00F2FE', fontWeight:'bold', fontSize:'14px'}}>70%</span>
                    </div>
                    <div style={{width:'100%', height:'8px', background:'rgba(255,255,255,0.1)', borderRadius:'4px', overflow:'hidden'}}>
                        <div style={{width:'70%', height:'100%', background:'linear-gradient(90deg, #00F2FE, #4FACFE)', borderRadius:'4px', boxShadow:'0 0 10px #00F2FE'}}></div>
                    </div>
                </div>

                {/* Barra 2: Liquidez (15%) */}
                <div style={{marginBottom: '15px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'5px'}}>
                        <span style={{color:'#ddd', display:'flex', alignItems:'center', gap:'5px'}}>
                            <TrendingUp size={12}/> Liquidity (Listing)
                        </span>
                        <span style={{color:'#FFD700', fontWeight:'bold', fontSize:'14px'}}>15%</span>
                    </div>
                    <div style={{width:'100%', height:'8px', background:'rgba(255,255,255,0.1)', borderRadius:'4px', overflow:'hidden'}}>
                        <div style={{width:'15%', height:'100%', background:'#FFD700', borderRadius:'4px'}}></div>
                    </div>
                </div>

                {/* Barra 3: Partners (10%) y Equipo (5%) */}
                <div style={{display: 'flex', gap: '15px'}}>
                    <div style={{flex: 1}}>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'5px', color:'#ddd'}}>
                            <span>Partnerships</span><span style={{color:'#FF0055', fontWeight:'bold'}}>10%</span>
                        </div>
                        <div style={{width:'100%', height:'6px', background:'rgba(255,255,255,0.1)', borderRadius:'3px'}}>
                            <div style={{width:'10%', height:'100%', background:'#FF0055', borderRadius:'3px'}}></div>
                        </div>
                    </div>
                    <div style={{flex: 1, opacity: 0.8}}>
                         <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'5px', color:'#ddd'}}>
                            <span style={{display:'flex', alignItems:'center', gap:'3px'}}><Lock size={10}/>Team</span><span style={{color:'#aaa', fontWeight:'bold'}}>5%</span>
                        </div>
                        <div style={{width:'100%', height:'6px', background:'rgba(255,255,255,0.1)', borderRadius:'3px'}}>
                            <div style={{width:'5%', height:'100%', background:'#888', borderRadius:'3px'}}></div>
                        </div>
                    </div>
                </div>

                 {/* AVISO DE BUYBACK (NUEVO) */}
                 <div style={{marginTop: '20px', padding: '10px', background: 'rgba(0, 255, 100, 0.05)', borderRadius: '8px', borderLeft: '3px solid #4CAF50'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'6px', color:'#4CAF50', fontSize:'12px', fontWeight:'bold', marginBottom:'5px'}}>
                        <RefreshCcw size={14} /> STRATEGIC BUYBACKS
                    </div>
                    <p style={{fontSize:'11px', color:'#ccc', margin:0, lineHeight:'1.4'}}>
                        A portion of App Revenue is reserved to <strong>Buy Back & Burn $GNOVA</strong> from the market after launch to stabilize price.
                    </p>
                </div>
            </div>

            {/* --- TARJETA REFERIDOS --- */}
            <h3 style={{ marginTop: '30px', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#FFD700" /> Referral Status
            </h3>
            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{loading ? '-' : recruitCount}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>ACTIVE RECRUITS</div>
                </div>
                <div style={{height:'40px', width:'1px', background:'rgba(255,255,255,0.1)'}}></div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFD700' }}>{loading ? '-' : `+${estimatedEarnings.toLocaleString()}`}</div>
                     <div style={{ fontSize: '11px', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><TrendingUp size={10} /> PTS EARNED</div>
                </div>
            </div>

            <button className="btn-neon" disabled style={{ width: '100%', marginTop: '20px', background: '#222', color: '#555', boxShadow: 'none', border: '1px solid #333', cursor:'not-allowed' }}>
                CONNECT WALLET (COMING SOON)
            </button>
        </div>
    );
};