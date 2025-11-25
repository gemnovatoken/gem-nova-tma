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
        
        let msg = "";
        // Todos los mensajes de confirmación
        if (pack === 'starter') msg = "Confirm Starter: 10,000 Pts for 0.15 TON";
        else if (pack === 'pro') msg = "Confirm Pro: 50,000 Pts for 0.75 TON";
        else if (pack === 'whale') msg = "Confirm Whale: 120,000 Pts for 1.50 TON";
        else if (pack === 'tycoon') msg = "Confirm Tycoon: 800,000 Pts for 7.50 TON";
        else if (pack === 'emperor') msg = "Confirm Emperor: 3,000,000 Pts for 25 TON";
        else if (pack === 'blackhole') msg = "Confirm Black Hole: 15,000,000 Pts for 100 TON";

        if (!window.confirm(msg)) return;
        
        const { error } = await supabase.rpc('buy_bulk_pack', { user_id_in: user.id, pack_type: pack });
        if(!error) alert('✅ Purchase Successful!'); else alert('Error');
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            
            <div style={{textAlign:'center', marginBottom:'20px'}}>
                <h2 style={{marginTop: 0, fontSize:'28px', marginBottom:'5px'}}>🏦 Treasury</h2>
                <p style={{fontSize: '13px', color: '#aaa', margin:0}}>
                    SCARCITY MODE: Limited Supply.
                </p>
            </div>
            
            {/* 1. GRID PEQUEÑOS (Starter, Pro, Whale, Tycoon) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom:'15px' }}>
                
                <PackCard 
                    title="Starter" basePoints="10k" price="0.15 TON" color="#00F2FE" 
                    onClick={() => buyPack('starter')} 
                />
                
                <PackCard 
                    title="Pro" basePoints="50k" bonusText="+Bonus" price="0.75 TON" color="#4CAF50" 
                    onClick={() => buyPack('pro')} 
                />

                <PackCard 
                    title="Whale" basePoints="120k" bonusText="+Bonus" price="1.50 TON" color="#FFD700" 
                    onClick={() => buyPack('whale')} 
                />
                
                <PackCard 
                    title="Tycoon" basePoints="800k" bonusText="POPULAR" price="7.50 TON" color="#E040FB" isBestValue={true} 
                    onClick={() => buyPack('tycoon')} 
                />
            </div>

            {/* 2. PAQUETES GIGANTES (Emperor, Black Hole) */}
            <div style={{ display: 'flex', flexDirection:'column', gap:'15px', marginBottom:'30px' }}>
                
                {/* EMPEROR */}
                <div className="glass-card" style={{
                    border: '1px solid #FF512F', background: 'rgba(255, 81, 47, 0.05)', 
                    display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px', margin:0
                }}>
                    <div>
                        <div style={{fontWeight:'900', fontSize: '18px', color: '#FF512F'}}>EMPEROR</div>
                        <div style={{color: '#fff', fontSize:'14px', fontWeight:'bold'}}>3,000,000 Pts</div>
                        <div style={{fontSize:'10px', color:'#fff'}}>INSTANT LEVEL 6</div>
                    </div>
                    <button className="btn-neon" style={{background:'#FF512F', color:'white', border:'none', padding:'10px 20px'}} onClick={() => buyPack('emperor')}>
                        25 TON
                    </button>
                </div>

                {/* BLACK HOLE */}
                <div className="glass-card" style={{
                    border: '2px solid #fff', background: 'linear-gradient(45deg, #000, #222)', 
                    padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', margin:0, position:'relative', overflow:'hidden'
                }}>
                    <div style={{position:'absolute', top:0, right:0, background:'#fff', color:'black', fontSize:'9px', padding:'3px 10px', fontWeight:'bold'}}>ULTIMATE</div>
                    <div>
                        <div style={{fontWeight:'900', fontSize: '20px', color: '#fff', textShadow:'0 0 10px #fff'}}>BLACK HOLE</div>
                        <div style={{color: '#fff', fontSize:'16px', fontWeight:'bold'}}>15,000,000 Pts</div>
                        <div style={{fontSize:'10px', color:'#4CAF50'}}>INSTANT LEVEL 8 + GOD MODE</div>
                    </div>
                    <button className="btn-neon" style={{background:'#fff', color:'#000', border:'none', fontWeight:'900', fontSize:'16px', padding:'10px 25px'}} onClick={() => buyPack('blackhole')}>
                        100 TON
                    </button>
                </div>

            </div>

            {/* 3. BANCO */}
            <StakingBank />

        </div>
    );
};

// Tarjeta Compacta
const PackCard: React.FC<PackCardProps> = ({ title, basePoints, bonusText, price, color, isBestValue, onClick }) => (
    <div className="glass-card" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center',
        border: isBestValue ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
        background: isBestValue ? `rgba(224, 64, 251, 0.08)` : undefined,
        margin: 0, padding: '15px', textAlign: 'center', position: 'relative',
        height: '100%'
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