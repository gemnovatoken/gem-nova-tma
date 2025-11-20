import React from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { StakingBank } from './StakingBank';

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
            <PackCard 
                title="Starter" 
                points="100,000" 
                price="0.15 TON" 
                bonus="+25%" 
                color="#00F2FE" 
                onClick={() => buyPack('starter')} 
            />
            
            {/* Pro Pack */}
            <PackCard 
                title="Pro" 
                points="500,000" 
                price="0.70 TON" 
                bonus="+34%" 
                color="#4CAF50" 
                onClick={() => buyPack('pro')} 
            />

             {/* Whale Pack */}
             <div className="glass-card" style={{border: '1px solid #FFD700', background: 'rgba(255, 215, 0, 0.05)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <div style={{fontWeight:'900', fontSize: '16px', color: '#FFD700'}}>Whale Pack 🐳</div>
                        <div style={{color: '#fff', fontSize:'12px'}}>1,000,000 Pts</div>
                        <div style={{fontSize:'10px', color:'#4CAF50', fontWeight:'bold'}}>+39% ROI</div>
                    </div>
                    <button className="btn-neon" style={{padding: '8px 16px', background: '#FFD700', fontSize:'12px', color:'black'}} onClick={() => buyPack('whale')}>
                        1.35 TON
                    </button>
                </div>
            </div>

            {/* Tycoon Pack */}
            <div className="glass-card" style={{border: '1px solid #E040FB', background: 'rgba(224, 64, 251, 0.1)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <div style={{fontWeight:'900', fontSize: '16px', color: '#E040FB'}}>TYCOON 👑</div>
                        <div style={{color: '#fff', fontSize:'12px'}}>5,000,000 Pts</div>
                        <div style={{fontSize:'10px', color:'#fff'}}>INSTANT LEVEL 7</div>
                    </div>
                    <button className="btn-neon" style={{padding: '8px 16px', background: 'linear-gradient(45deg, #E040FB, #00F2FE)', fontSize:'12px', color:'white', border:'none'}} onClick={() => buyPack('tycoon')}>
                        6.50 TON
                    </button>
                </div>
            </div>

            {/* Banco integrado */}
            <StakingBank />

        </div>
    );
};

// 👇 SOLUCIÓN: Definir la interfaz para las props
interface PackCardProps {
    title: string;
    points: string;
    price: string;
    bonus: string;
    color: string;
    onClick: () => void;
}

// Usar la interfaz en lugar de 'any'
const PackCard: React.FC<PackCardProps> = ({ title, points, price, bonus, color, onClick }) => (
    <div className="glass-card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
            <div style={{fontWeight:'bold', fontSize: '16px'}}>{title}</div>
            <div style={{color: '#fff', fontSize:'12px'}}>{points} Pts</div>
            <div style={{fontSize:'10px', color: color}}>{bonus} BONUS</div>
        </div>
        <button className="btn-neon" style={{padding: '8px 16px', fontSize:'12px'}} onClick={onClick}>
            {price}
        </button>
    </div>
);