import React from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { StakingBank } from './StakingBank';

interface PackCardProps {
    title: string;
    basePoints: string;
    bonusText?: string;
    price: string;
    color: string;
    isBestValue?: boolean;
    onClick: () => void;
}

export const BulkStore: React.FC = () => {
    const { user } = useAuth();

    const buyPack = async (pack: string) => {
        if(!user) return;
        // Mensajes de confirmación
        let confirmMessage = "";
        if (pack === 'starter') confirmMessage = "Confirm Starter: 100k Pts for 0.15 TON";
        else if (pack === 'pro') confirmMessage = "Confirm Pro: 525k Pts for 0.75 TON";
        else if (pack === 'whale') confirmMessage = "Confirm Whale: 1.1M Pts for 1.50 TON";
        else if (pack === 'tycoon') confirmMessage = "Confirm Tycoon: 6M Pts for 7.50 TON";

        if (!window.confirm(confirmMessage)) return;
        
        const { error } = await supabase.rpc('buy_bulk_pack', { user_id_in: user.id, pack_type: pack });
        if(!error) alert('✅ Purchase Successful!');
        else alert('Error purchasing pack');
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            
            <div style={{textAlign:'center', marginBottom:'20px'}}>
                <h2 style={{marginTop: 0, fontSize:'24px', marginBottom:'5px'}}>🏦 Treasury</h2>
                <p style={{fontSize: '12px', color: '#aaa', margin:0}}>
                    Instant Points & Liquidity
                </p>
            </div>
            
            {/* --- GRID DE PAQUETES (2x2) --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom:'30px' }}>
                
                {/* Pack 1 */}
                <PackCard 
                    title="Starter" 
                    basePoints="100k" 
                    price="0.15 TON" 
                    color="#00F2FE" 
                    onClick={() => buyPack('starter')} 
                />
                
                {/* Pack 2 */}
                <PackCard 
                    title="Pro" 
                    basePoints="500k" 
                    bonusText="+5%" 
                    price="0.75 TON" 
                    color="#4CAF50" 
                    onClick={() => buyPack('pro')} 
                />

                {/* Pack 3 */}
                <PackCard 
                    title="Whale" 
                    basePoints="1M" 
                    bonusText="+10%" 
                    price="1.50 TON" 
                    color="#FFD700" 
                    onClick={() => buyPack('whale')} 
                />
                
                {/* Pack 4 (Tycoon) - Destacado */}
                <PackCard 
                    title="TYCOON" 
                    basePoints="5M" 
                    bonusText="+20%" 
                    price="7.50 TON" 
                    color="#E040FB" 
                    isBestValue={true}
                    onClick={() => buyPack('tycoon')} 
                />
            </div>

            {/* Banco integrado abajo */}
            <StakingBank />

        </div>
    );
};

// Tarjeta Compacta (Vertical para Grid)
const PackCard: React.FC<PackCardProps> = ({ title, basePoints, bonusText, price, color, isBestValue, onClick }) => (
    <div className="glass-card" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center',
        border: isBestValue ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
        background: isBestValue ? `rgba(224, 64, 251, 0.08)` : undefined,
        margin: 0, padding: '15px', textAlign: 'center', position: 'relative',
        height: '100%' // Para que todas tengan la misma altura
    }}>
        {isBestValue && (
            <div style={{
                position:'absolute', top:0, right:0, 
                background: color, color:'white', fontSize:'8px', padding:'2px 6px', borderRadius:'0 0 0 8px', fontWeight:'bold'
            }}>
                BEST
            </div>
        )}

        <div style={{marginBottom:'10px'}}>
            <div style={{fontWeight:'900', fontSize: '14px', color: isBestValue ? color : 'white'}}>{title}</div>
            <div style={{color: '#fff', fontSize:'18px', fontWeight:'bold', margin:'5px 0'}}>{basePoints}</div>
            {bonusText && <div style={{fontSize:'10px', color: '#4CAF50', fontWeight:'bold'}}>{bonusText}</div>}
        </div>
        
        <button className="btn-neon" style={{
            width:'100%', padding: '8px', fontSize:'12px', 
            background: isBestValue ? `linear-gradient(45deg, ${color}, #00F2FE)` : undefined,
            border: 'none', color: isBestValue ? 'white' : 'black'
        }} onClick={onClick}>
            {price}
        </button>
    </div>
);