import React from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

// 👇 ESTA ES LA CLAVE: "export const", NO "export default"
export const BulkStore: React.FC = () => {
    const { user } = useAuth();

    const buyPack = async (pack: string) => {
        if(!user) return;
        const { error } = await supabase.rpc('buy_bulk_pack', { user_id_in: user.id, pack_type: pack });
        if(!error) alert('Purchase Successful! Launchpad Updated 🚀');
        else alert('Error purchasing pack');
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            <h2 style={{marginTop: 0, fontSize:'24px'}}>🏦 Treasury</h2>
            <p style={{fontSize: '13px', color: '#aaa', marginBottom:'20px'}}>
                Buy points to upgrade faster & push the token price up for everyone.
            </p>
            
            {/* Starter Pack */}
            <div className="glass-card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                    <div style={{fontWeight: 'bold', fontSize: '18px'}}>Starter Pack</div>
                    <div style={{color: '#00F2FE', fontSize:'14px'}}>100,000 Pts</div>
                    <div style={{fontSize:'10px', color:'#4CAF50'}}>+25% ROI</div>
                </div>
                <button className="btn-neon" style={{padding: '10px 20px', fontSize:'14px'}} onClick={() => buyPack('starter')}>
                    0.15 TON
                </button>
            </div>

             {/* Whale Pack */}
             <div className="glass-card" style={{border: '1px solid #FFD700', background: 'rgba(255, 215, 0, 0.05)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <div style={{fontWeight: '900', fontSize: '18px', color: '#FFD700'}}>Whale Pack 🐳</div>
                        <div style={{color: '#fff', fontSize:'14px'}}>1,000,000 Pts</div>
                        <div style={{fontSize:'10px', color:'#4CAF50', fontWeight:'bold'}}>+40% ROI • BEST VALUE</div>
                    </div>
                    <button className="btn-neon" style={{padding: '10px 20px', background: '#FFD700', fontSize:'14px'}} onClick={() => buyPack('whale')}>
                        1.35 TON
                    </button>
                </div>
            </div>
        </div>
    );
};