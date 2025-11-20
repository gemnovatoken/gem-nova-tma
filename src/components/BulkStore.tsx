import React from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

export const BulkStore: React.FC = () => {
    const { user } = useAuth();

    const buyPack = async (pack: string) => {
        if(!user) return;
        // Here you would trigger the TON Connect transaction normally.
        // For now, we simulate the success call to database:
        const { error } = await supabase.rpc('buy_bulk_pack', { user_id_in: user.id, pack_type: pack });
        if(!error) alert('Purchase Successful! Launchpad Updated 🚀');
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{marginTop: 0}}>🏦 Treasury (Bulk Buy)</h2>
            <p style={{fontSize: '12px', color: '#aaa'}}>Buy points to upgrade faster & push the token price.</p>
            
            {/* Starter Pack */}
            <div className="glass-card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                    <div style={{fontWeight: 'bold', fontSize: '18px'}}>Starter Pack</div>
                    <div style={{color: '#00F2FE'}}>100,000 Pts</div>
                </div>
                <button className="btn-neon" style={{padding: '10px 20px'}} onClick={() => buyPack('starter')}>
                    0.15 TON
                </button>
            </div>

             {/* Whale Pack */}
             <div className="glass-card" style={{border: '1px solid #FFD700'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <div style={{fontWeight: 'bold', fontSize: '18px', color: '#FFD700'}}>Whale Pack 🐳</div>
                        <div style={{color: '#fff'}}>1,000,000 Pts</div>
                        <div style={{fontSize: '10px', color: '#4CAF50'}}>+40% FUTURE VALUE</div>
                    </div>
                    <button className="btn-neon" style={{padding: '10px 20px', background: '#FFD700'}} onClick={() => buyPack('whale')}>
                        1.35 TON
                    </button>
                </div>
            </div>
        </div>
    );
};