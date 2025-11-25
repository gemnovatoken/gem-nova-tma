import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Users, Share2, Gift, Crown, Copy } from 'lucide-react';
import { SolarRaid } from './Solarraid'; // ✅ 1. IMPORTAMOS EL COMPONENTE

interface RewardRowProps {
    title: string;
    reward: string;
    isPremium?: boolean;
    isGold?: boolean;
}

export const SquadZone: React.FC = () => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState(0);
    
    const BOT_USERNAME = "GemNova_GameBot"; 
    const inviteLink = `https://t.me/${BOT_USERNAME}?start=ref_${user?.id}`;

    useEffect(() => {
        if(user) {
            const fetchReferrals = async () => {
                const { data } = await supabase.from('user_score')
                    .select('referral_count')
                    .eq('user_id', user.id)
                    .single();
                if(data) setReferrals(data.referral_count); 
            };
            fetchReferrals();
        }
    }, [user]);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        alert("Link Copied!");
    };

    const progressTo3 = Math.min(100, (referrals / 3) * 100);

    return (
        <div style={{ 
            minHeight: '75vh', width: '100%', position: 'relative', overflow: 'hidden', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            paddingTop: '20px', paddingBottom: '100px',
            background: '#000'
        }}>
            
            {/* FONDO AMBIENTAL */}
            <div style={{ position: 'absolute', inset: 0, display:'flex', alignItems:'center', justifyContent:'center', zIndex: 0, opacity: 0.3 }}>
                <div style={{
                    width: '300px', height: '300px', borderRadius: '50%', 
                    background: 'radial-gradient(circle, #F09819 0%, #FF512F 100%)',
                    boxShadow: '0 0 80px #FF512F',
                    animation: 'pulse 4s infinite ease-in-out'
                }}></div>
            </div>

            {/* CONTENIDO */}
            <div style={{ zIndex: 10, width: '100%', maxWidth: '500px', padding: '0 15px' }}>
                
                <div style={{ textAlign:'center', marginBottom:'20px' }}>
                    <h2 style={{ margin: 0, fontSize:'28px', color:'#fff', textShadow:'0 0 10px #FF512F' }}>SQUAD ZONE</h2>
                    <p style={{ color:'#FF512F', fontSize:'12px', margin: '5px 0' }}>Team up & Destroy</p>
                </div>

                {/* ✅ 2. AQUÍ INSERTAMOS EL SOLAR RAID */}
                <div style={{ marginBottom: '30px' }}>
                    <SolarRaid />
                </div>

                {/* SECCIÓN DE REFERIDOS */}
                <div className="glass-card" style={{ border: '1px solid #333', textAlign:'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#fff' }}>Invite Friends</h3>
                    
                    <div style={{ fontSize:'42px', fontWeight:'900', color:'#fff' }}>{referrals}</div>
                    <div style={{ fontSize:'12px', color:'#aaa', marginBottom:'15px' }}>Cadets Recruited</div>

                    {/* Barra de Progreso */}
                    <div style={{ background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'8px', marginBottom:'15px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', marginBottom:'5px', color:'#ccc' }}>
                            <span>Next Goal: 3 Friends</span>
                            <span style={{color:'#FFD700'}}>+100k Pts</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${progressTo3}%`, height: '100%', background: '#FF512F' }} />
                        </div>
                    </div>

                    {/* Botones */}
                    <button className="btn-neon" onClick={() => window.open(`https://t.me/share/url?url=${inviteLink}&text=🔥 Join Gem Nova! Help us destroy the Sun!`, '_blank')}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fff', color: '#000', marginBottom:'10px' }}>
                        <Share2 size={18} /> INVITE FRIEND
                    </button>
                    
                    <button onClick={handleCopy} style={{ background:'none', border:'1px solid #555', color:'#aaa', width:'100%', padding:'8px', borderRadius:'8px', fontSize:'12px', cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Copy size={14} /> Copy Link
                    </button>
                </div>

                {/* Tabla de Beneficios */}
                <div className="glass-card">
                    <h3 style={{ fontSize:'16px', margin:'0 0 15px 0' }}>Rewards</h3>
                    <RewardRow title="Standard User" reward="+5,000 Pts" />
                    <RewardRow title="Premium User" reward="+25,000 Pts" isPremium />
                    <RewardRow title="Shop Commission" reward="10% Bonus" isGold />
                </div>

            </div>
            
            <style>{`@keyframes pulse { 0% { transform: scale(0.95); opacity: 0.3; } 50% { transform: scale(1.05); opacity: 0.5; } 100% { transform: scale(0.95); opacity: 0.3; } }`}</style>
        </div>
    );
};

// Componente auxiliar
const RewardRow: React.FC<RewardRowProps> = ({ title, reward, isPremium, isGold }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize:'12px' }}>
            {isPremium && <Crown size={14} color="#E040FB"/>}
            {isGold && <Gift size={14} color="#FFD700"/>}
            {!isPremium && !isGold && <Users size={14} color="#aaa"/>}
            {title}
        </span>
        <span style={{ color: isPremium ? '#E040FB' : (isGold ? '#FFD700' : '#4CAF50'), fontWeight: 'bold', fontSize:'12px' }}>{reward}</span>
    </div>
);