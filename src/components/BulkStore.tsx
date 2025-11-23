import React from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { StakingBank } from './StakingBank';

// Interfaz para evitar errores de 'any'
interface PackCardProps {
    title: string;
    points: string;
    bonus?: string; // Opcional porque el primero no tiene bono
    price: string;
    color: string;
    isBestValue?: boolean;
    onClick: () => void;
}

export const BulkStore: React.FC = () => {
    const { user } = useAuth();

    const buyPack = async (pack: string) => {
        if(!user) return;
        // Aquí iría la transacción real de TON
        const { error } = await supabase.rpc('buy_bulk_pack', { user_id_in: user.id, pack_type: pack });
        if(!error) alert('Purchase Successful! Points added 🚀');
        else alert('Error purchasing pack');
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            
            <div style={{textAlign:'center', marginBottom:'20px'}}>
                <h2 style={{marginTop: 0, fontSize:'28px', marginBottom:'5px'}}>🏦 Treasury</h2>
                <p style={{fontSize: '13px', color: '#aaa'}}>
                    Get points instantly. Higher tiers include <span style={{color:'#4CAF50'}}>FREE BONUS POINTS</span>.
                </p>
            </div>
            
            {/* 1. Starter (Base) */}
            <PackCard 
                title="Starter" 
                points="100,000" 
                price="0.15 TON" 
                color="#00F2FE" 
                onClick={() => buyPack('starter')} 
            />
            
            {/* 2. Pro (+5%) */}
            <PackCard 
                title="Pro" 
                points="525,000" 
                bonus="+5% BONUS"
                price="0.75 TON" 
                color="#4CAF50" 
                onClick={() => buyPack('pro')} 
            />

            {/* 3. Whale (+10%) */}
            <PackCard 
                title="Whale" 
                points="1,100,000" 
                bonus="+10% BONUS"
                price="1.50 TON" 
                color="#FFD700" 
                onClick={() => buyPack('whale')} 
            />
            
            {/* 4. Tycoon (+20%) - Destacado */}
            <PackCard 
                title="TYCOON 👑" 
                points="6,000,000" 
                bonus="+20% (1M FREE)"
                price="7.50 TON" 
                color="#E040FB" 
                isBestValue={true}
                onClick={() => buyPack('tycoon')} 
            />

            {/* Banco integrado */}
            <StakingBank />

        </div>
    );
};

const PackCard: React.FC<PackCardProps> = ({ title, points, bonus, price, color, isBestValue, onClick }) => (
    <div className="glass-card" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        border: isBestValue ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
        background: isBestValue ? `rgba(224, 64, 251, 0.08)` : undefined,
        position: 'relative', overflow: 'visible'
    }}>
        {isBestValue && (
            <div style={{
                position:'absolute', top:-10, right:10, 
                background: color, color:'white', fontSize:'9px', padding:'2px 8px', borderRadius:'4px', fontWeight:'bold',
                boxShadow: `0 0 10px ${color}`
            }}>
                BEST VALUE
            </div>
        )}

        <div>
            <div style={{fontWeight:'900', fontSize: '16px', color: isBestValue ? color : 'white'}}>{title}</div>
            <div style={{color: '#fff', fontSize:'14px', margin:'2px 0'}}>{points} Pts</div>
            {bonus && <div style={{fontSize:'10px', color: '#4CAF50', fontWeight:'bold'}}>{bonus}</div>}
        </div>
        
        <button className="btn-neon" style={{
            padding: '10px 16px', fontSize:'12px', 
            background: isBestValue ? `linear-gradient(45deg, ${color}, #00F2FE)` : undefined,
            border: 'none', color: isBestValue ? 'white' : 'black'
        }} onClick={onClick}>
            {price}
        </button>
    </div>
);