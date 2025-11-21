import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Wallet, Users, TrendingUp } from 'lucide-react';

export const WalletRoadmap: React.FC = () => {
    const { user } = useAuth();
    const [recruitCount, setRecruitCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Calculamos ganancias estimadas
    const estimatedEarnings = recruitCount * 1000; 

    useEffect(() => {
        if (!user) return;

        const fetchReferralStats = async () => {
            const { count, error } = await supabase
                .from('user_score')
                .select('*', { count: 'exact', head: true }) 
                .eq('referred_by', user.id);

            if (!error && count !== null) {
                setRecruitCount(count);
            }
            setLoading(false);
        };

        fetchReferralStats();
    }, [user]);

    return (
        <div style={{ padding: '20px', textAlign: 'left', paddingBottom: '100px' }}>
            
            {/* TÍTULO */}
            <h2 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                <Wallet size={28} color="#00F2FE" /> Wallet & Assets
            </h2>

            {/* --- AQUÍ BORRAMOS LA TARJETA DEL AIRDROP/ROADMAP --- */}

            {/* TARJETA: RESUMEN DE EQUIPO */}
            <h3 style={{ marginTop: '20px', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#FFD700" /> Referral Earnings
            </h3>
            
            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Columna Izquierda: Conteo */}
                <div style={{ textAlign: 'center', flex: 1, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                        {loading ? '-' : recruitCount}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888' }}>RECRUITS</div>
                </div>

                {/* Columna Derecha: Ganancias */}
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFD700' }}>
                        {loading ? '-' : `+${estimatedEarnings.toLocaleString()}`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <TrendingUp size={10} /> PTS EARNED
                    </div>
                </div>
            </div>

            {/* BOTÓN DE RETIRO */}
            <button className="btn-neon" disabled style={{ width: '100%', marginTop: '15px', background: '#333', color: '#777', boxShadow: 'none', border: '1px solid #444' }}>
                CLAIM REWARDS (SOON)
            </button>

            {/* SECCIÓN LEGAL (Esta sí la dejamos por seguridad) */}
            <div style={{
                marginTop: '40px', 
                padding: '15px', 
                borderLeft: '3px solid #FFD700', 
                background: 'rgba(255, 215, 0, 0.05)',
                borderRadius: '0 8px 8px 0'
            }}>
                <p style={{ fontSize: '10px', color: '#888', margin: 0, lineHeight: '1.5' }}>
                    <strong>LEGAL DISCLAIMER:</strong><br/>
                    "GNOVA Points are game assets. Future conversion to tokens involves risk and depends on community liquidity goals. Not financial advice. No monetary value guaranteed."
                </p>
            </div>
        </div>
    );
};