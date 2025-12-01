import React from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { StakingBank } from './StakingBank';
import { Zap, Cpu, Shield, Rocket, Lock, Play, Hexagon, Crown } from 'lucide-react';

interface PackNodeProps {
    title: string;
    points: string;
    price: string;
    color: string;
    icon: React.ReactNode;
    isLocked?: boolean;
    onClick: () => void;
    side: 'left' | 'right'; // Para alternar en el camino
}

export const BulkStore: React.FC = () => {
    const { user } = useAuth();

    const buyPack = async (pack: string) => {
        if(!user) return;
        
        // Mensajes de confirmación
        let msg = "";
        if (pack === 'starter') msg = "Initialize Protocol: 100k Pts for 0.15 TON";
        else if (pack === 'pro') msg = "Upgrade System: 500k Pts for 0.75 TON";
        else if (pack === 'whale') msg = "Deploy Whale Node: 1M Pts for 1.50 TON";
        else if (pack === 'tycoon') msg = "Execute Tycoon Override: 5M Pts for 7.50 TON";
        else if (pack === 'emperor') msg = "System Overclock: 17M Pts for 25 TON";
        else if (pack === 'blackhole') msg = "⚠️ WARNING: GOD MODE (70M Pts) for 100 TON";

        if (!window.confirm(msg)) return;
        
        const { error } = await supabase.rpc('buy_bulk_pack', { user_id_in: user.id, pack_type: pack });
        if(!error) alert('✅ Transaction Verified. Database Updated.');
        else alert('Error: Transaction Failed');
    };

    // Función simulada para desbloquear con video
    const unlockPack = (packName: string) => {
        if(window.confirm(`🔒 SECURE NODE DETECTED.\n\nWatch Ad-Stream to decrypt access to ${packName}?`)) {
            console.log("Playing Ad for:", packName);
            alert("🔓 Decrypting... Node Access Granted.");
            // Aquí llamarías a tu lógica de anuncios real
        }
    }

    return (
        <div className="cyber-bg" style={{ minHeight: '100%', paddingBottom: '120px', paddingTop: '20px' }}>
            
            {/* 1. Línea de Flujo de Datos Central */}
            <div className="data-stream"></div>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '50px', position: 'relative', zIndex: 2 }}>
                <h2 style={{ 
                    color: '#00F2FE', textShadow: '0 0 15px #00F2FE', 
                    fontFamily: 'monospace', fontSize: '32px', margin: 0, letterSpacing: '4px'
                }}>
                    &lt;NET_STORE /&gt;
                </h2>
                <div style={{width: '100px', height: '2px', background: '#00F2FE', margin: '10px auto', boxShadow: '0 0 10px #00F2FE'}}></div>
                <p style={{ color: '#aaa', fontSize: '10px' }}>SECURE CONNECTION: ENCRYPTED</p>
            </div>

            {/* --- EL CAMINO DE NODOS (Alternando Lados) --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '50px', padding: '0 20px', position: 'relative' }}>
                
                {/* Nivel 1: Starter (Abierto) - Izquierda */}
                <PackNode 
                    title="STARTER_NODE" points="100k" price="0.15 TON" 
                    color="#00F2FE" icon={<Zap size={20}/>} side="left"
                    onClick={() => buyPack('starter')} 
                />

                {/* Nivel 2: Pro (Abierto) - Derecha */}
                <PackNode 
                    title="PRO_MODULE" points="500k" price="0.75 TON" 
                    color="#4CAF50" icon={<Cpu size={20}/>} side="right"
                    onClick={() => buyPack('pro')} 
                />

                {/* Nivel 3: Whale (Bloqueado) - Izquierda */}
                <PackNode 
                    title="WHALE_SERVER" points="1M" price="1.50 TON" 
                    color="#FFD700" icon={<Shield size={20}/>} side="left"
                    isLocked={true} onClick={() => unlockPack('WHALE')} 
                />

                {/* Nivel 4: Tycoon (Bloqueado) - Derecha */}
                <PackNode 
                    title="TYCOON_CORE" points="5M" price="7.50 TON" 
                    color="#E040FB" icon={<Rocket size={20}/>} side="right"
                    isLocked={true} onClick={() => unlockPack('TYCOON')}
                />

                {/* Nivel 5: Emperor (Bloqueado) - Izquierda */}
                <PackNode 
                    title="EMPEROR_SYS" points="17M" price="25 TON" 
                    color="#FF512F" icon={<Crown size={20}/>} side="left"
                    isLocked={true} onClick={() => unlockPack('EMPEROR')}
                />

                {/* Nivel GOD: Black Hole (Centro) */}
                <div style={{ position: 'relative', zIndex: 2, margin: '40px 0' }}>
                    <div className="cyber-card" style={{ 
                        textAlign: 'center', padding: '30px', border: '2px solid #fff', 
                        background: '#000', boxShadow: '0 0 40px rgba(255,255,255,0.2)' 
                    }}>
                        <div style={{position:'absolute', top:-15, left:'50%', transform:'translateX(-50%)', background:'white', color:'black', padding:'2px 10px', fontSize:'10px', fontWeight:'bold'}}>ULTIMATE</div>
                        <Hexagon size={40} color="#fff" style={{margin:'0 auto 10px auto'}}/>
                        <h3 style={{margin:0, color:'#fff', fontSize:'24px', letterSpacing:'4px'}}>BLACK_HOLE</h3>
                        <p style={{color:'#aaa', fontSize:'10px', margin:'5px 0'}}>DATA INJECTION: 70M PTS</p>
                        
                        <button className="btn-cyber" style={{width:'100%', padding:'15px', fontSize:'16px', marginTop:'15px', background:'#fff', color:'#000'}} onClick={() => unlockPack('BLACKHOLE')}>
                            <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>
                                <Lock size={16}/> UNLOCK [100 TON]
                            </span>
                        </button>
                    </div>
                </div>

            </div>

            {/* --- LA BÓVEDA (Staking) --- */}
            <div style={{ marginTop: '60px', padding: '0 20px', position:'relative', zIndex:2 }}>
                {/* Conector de energía hacia la bóveda */}
                <div style={{width:'6px', height:'60px', background:'#E040FB', margin:'0 auto 15px auto', boxShadow:'0 0 15px #E040FB'}}></div>
                
                <div className="circuit-vault" style={{ borderRadius: '20px', padding: '4px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.95)', borderRadius: '16px', overflow: 'hidden', padding:'10px' }}>
                        <StakingBank />
                    </div>
                    {/* Luces LED decorativas */}
                    <div style={{position:'absolute', bottom:'10px', left:'20px', width:'40px', height:'4px', background:'#00F2FE', boxShadow:'0 0 10px #00F2FE'}}></div>
                    <div style={{position:'absolute', bottom:'10px', right:'20px', width:'15px', height:'4px', background:'#FF512F', boxShadow:'0 0 10px #FF512F', animation:'blink 1s infinite'}}></div>
                </div>
                <div style={{textAlign:'center', color:'#E040FB', fontSize:'10px', marginTop:'10px', letterSpacing:'2px'}}>SECURE VAULT ACCESS</div>
            </div>
            
            <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
        </div>
    );
};

