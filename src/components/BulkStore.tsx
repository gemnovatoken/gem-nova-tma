import React from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { StakingBank } from './StakingBank';
import { Zap, Star, Crown, Hexagon } from 'lucide-react'; // Nuevos iconos visuales

interface PackCardProps {
    title: string;
    totalPoints: string;
    basePoints?: string;
    bonusPercent?: string;
    price: string;
    color: string;
    icon?: React.ReactNode;
    isBestValue?: boolean;
    isGodTier?: boolean;
    onClick: () => void;
}

export const BulkStore: React.FC = () => {
    const { user } = useAuth();

    const buyPack = async (pack: string) => {
        if(!user) return;
        
        let msg = "";
        if (pack === 'starter') msg = "Confirm Starter: 100,000 Pts for 0.15 TON";
        else if (pack === 'pro') msg = "Confirm Pro: 510,000 Pts (Includes +2% Bonus) for 0.75 TON";
        else if (pack === 'whale') msg = "Confirm Whale: 1.05M Pts (Includes +5% Bonus) for 1.50 TON";
        else if (pack === 'tycoon') msg = "Confirm Tycoon: 5.35M Pts (Includes +7% Bonus) for 7.50 TON";
        else if (pack === 'emperor') msg = "Confirm Emperor: 18.7M Pts (Includes +10% Bonus) for 25 TON";
        else if (pack === 'blackhole') msg = "Confirm Black Hole: 80.5M Pts (Includes +15% Bonus) for 100 TON";

        if (!window.confirm(msg)) return;
        const { error } = await supabase.rpc('buy_bulk_pack', { user_id_in: user.id, pack_type: pack });
        if(!error) alert('✅ Purchase Successful!'); else alert('Error');
    };

    return (
        <div style={{ padding: '15px', paddingBottom: '100px' }}>
            
            <div style={{textAlign:'center', marginBottom:'15px'}}>
                <h2 style={{marginTop: 0, fontSize:'24px', marginBottom:'2px'}}>🏦 Treasury</h2>
                <p style={{fontSize: '11px', color: '#aaa', margin:0}}>Select your resource pack.</p>
            </div>
            
            {/* GRID COMPACTO (4 Pequeños) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom:'15px' }}>
                <PackCard 
                    title="Starter" totalPoints="100k" price="0.15 TON" color="#00F2FE" 
                    icon={<Zap size={14}/>} onClick={() => buyPack('starter')} 
                />
                <PackCard 
                    title="Pro" totalPoints="510k" basePoints="500k Base" bonusPercent="+2%" price="0.75 TON" color="#4CAF50" 
                    icon={<Star size={14}/>} onClick={() => buyPack('pro')} 
                />
                <PackCard 
                    title="Whale" totalPoints="1.05M" basePoints="1M Base" bonusPercent="+5%" price="1.50 TON" color="#FFD700" 
                    icon={<Crown size={14}/>} onClick={() => buyPack('whale')} 
                />
                <PackCard 
                    title="Tycoon" totalPoints="5.35M" basePoints="5M Base" bonusPercent="+7%" price="7.50 TON" color="#E040FB" 
                    isBestValue={true} icon={<Hexagon size={14}/>} onClick={() => buyPack('tycoon')} 
                />
            </div>

            {/* LISTA PREMIUM (2 Grandes) */}
            <div style={{ display: 'flex', flexDirection:'column', gap:'10px', marginBottom:'25px' }}>
                {/* Emperor */}
                <div className="glass-card" style={{
                    margin:0, padding:'12px 15px', display:'flex', justifyContent:'space-between', alignItems:'center',
                    background: 'linear-gradient(90deg, rgba(255, 81, 47, 0.1) 0%, rgba(0,0,0,0) 100%)', border: '1px solid #FF512F'
                }}>
                    <div>
                        <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#FF512F', fontSize:'12px', fontWeight:'900'}}>
                            <Crown size={14}/> EMPEROR
                            <span style={{background:'#FF512F', color:'white', fontSize:'9px', padding:'1px 4px', borderRadius:'3px'}}>+10%</span>
                        </div>
                        <div style={{fontSize:'20px', fontWeight:'bold', color:'#fff'}}>18.7M <span style={{fontSize:'12px', color:'#aaa'}}>Pts</span></div>
                    </div>
                    <button className="btn-neon" onClick={() => buyPack('emperor')} style={{background:'#FF512F', border:'none', color:'white', padding:'8px 12px'}}>25 TON</button>
                </div>

                {/* Black Hole */}
                <div className="glass-card" style={{
                    margin:0, padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center',
                    background: 'linear-gradient(135deg, #111 0%, #333 100%)', border: '2px solid #fff', position:'relative', overflow:'hidden'
                }}>
                    {/* Efecto de brillo */}
                    <div style={{position:'absolute', top:-20, right:-20, width:80, height:80, background:'white', opacity:0.1, borderRadius:'50%', filter:'blur(20px)'}}></div>
                    
                    <div style={{zIndex:1}}>
                        <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#fff', fontSize:'14px', fontWeight:'900'}}>
                            🌌 BLACK HOLE
                            <span style={{background:'#fff', color:'black', fontSize:'9px', padding:'1px 4px', borderRadius:'3px'}}>+15%</span>
                        </div>
                        <div style={{fontSize:'24px', fontWeight:'bold', color:'#fff', textShadow:'0 0 10px rgba(255,255,255,0.5)'}}>80.5M <span style={{fontSize:'12px', color:'#aaa'}}>Pts</span></div>
                    </div>
                    <button className="btn-neon" onClick={() => buyPack('blackhole')} style={{background:'#fff', border:'none', color:'black', fontWeight:'900', padding:'10px 15px'}}>100 TON</button>
                </div>
            </div>

            <StakingBank />
        </div>
    );
};

// Tarjeta Compacta Optimizada
const PackCard: React.FC<PackCardProps> = ({ title, totalPoints, basePoints, bonusPercent, price, color, icon, isBestValue, onClick }) => (
    <div className="glass-card" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        border: isBestValue ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.05)',
        background: isBestValue ? `rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.1)` : 'rgba(255,255,255,0.02)',
        margin: 0, padding: '12px', position: 'relative', height: '120px'
    }}>
        {isBestValue && <div style={{position:'absolute', top:0, right:0, background:color, color:'white', fontSize:'8px', padding:'2px 6px', borderRadius:'0 0 0 8px', fontWeight:'bold'}}>BEST</div>}

        <div style={{width:'100%'}}>
            <div style={{display:'flex', alignItems:'center', gap:'5px', color:color, fontSize:'11px', fontWeight:'bold', marginBottom:'2px'}}>
                {icon} {title}
            </div>
            <div style={{fontSize:'18px', fontWeight:'bold', color:'#fff', lineHeight:'1.1'}}>{totalPoints}</div>
            {bonusPercent && (
                <div style={{fontSize:'9px', color:'#aaa', marginTop:'2px', display:'flex', gap:'4px'}}>
                   <span>{basePoints}</span> 
                   <span style={{color:'#4CAF50', fontWeight:'bold'}}>{bonusPercent}</span>
                </div>
            )}
            {!bonusPercent && <div style={{fontSize:'9px', color:'#555', marginTop:'2px'}}>Standard Rate</div>}
        </div>
        
        <button className="btn-neon" style={{
            width:'100%', padding: '6px', fontSize:'11px', marginTop:'auto',
            background: isBestValue ? color : 'rgba(255,255,255,0.1)', 
            color: isBestValue ? 'white' : '#ddd', border:'none'
        }} onClick={onClick}>
            {price}
        </button>
    </div>
);