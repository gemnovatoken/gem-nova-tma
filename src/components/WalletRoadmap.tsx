import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle2, Circle, Wallet, Check } from 'lucide-react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';

// Definir la interfaz de Stats para evitar errores de tipo
interface GlobalStats {
    listing_progress_points: number;
    listing_goal: number;
}

export const WalletRoadmap: React.FC = () => {
    const { user } = useAuth();
    const userFriendlyAddress = useTonAddress(); // Detectar si hay wallet conectada
    
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [bonusClaimed, setBonusClaimed] = useState(false);
    const [loadingClaim, setLoadingClaim] = useState(false);

    useEffect(() => {
        // 1. Cargar Stats del Roadmap
        supabase.from('global_stats').select('*').single().then(({data}) => {
             if(data) setStats(data as GlobalStats); 
        });

        // 2. Verificar si ya cobró el bono
        if (user) {
            supabase.from('user_score').select('wallet_bonus_claimed').eq('user_id', user.id).single()
                .then(({data}) => { if(data) setBonusClaimed(data.wallet_bonus_claimed); });
        }
    }, [user]);

    // Lógica para reclamar los 20k
    const handleClaimBonus = async () => {
        if (!user || !userFriendlyAddress) return;
        setLoadingClaim(true);
        
        const { error } = await supabase.rpc('claim_wallet_bonus', { 
            user_id_in: user.id, 
            wallet_address: userFriendlyAddress 
        });

        if (!error) {
            setBonusClaimed(true);
            alert("✅ Success! +20,000 Points added to your balance.");
        } else {
            alert("Error claiming bonus (maybe already claimed?)");
        }
        setLoadingClaim(false);
    };

    const currentProgress = stats ? (stats.listing_progress_points / stats.listing_goal) * 100 : 0;

    // Fases del Roadmap (Resumido)
    const phases = [
        { id: 1, limit: 20, title: "Phase 1: Ignition", desc: "App Launch", done: true },
        { id: 2, limit: 40, title: "Phase 2: Awakening", desc: "Referrals & Casino", done: currentProgress >= 20 },
        { id: 3, limit: 60, title: "Phase 3: Momentum", desc: "Raid & Halving", done: currentProgress >= 40 },
        { id: 4, limit: 100, title: "Phase 4: TGE", desc: "Listing & Airdrop", done: currentProgress >= 99 },
    ];

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            
            {/* --- TARJETA DE MISIÓN DE WALLET --- */}
            <div className="glass-card" style={{ textAlign: 'center', marginBottom: '30px', border: bonusClaimed ? '1px solid #4CAF50' : '1px solid #00F2FE' }}>
                <Wallet size={32} color={bonusClaimed ? '#4CAF50' : '#00F2FE'} style={{ marginBottom: '10px', margin:'0 auto' }} />
                
                <h2 style={{ margin: '0 0 5px 0' }}>
                    {bonusClaimed ? 'Wallet Connected' : 'Connect & Earn'}
                </h2>
                
                {!bonusClaimed && (
                    <p style={{ fontSize: '12px', color: '#FFD700', marginBottom: '15px', fontWeight:'bold' }}>
                        🎁 REWARD: +20,000 Points
                    </p>
                )}

                {/* Botón de TON (Siempre visible para conectar/desconectar) */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                    <TonConnectButton />
                </div>

                {/* Botón de Reclamar (Solo si está conectado y no ha reclamado) */}
                {!bonusClaimed && userFriendlyAddress && (
                    <button 
                        onClick={handleClaimBonus} 
                        disabled={loadingClaim}
                        className="btn-neon"
                        style={{ width: '100%', background: '#4CAF50', color: 'white', marginTop:'10px' }}
                    >
                        {loadingClaim ? 'Claiming...' : 'CLAIM 20K POINTS'}
                    </button>
                )}

                {bonusClaimed && (
                    <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', color:'#4CAF50', fontSize:'12px', marginTop:'10px'}}>
                        <Check size={14}/> Bonus Claimed
                    </div>
                )}
            </div>

            {/* Roadmap */}
            <h3 style={{ marginLeft: '5px', marginBottom: '15px' }}>🚀 Roadmap Status</h3>
            <div style={{ padding: '10px' }}>
                {phases.map((phase, index) => (
                    <div key={phase.id} style={{ display: 'flex', gap: '15px', marginBottom: '25px', opacity: phase.done ? 1 : 0.4 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {phase.done ? <CheckCircle2 color="#4CAF50" size={24} /> : <Circle color="#666" size={24} />}
                            {index < phases.length - 1 && <div style={{ width: '2px', height: '100%', background: phase.done ? '#4CAF50' : '#333', marginTop: '5px', minHeight: '30px' }} />}
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', color: phase.done ? '#fff' : '#888', fontSize:'14px' }}>{phase.title}</div>
                            <div style={{ fontSize: '12px', color: '#aaa' }}>{phase.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};