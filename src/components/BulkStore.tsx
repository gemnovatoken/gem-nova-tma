import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { StakingBank } from './StakingBank';
// 1. Limpieza de Iconos: Quitamos Cpu, usamos Star
import { Zap, Star, Crown, Hexagon, Rocket, Shield, Lock, Play } from 'lucide-react';

interface PackCardProps {
    title: string;
    totalPoints: string;
    basePoints: string;
    bonusText?: string;
    price: string;
    color: string;
    icon: React.ReactNode;
    isBestValue?: boolean;
    isLocked?: boolean;
    onUnlock?: () => void;
    onClick: () => void;
}

interface BigCardProps {
    title: string;
    points: string;
    bonus: string;
    price: string;
    color: string;
    icon: React.ReactNode;
    isLocked?: boolean;
    isGodMode?: boolean;
    onUnlock?: () => void;
    onClick: () => void;
}

export const BulkStore: React.FC = () => {
    const { user } = useAuth();
    const [unlocked, setUnlocked] = useState<string[]>([]);

    const handleUnlock = (packId: string) => {
        if(window.confirm(`🔒 SECURE NODE.\n\nWatch Ad-Stream to decrypt the ${packId.toUpperCase()} Protocol?`)) {
            console.log("Playing Ad...");
            setTimeout(() => {
                setUnlocked(prev => [...prev, packId]);
                alert("🔓 Node Decrypted! Purchase authorized.");
            }, 2000);
        }
    };

    const buyPack = async (pack: string) => {
        if(!user) return;
        
        let msg = "";
        if (pack === 'starter') msg = "Confirm Starter: 100,000 Pts for 0.15 TON";
        else if (pack === 'pro') msg = "Confirm Pro: 510,000 Pts for 0.75 TON";
        else if (pack === 'whale') msg = "Confirm Whale: 1,050,000 Pts for 1.50 TON";
        else if (pack === 'tycoon') msg = "Confirm Tycoon: 5,350,000 Pts for 7.50 TON";
        else if (pack === 'emperor') msg = "Confirm Emperor: 18,700,000 Pts for 25.00 TON";
        else if (pack === 'blackhole') msg = "Confirm Black Hole: 80,500,000 Pts for 100.00 TON";

        if (!window.confirm(msg)) return;
        
        const { error } = await supabase.rpc('buy_bulk_pack', { user_id_in: user.id, pack_type: pack });
        if(!error) alert('✅ Purchase Successful!');
        else alert('Error purchasing pack');
    };

    return (
        <div className="cyber-bg" style={{ minHeight: '100%', paddingBottom: '120px', paddingTop: '20px' }}>
            
            <div className="data-stream"></div>

            <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 2 }}>
                <h2 style={{ color: '#00F2FE', textShadow: '0 0 10px #00F2FE', fontFamily: 'monospace', fontSize: '28px', margin: 0 }}>
                    &lt;TREASURY /&gt;
                </h2>
                <p style={{ color: '#aaa', fontSize: '10px', marginTop: '5px' }}>SECURE CONNECTION ESTABLISHED</p>
            </div>

            {/* --- GRID (4 Paquetes) --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '0 20px', position: 'relative', zIndex: 2 }}>
                
                <PackCard 
                    title="STARTER" totalPoints="100k" basePoints="100k Base" 
                    price="0.15 TON" color="#00F2FE" icon={<Zap size={16}/>} 
                    onClick={() => buyPack('starter')} 
                />

                <PackCard 
                    title="PRO_MOD" totalPoints="510k" basePoints="500k Base" bonusText="+2%"
                    price="0.75 TON" color="#4CAF50" icon={<Star size={16}/>} 
                    onClick={() => buyPack('pro')} 
                />

                <PackCard 
                    title="WHALE_NODE" totalPoints="1.05M" basePoints="1M Base" bonusText="+5%"
                    price="1.50 TON" color="#FFD700" icon={<Shield size={16}/>} 
                    isLocked={!unlocked.includes('whale')} onUnlock={() => handleUnlock('whale')}
                    onClick={() => buyPack('whale')} 
                />

                <PackCard 
                    title="TYCOON_CORE" totalPoints="5.35M" basePoints="5M Base" bonusText="+7%"
                    price="7.50 TON" color="#E040FB" icon={<Rocket size={16}/>} isBestValue={true}
                    isLocked={!unlocked.includes('tycoon')} onUnlock={() => handleUnlock('tycoon')}
                    onClick={() => buyPack('tycoon')}
                />

            </div>

            {/* --- PAQUETES GIGANTES --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 20px', marginTop: '20px', position: 'relative', zIndex: 2 }}>
                
                <CyberBigCard 
                    title="EMPEROR_SYS" points="18.7M" bonus="+10%" price="25 TON" color="#FF512F" icon={<Crown size={14}/>}
                    isLocked={!unlocked.includes('emperor')} onUnlock={() => handleUnlock('emperor')}
                    onClick={() => buyPack('emperor')}
                />

                <CyberBigCard 
                    title="BLACK_HOLE" points="80.5M" bonus="+15%" price="100 TON" color="#fff" icon={<Hexagon size={14}/>}
                    isLocked={!unlocked.includes('blackhole')} onUnlock={() => handleUnlock('blackhole')}
                    onClick={() => buyPack('blackhole')} isGodMode={true}
                />
            </div>

            {/* --- BÓVEDA --- */}
            <div style={{ marginTop: '40px', padding: '0 20px', position:'relative', zIndex:2 }}>
                <div style={{width:'4px', height:'30px', background:'#E040FB', margin:'0 auto', boxShadow:'0 0 10px #E040FB'}}></div>
                <div className="circuit-vault" style={{ borderRadius: '15px', padding: '2px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.95)', borderRadius: '13px', overflow: 'hidden' }}>
                        <StakingBank />
                    </div>
                </div>
            </div>
            
        </div>
    );
};