// Componente de Nodo Individual
const PackNode: React.FC<PackNodeProps> = ({ title, points, price, color, icon, isLocked, onClick, side }) => (
    <div style={{ 
        display: 'flex', 
        justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
        position: 'relative' 
    }}>
        {/* Conector horizontal hacia la línea central */}
        <div style={{
            position: 'absolute', top: '50%', 
            left: side === 'left' ? 'auto' : '50%', 
            right: side === 'left' ? '50%' : 'auto',
            width: '50%', height: '2px', background: color, 
            boxShadow: `0 0 10px ${color}`, zIndex: 0,
            opacity: 0.5
        }}>
            {/* Punto de conexión en la línea central */}
            <div style={{
                position: 'absolute', 
                [side === 'left' ? 'right' : 'left']: '-4px', 
                top: '-3px', width: '8px', height: '8px', 
                background: color, borderRadius: '50%', boxShadow: `0 0 10px ${color}`
            }}></div>
        </div>

        <div className="cyber-card" style={{ 
            width: '180px', padding: '15px', borderRadius: '0', 
            borderLeft: side === 'left' ? `4px solid ${color}` : '1px solid #333',
            borderRight: side === 'right' ? `4px solid ${color}` : '1px solid #333',
            cursor: 'pointer', display:'flex', flexDirection:'column', gap:'10px'
        }} onClick={onClick}>
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{color:color, display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', fontWeight:'bold', fontFamily:'monospace'}}>
                    {icon} {title}
                </div>
                {isLocked && <Lock size={14} color="#FF512F" />}
            </div>

            <div style={{fontSize:'24px', fontWeight:'900', color:'#fff', textShadow:`0 0 10px ${color}40`}}>
                {points}
            </div>
            
            {isLocked ? (
                <button className="btn-cyber" style={{fontSize:'10px', padding:'8px', borderColor:'#FF512F', color:'#FF512F'}}>
                    <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'}}>
                        <Play size={10}/> WATCH TO UNLOCK
                    </span>
                </button>
            ) : (
                <button className="btn-cyber" style={{fontSize:'12px', padding:'8px', borderColor:color, color:color}}>
                    {price}
                </button>
            )}
        </div>
    </div>
);