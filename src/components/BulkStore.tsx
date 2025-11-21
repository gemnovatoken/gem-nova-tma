import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Zap, Star, Crown, AlertTriangle } from 'lucide-react';import { StakingBank } from './StakingBank';

export const BulkStore: React.FC = () => {
    const { user } = useAuth();
    
    // Estado para el Pop-up de confirmación
    const [confirmData, setConfirmData] = useState<{pack: string, price: string} | null>(null);
    const [processing, setProcessing] = useState(false);

    const initiateBuy = (pack: string, price: string) => {
        setConfirmData({ pack, price });
    };

    const confirmPurchase = async () => {
        if(!user || !confirmData) return;
        setProcessing(true);

        const { error } = await supabase.rpc('buy_bulk_pack', { 
            user_id_in: user.id, 
            pack_type: confirmData.pack 
        });

        setProcessing(false);
        setConfirmData(null); // Cerrar modal

        if(!error) {
            alert('✅ Purchase Successful! Points added & Launchpad Updated 🚀');
        } else {
            alert('❌ Error processing transaction. Please try again.');
        }
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            <h2 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px'}}>
                🏦 Treasury <span style={{fontSize: '12px', background: '#333', padding: '2px 8px', borderRadius: '10px'}}>Bulk Buy</span>
            </h2>
            <p style={{fontSize: '13px', color: '#aaa', marginBottom: '20px'}}>
                Acquire Gem Points instantly. Every purchase pushes the token price up.
            </p>
            
            {/* Starter Pack */}
            <div className="glass-card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                    <div style={{background: 'rgba(0, 242, 254, 0.1)', padding: '10px', borderRadius: '50%'}}>
                        <Zap size={24} color="#00F2FE" />
                    </div>
                    <div>
                        <div style={{fontWeight: 'bold', fontSize: '16px'}}>Starter Pack</div>
                        <div style={{color: '#00F2FE', fontWeight: 'bold'}}>100,000 Pts</div>
                    </div>
                </div>
                <button className="btn-neon" style={{padding: '8px 16px', fontSize: '14px'}} onClick={() => initiateBuy('starter', '0.15')}>
                    0.15 TON
                </button>
            </div>

            {/* Pro Pack */}
            <div className="glass-card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255, 215, 0, 0.3)'}}>
                <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                    <div style={{background: 'rgba(255, 215, 0, 0.1)', padding: '10px', borderRadius: '50%'}}>
                        <Star size={24} color="#FFD700" />
                    </div>
                    <div>
                        <div style={{fontWeight: 'bold', fontSize: '16px', color: '#FFD700'}}>Pro Pack</div>
                        <div style={{color: '#fff', fontWeight: 'bold'}}>500,000 Pts</div>
                    </div>
                </div>
                <button className="btn-neon" style={{padding: '8px 16px', fontSize: '14px', background: 'linear-gradient(90deg, #FFD700, #FFA500)'}} onClick={() => initiateBuy('pro', '3.50')}>
                    3.50 TON
                </button>
            </div>

             {/* Whale Pack */}
             <div className="glass-card" style={{border: '1px solid #bd00ff', background: 'linear-gradient(145deg, rgba(189,0,255,0.05), rgba(0,0,0,0))'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                        <div style={{background: 'rgba(189, 0, 255, 0.1)', padding: '10px', borderRadius: '50%'}}>
                            <Crown size={24} color="#bd00ff" />
                        </div>
                        <div>
                            <div style={{fontWeight: 'bold', fontSize: '18px', color: '#bd00ff'}}>Whale Pack 🐳</div>
                            <div style={{color: '#fff', fontSize: '20px', fontWeight: 'bold'}}>1,000,000 Pts</div>
                            <div style={{fontSize: '10px', color: '#4CAF50', marginTop: '4px'}}>+ GLOBAL IMPACT</div>
                        </div>
                    </div>
                </div>
                <button className="btn-neon" style={{width: '100%', marginTop: '15px', padding: '12px', background: 'linear-gradient(90deg, #bd00ff, #7b00ff)', color: 'white'}} onClick={() => initiateBuy('whale', '6.75')}>
                    Buy for 6.75 TON
                </button>
            </div>

            {/* --- SECCIÓN DE STAKING --- */}
            <div style={{marginTop: '40px'}}>
                <StakingBank />
            </div>

            {/* --- MODAL DE CONFIRMACIÓN (POP UP) --- */}
            {confirmData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', zIndex: 5000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass-card" style={{width: '100%', maxWidth: '320px', textAlign: 'center', border: '1px solid #00F2FE', boxShadow: '0 0 30px rgba(0, 242, 254, 0.2)'}}>
                        <div style={{margin: '0 auto 15px', width: '60px', height: '60px', background: 'rgba(0, 242, 254, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <AlertTriangle color="#00F2FE" size={30} />
                        </div>
                        <h3 style={{color: '#fff', marginTop: 0}}>Confirm Transaction?</h3>
                        <p style={{color: '#ccc', fontSize: '14px'}}>
                            You are about to spend <strong>{confirmData.price} TON</strong> to acquire the <strong>{confirmData.pack.toUpperCase()}</strong> pack.
                        </p>
                        
                        <div style={{display: 'flex', gap: '10px', marginTop: '25px'}}>
                            <button onClick={() => setConfirmData(null)} style={{flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #555', background: 'transparent', color: '#aaa', cursor: 'pointer'}}>
                                CANCEL
                            </button>
                            <button onClick={confirmPurchase} disabled={processing} className="btn-neon" style={{flex: 1, fontSize: '14px'}}>
                                {processing ? 'PROCESSING...' : 'CONFIRM'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};