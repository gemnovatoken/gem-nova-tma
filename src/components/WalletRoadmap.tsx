import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Wallet, Users, TrendingUp, ShieldCheck } from 'lucide-react';

export const WalletRoadmap: React.FC = () => {
    const { user } = useAuth();
    const [recruitCount, setRecruitCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Calculamos ganancias estimadas (Ejemplo: 1000 pts por amigo)
    const estimatedEarnings = recruitCount * 1000; 

    useEffect(() => {
        if (!user) return;

        const fetchReferralStats = async () => {
            // Contamos cuántas filas tienen 'referred_by' igual a mi ID
            // count: 'exact' nos da el número sin bajar todos los datos (ahorra datos)
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

            {/* TARJETA 1: ESTATUS DEL AIRDROP */}
            <div className="glass-card" style={{ border: '1px solid rgba(0, 242, 254, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <div style={{ color: '#aaa', fontSize: '12px', marginBottom: '5px', letterSpacing: '1px' }}>AIRDROP STATUS</div>
                        <div style={{ color: '#00F2FE', fontWeight: 'bold', fontSize: '20px' }}>PHASE 1: MINING</div>
                    </div>
                    <ShieldCheck size={24} color="#4CAF50" />
                </div>
                <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', marginTop: '15px', overflow: 'hidden' }}>
                    <div style={{ width: '35%', height: '100%', background: '#00F2FE', boxShadow: '0 0 10px #00F2FE' }}></div>
                </div>
                <p style={{ fontSize: '12px', marginTop: '10px', color: '#ccc' }}>
                    Listing date will be announced once liquidity goal is reached. Connect TON wallet coming soon.
                </p>
            </div>

            {/* TARJETA 2: RESUMEN DE EQUIPO (Lo que pediste) */}
            <h3 style={{ marginTop: '30px', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

            {/* BOTÓN DE RETIRO (Desactivado por ahora) */}
            <button className="btn-neon" disabled style={{ width: '100%', marginTop: '10px', background: '#333', color: '#777', boxShadow: 'none', border: '1px solid #444' }}>
                CLAIM REWARDS (SOON)
            </button>

            {/* SECCIÓN LEGAL */}
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