const PackCard: React.FC<PackCardProps> = ({ title, totalPoints, basePoints, bonusText, price, color, icon, isBestValue, isLocked, onUnlock, onClick }) => (
    <div className="cyber-card" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '15px', borderRadius: '0', border: isBestValue ? `1px solid ${color}` : '1px solid #333',
        height: '100%', position:'relative'
    }}>
        {isBestValue && <div style={{position:'absolute', top:-10, right:0, background:color, color:'black', fontSize:'8px', padding:'2px 6px', fontWeight:'bold'}}>BEST</div>}

        <div style={{width:'100%'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', color:color, fontSize:'11px', fontWeight:'bold', marginBottom:'5px', fontFamily:'monospace'}}>
                <span style={{display:'flex', gap:'5px'}}>{icon} {title}</span>
                {isLocked && <Lock size={12} color="#FF512F"/>}
            </div>
            <div style={{fontSize:'18px', fontWeight:'bold', color:'#fff', lineHeight:'1.1', filter: isLocked ? 'blur(4px)' : 'none'}}>
                {totalPoints}
            </div>
            
            <div style={{fontSize:'9px', color:'#555', marginTop:'2px'}}>{basePoints}</div>
            
            {bonusText && (
                <div style={{fontSize:'9px', color:'#4CAF50', marginTop:'0px', fontWeight:'bold'}}>{bonusText}</div>
            )}
        </div>
        
        {isLocked ? (
            <button className="btn-cyber" style={{width:'100%', padding:'8px', fontSize:'10px', marginTop:'15px', borderColor:'#FF512F', color:'#FF512F'}} onClick={onUnlock}>
                <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'}}><Play size={8}/> UNLOCK</span>
            </button>
        ) : (
            <button className="btn-cyber" style={{width:'100%', padding:'8px', fontSize:'10px', marginTop:'15px', borderColor:color, color:color}} onClick={onClick}>
                {price}
            </button>
        )}
    </div>
);

const CyberBigCard: React.FC<BigCardProps> = ({ title, points, bonus, price, color, icon, isLocked, onUnlock, onClick, isGodMode }) => (
    <div className="cyber-card" style={{ 
        padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center', 
        border: isGodMode ? '2px solid #fff' : `1px solid ${color}`,
        background: isGodMode ? '#000' : undefined
    }}>
        <div>
            <div style={{display:'flex', alignItems:'center', gap:'5px', color:color, fontSize:'12px', fontWeight:'900'}}>
                {icon} {title}
                {isLocked && <Lock size={12} color="#FF512F" style={{marginLeft:'5px'}}/>}
                <span style={{background:color, color:'black', fontSize:'9px', padding:'1px 4px', borderRadius:'3px'}}>{bonus}</span>
            </div>
            <div style={{fontSize:'20px', fontWeight:'bold', color:'#fff', filter: isLocked ? 'blur(5px)' : 'none'}}>
                {points} <span style={{fontSize:'12px', color:'#aaa'}}>Pts</span>
            </div>
        </div>
        
        {isLocked ? (
             <button className="btn-cyber" style={{padding:'10px', borderColor:'#FF512F', color:'#FF512F'}} onClick={onUnlock}>
                UNLOCK
             </button>
        ) : (
             <button className="btn-cyber" style={{
                 padding:'10px', 
                 borderColor:color, 
                 background: isGodMode ? '#fff' : undefined, 
                 color: isGodMode ? '#000' : color 
             }} onClick={onClick}>
                {price}
             </button>
        )}
    </div>
);