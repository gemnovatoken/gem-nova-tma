import React from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Zap, Star, Crown } from 'lucide-react';

export const BulkStore: React.FC = () => {
    const { user } = useAuth();

    const buyPack = async (pack: string, price: string) => {
        if(!user) return;
        // Aquí iría la conexión real con la Wallet de TON.
        // Por ahora, simulamos que el pago fue exitoso y llamamos a la base de datos:
        if(confirm(`Confirm purchase for ${price} TON?`)) {
            const { error } = await supabase.rpc('buy_bulk_pack', { user_id_in: user.id, pack_type: pack });
            if(!error) {
                alert('Purchase Successful! Points added & Launchpad Updated 🚀');
            } else {
                alert('Error processing transaction.');
                console.error(error);
            }
        }
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            <h2 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px'}}>
                🏦 Treasury <span style={{fontSize: '12px', background: '#333', padding: '2px 8px', borderRadius: '10px'}}>Bulk Buy</span>
            </h2>
            <p style={{fontSize: '13px', color: '#aaa', marginBottom: '20px'}}>
                Acquire Gem Points instantly to upgrade faster. Every purchase pushes the global token price up.
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
                <button className="btn-neon" style={{padding: '8px 16px', fontSize: '14px'}} onClick={() => buyPack('starter', '0.15')}>
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
                <button className="btn-neon" style={{padding: '8px 16px', fontSize: '14px', background: 'linear-gradient(90deg, #FFD700, #FFA500)'}} onClick={() => buyPack('pro', '3.50')}>
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
                <button className="btn-neon" style={{width: '100%', marginTop: '15px', padding: '12px', background: 'linear-gradient(90deg, #bd00ff, #7b00ff)', color: 'white'}} onClick={() => buyPack('whale', '6.75')}>
                    Buy for 6.75 TON
                </button>
            </div>

            {/* Disclaimer Legal */}
            <div style={{marginTop: '30px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px'}}>
                <p style={{fontSize: '10px', color: '#555', textAlign: 'justify', lineHeight: '1.4'}}>
                    DISCLAIMER: Virtual items purchased in Gem Nova Token are for entertainment purposes within the application ecosystem only. They do not represent a financial investment, equity, or security. The "Token Price" displayed is a simulated metric based on in-game activity and does not guarantee future market value. Purchases are final and non-refundable.
                </p>
            </div>
        </div>
    );
};