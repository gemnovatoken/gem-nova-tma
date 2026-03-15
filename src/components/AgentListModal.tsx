    import React, { useState, useEffect, useCallback } from 'react';
    import { supabase } from '../services/supabase';
    import { Users, CheckCircle2, X, ChevronDown, ChevronUp, Lock } from 'lucide-react';

    // --- INTERFACES ---
    interface ReferralUser {
        user_id: string;
        username: string;
        limit_level: number;
        bonus_claimed_initial: boolean;
        bonus_claimed_lvl4: boolean;
    }

    interface AgentListModalProps {
        userId: string;
        onClose: () => void;
        onRewardClaimed: (amount: number) => void;
    }

    export const AgentListModal: React.FC<AgentListModalProps> = ({ userId, onClose, onRewardClaimed }) => {
        const [referralList, setReferralList] = useState<ReferralUser[]>([]);
        const [loading, setLoading] = useState(true);
        const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
        
        // Estado para la Wallet
        const [userWallet, setUserWallet] = useState<string>('');
        const [walletSaved, setWalletSaved] = useState(false);
        const [savingWallet, setSavingWallet] = useState(false);

        // SOLUCIÓN 1 y 2: Creamos una función reutilizable que no detone warnings, 
        // extrayendo la lógica pura de Supabase fuera del renderizado principal.
        const loadDataFromSupabase = useCallback(async () => {
            try {
                // 1. Cargar Wallet del usuario actual
                const { data: userData } = await supabase
                    .from('user_score')
                    .select('wallet_address_levelup')
                    .eq('user_id', userId)
                    .single();
                
                if (userData?.wallet_address_levelup) {
                    setUserWallet(userData.wallet_address_levelup);
                    setWalletSaved(true);
                }

                // 2. Cargar lista de agentes
                const { data: agentsData, error } = await supabase.rpc('get_my_referrals_list', { my_id: userId });
                if (!error && agentsData) {
                    setReferralList(agentsData as ReferralUser[]);
                }
            } catch (error) {
                console.error("Error cargando datos:", error);
            }
        },[userId]);

        // EL EFECTO LIMPIO: Solo se ejecuta una vez cuando el componente se monta o el userId cambia
        useEffect(() => {
            let isMounted = true; // Patrón para evitar fugas de memoria

            const initFetch = async () => {
                setLoading(true);
                await loadDataFromSupabase();
                if (isMounted) setLoading(false);
            };

            initFetch();

            return () => {
                isMounted = false;
            };
        }, [loadDataFromSupabase]); // Ya no pide fetchData, es un efecto perfecto.

        // Función para guardar la Wallet en Supabase
        const handleSaveWallet = async () => {
            if (!userWallet.trim() || userWallet.length < 10) {
                alert("⚠️ Please enter a valid TON wallet address.");
                return;
            }
            setSavingWallet(true);
            const { error } = await supabase
                .from('user_score')
                .update({ wallet_address_levelup: userWallet.trim() })
                .eq('user_id', userId);

            if (!error) {
                setWalletSaved(true);
                alert("✅ Wallet Saved Successfully!\nYou can now claim your TON rewards.");
            } else {
                alert("❌ Error saving wallet.");
            }
            setSavingWallet(false);
        };

        // Función para reclamar los bonos Viejos (Init y Lvl4)
        const handleClaimOldReward = async (targetId: string, type: 'initial' | 'lvl4') => {
            const { data, error } = await supabase.rpc('claim_referral_reward', { referral_user_id: targetId, reward_type: type, my_id: userId });
            if (!error && data) {
                const amount = type === 'initial' ? 2500 : 5000;
                onRewardClaimed(amount);
                if (window.navigator.vibrate) window.navigator.vibrate(200);
                
                // Recargar datos silenciosamente sin volver a poner el loading general en true
                await loadDataFromSupabase(); 
            } else {
                alert("Error claiming reward.");
            }
        };

        // Función para los bonos NUEVOS (Nivel 5+)
        const handleClaimTonReward = async (targetId: string, levelReached: number, amountTon: number) => {
            if (!walletSaved) {
                alert("⚠️ ALERTA:\nPor favor, ingresa y guarda tu Wallet de TON en la parte inferior de la pantalla antes de reclamar.");
                return;
            }

            const confirmClaim = window.confirm(`¿Send ${amountTon} TON to this wallet?\n\n${userWallet}\n\nArrival time: 24-48 hours.`);
            if (!confirmClaim) return;

            // Aquí enviaremos la solicitud a la nueva tabla level_up_bonuses
            const { error } = await supabase
                .from('level_up_bonuses')
                .insert({
                    referrer_id: userId,
                    referred_id: targetId,
                    level_reached: levelReached,
                    bonus_amount_ton: amountTon,
                    wallet_address_levelup: userWallet,
                    status: 'PENDING'
                });

            if (!error) {
                alert(`✅ Claim Submitted!\n${amountTon} TON is on the way to your wallet.`);
                await loadDataFromSupabase(); 
            } else {
                alert("❌ Error submitting claim. Try again.");
                console.error(error);
            }
        };

        const toggleAgent = (id: string) => {
            setExpandedAgentId(expandedAgentId === id ? null : id);
        };

        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 6000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                <div className="glass-card" style={{ width: '100%', height: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid #00F2FE', position: 'relative', padding: '15px' }}>
                    
                    <button onClick={onClose} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#fff' }}><X /></button>
                    <h3 style={{ textAlign: 'center', color: '#00F2FE', marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <Users size={20} /> YOUR AGENTS
                    </h3>

                    {/* AREA SCROLLABLE PARA LA LISTA */}
                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
                        {loading ? (
                            <p style={{ textAlign: 'center', color: '#aaa' }}>Scanning blockchain...</p>
                        ) : referralList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                <p>No active agents found.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {referralList.map((refUser, index) => (
                                    <div key={refUser.user_id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid #333', overflow: 'hidden' }}>
                                        
                                        {/* CABECERA DEL ACORDEÓN */}
                                        <div 
                                            onClick={() => toggleAgent(refUser.user_id)}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', cursor: 'pointer' }}
                                        >
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <span style={{ color: '#aaa', fontSize: '12px' }}>#{index + 1}</span>
                                                <div>
                                                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>{refUser.username || 'Unknown'}</div>
                                                    <div style={{ fontSize: '10px', color: '#00F2FE' }}>Current Lvl: {refUser.limit_level}</div>
                                                </div>
                                            </div>
                                            {expandedAgentId === refUser.user_id ? <ChevronUp size={18} color="#aaa" /> : <ChevronDown size={18} color="#aaa" />}
                                        </div>

                                        {/* CONTENIDO DESPLEGABLE */}
                                        {expandedAgentId === refUser.user_id && (
                                            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                
                                                {/* Nivel 1: INIT */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                                    <span style={{ color: '#aaa' }}>Welcome Bonus</span>
                                                    {refUser.bonus_claimed_initial ? (
                                                        <span style={{ color: '#4CAF50', display: 'flex', gap: '4px', alignItems: 'center' }}><CheckCircle2 size={14}/> Claimed</span>
                                                    ) : (
                                                        <button onClick={() => handleClaimOldReward(refUser.user_id, 'initial')} style={{ background: '#4CAF50', color: '#000', border: 'none', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>GET 2.5K</button>
                                                    )}
                                                </div>

                                                {/* Nivel 4 */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                                    <span style={{ color: '#aaa' }}>Reach Level 4</span>
                                                    {refUser.bonus_claimed_lvl4 ? (
                                                        <span style={{ color: '#E040FB', display: 'flex', gap: '4px', alignItems: 'center' }}><CheckCircle2 size={14}/> Claimed</span>
                                                    ) : refUser.limit_level >= 4 ? (
                                                        <button onClick={() => handleClaimOldReward(refUser.user_id, 'lvl4')} style={{ background: '#E040FB', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>GET 5K</button>
                                                    ) : (
                                                        <span style={{ color: '#555', display: 'flex', gap: '4px', alignItems: 'center' }}><Lock size={12}/> Locked</span>
                                                    )}
                                                </div>

                                                {/* 🔥 NIVEL 5 (DINERO REAL) 🔥 */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed #444' }}>
                                                    <span style={{ color: '#FFD700', fontWeight: 'bold' }}>Reach Level 5</span>
                                                    {refUser.limit_level >= 5 ? (
                                                        <button onClick={() => handleClaimTonReward(refUser.user_id, 5, 0.25)} style={{ background: '#FFD700', color: '#000', border: 'none', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px' }}>CLAIM 0.25 TON</button>
                                                    ) : (
                                                        <span style={{ color: '#555', display: 'flex', gap: '4px', alignItems: 'center' }}><Lock size={12}/> Locked</span>
                                                    )}
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CAJA ESTÁTICA DE LA WALLET */}
                    <div style={{ background: 'rgba(255, 215, 0, 0.05)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '10px', padding: '12px', marginTop: 'auto' }}>
                        <div style={{ fontSize: '11px', color: '#FFD700', marginBottom: '8px', fontWeight: 'bold' }}>💰 WITHDRAWAL WALLET (TON)</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" 
                                value={userWallet}
                                onChange={(e) => { setUserWallet(e.target.value); setWalletSaved(false); }}
                                placeholder="Enter your TON Wallet Address..."
                                style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '10px' }}
                            />
                            <button 
                                onClick={handleSaveWallet}
                                disabled={savingWallet || walletSaved || userWallet === ''}
                                style={{ 
                                    background: walletSaved ? '#4CAF50' : '#00F2FE', 
                                    color: '#000', border: 'none', padding: '0 15px', borderRadius: '6px', fontWeight: 'bold', fontSize: '10px',
                                    opacity: (savingWallet || walletSaved || userWallet === '') ? 0.5 : 1
                                }}
                            >
                                {savingWallet ? '...' : (walletSaved ? 'SAVED' : 'SAVE')}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        );
    };