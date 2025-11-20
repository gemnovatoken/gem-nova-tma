import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
// Importamos solo lo que vamos a usar
import { Users, Copy, Lock, Share2, Flame } from 'lucide-react';

export const SquadZone: React.FC = () => {
    const { user } = useAuth();
    const [userCount, setUserCount] = useState(0);
    const [referrals, setReferrals] = useState(0);
    const targetUsers = 1000; // Meta para desbloquear
    
    const BOT_USERNAME = "GemNova_GameBot"; 
    const inviteLink = `https://t.me/${BOT_USERNAME}?start=ref_${user?.id}`;

    useEffect(() => {
        const fetchGlobal = async () => {
            const { count } = await supabase.from('user_score').select('*', { count: 'exact', head: true });
            if (count !== null) setUserCount(count);
        };
        fetchGlobal();

        if(user) {
            supabase.from('user_score').select('referral_count').eq('user_id', user.id).single()
                .then(({data}) => { if(data) setReferrals(data.referral_count) });
        }
    }, [user]);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        alert("Link Copied!");
    };

    const progress = Math.min(100, (userCount / targetUsers) * 100);

    return (
        <div style={{ 
            height: '75vh', width: '100%', position: 'relative', overflow: 'hidden', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #FF512F', borderRadius: '20px', background: '#000'
        }}>
            
            {/* --- FONDO: EL JUEGO DEL SOL (VISUAL) --- */}
            <div style={{ position: 'absolute', inset: 0, display:'flex', alignItems:'center', justifyContent:'center', zIndex: 0, opacity: 0.4 }}>
                <div style={{
                    width: '280px', height: '280px', borderRadius: '50%', 
                    background: 'radial-gradient(circle, #F09819 0%, #FF512F 100%)',
                    boxShadow: '0 0 60px #FF512F',
                    animation: 'pulse 3s infinite ease-in-out'
                }}></div>
            </div>

            {/* --- CAPA DE BLOQUEO --- */}
            <div className="glass-card" style={{ 
                zIndex: 10, width: '85%', padding: '20px', textAlign: 'center', 
                background: 'rgba(0, 0, 0, 0.85)', border: '1px solid #FF512F', backdropFilter: 'blur(8px)'
            }}>
                
                <div style={{ display: 'inline-block', padding: '15px', background: 'rgba(255, 81, 47, 0.1)', borderRadius: '50%', marginBottom: '10px' }}>
                    <Lock size={32} color="#FF512F" />
                </div>

                <h2 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '20px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    <Flame size={20} fill="#FF512F" color="#FF512F"/> RAID LOCKED
                </h2>
                
                <p style={{ color: '#ccc', fontSize: '12px', marginBottom: '15px' }}>
                    Global Raid unlocks at <strong>1,000 Miners</strong>.
                </p>

                {/* Barra de Progreso Global */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#aaa', marginBottom: '5px' }}>
                        <span>Community Progress</span>
                        <span>{userCount} / {targetUsers}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: '#FF512F' }} />
                    </div>
                </div>

                {/* SECCIÓN DE INVITACIÓN */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                    
                    {/* Botón Invitar Principal */}
                    <button className="btn-neon" onClick={() => window.open(`https://t.me/share/url?url=${inviteLink}&text=🔥 Join Gem Nova! Get 50k Points Bonus before halving!`, '_blank')}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff', color: '#000', fontSize:'14px', marginBottom:'10px' }}>
                        <Share2 size={16} /> INVITE FRIENDS
                    </button>

                    {/* Botón Copiar Link (Aquí usamos el icono Copy) */}
                    <button onClick={handleCopy} style={{
                        background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'8px',
                        color:'#fff', padding:'8px', width:'100%', fontSize:'12px', cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'
                    }}>
                        <Copy size={14}/> Copy My Link
                    </button>

                    {/* Contador de Referidos (Aquí usamos el icono Users) */}
                    <div style={{ marginTop: '15px', fontSize: '12px', color: '#888', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                        <Users size={14} /> My Squad: <span style={{ color: '#fff', fontWeight: 'bold' }}>{referrals}</span>
                    </div>
                </div>

            </div>
            
            <style>{`@keyframes pulse { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 0.8; } 100% { transform: scale(0.95); opacity: 0.5; } }`}</style>
        </div>
    );
};