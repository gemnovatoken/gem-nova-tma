import React from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { StakingBank } from './StakingBank';
import { Zap, Cpu, Shield, Rocket, Lock, Play } from 'lucide-react';

interface PackNodeProps {
    title: string;
    points: string;
    price: string;
    color: string;
    icon: React.ReactNode;
    isLocked?: boolean; // Lógica para bloquear con video
    onClick: () => void;
    side: 'left' | 'right'; // Para alternar lados en el camino
}

export const BulkStore: React.FC = () => {
    const { user } = useAuth();

    const buyPack = async (pack: string) => {
        if(!user) return;
        let msg = "";
        // Mensajes de confirmación...
        if (pack === 'starter') msg = "Initialize Protocol: 10k Pts for 0.15 TON";
        else if (pack === 'pro') msg = "Upgrade System: 50k Pts for 0.75 TON";
        else if (pack === 'whale') msg = "Deploy Whale Node: 120k Pts for 1.50 TON";
        else if (pack === 'tycoon') msg = "Execute Tycoon Override: 800k Pts for 7.50 TON";
        else if (pack === 'emperor') msg = "System Overclock: 3M Pts for 25 TON";
        else if (pack === 'blackhole') msg = "⚠️ WARNING: GOD MODE (15M Pts) for 100 TON";

        if (!window.confirm(msg)) return;
        
        const { error } = await supabase.rpc('buy_bulk_pack', { user_id_in: user.id, pack_type: pack });
        if(!error) alert('✅ Transaction Verified. Database Updated.');
        else alert('Error: Transaction Failed');
    };

    // Función para desbloquear (Simulación de Video)
    const unlockPack = (packName: string) => {
        if(window.confirm(`🔒 This node is encrypted.\n\nWatch Ad-Stream to decrypt access to ${packName}?`)) {
            // Aquí iría tu lógica de video real
            alert("Decrypting... (Video playing)");
            setTimeout(() => buyPack(packName.toLowerCase()), 2000); // Compra automática tras video? O solo desbloqueo.
        }
    }

    return (
        <div className="cyber-bg" style={{ minHeight: '100%', paddingBottom: '120px', paddingTop: '20px' }}>
            
            {/* Línea de Flujo de Datos Central */}
            <div className="data-stream"></div>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 2 }}>
                <h2 style={{ 
                    color: '#00F2FE', textShadow: '0 0 10px #00F2FE', 
                    fontFamily: 'monospace', fontSize: '28px', margin: 0 
                }}>
                    &lt;SYSTEM STORE /&gt;
                </h2>
                <p style={{ color: '#aaa', fontSize: '10px', marginTop: '5px' }}>SECURE CONNECTION ESTABLISHED</p>
            </div>

            {/* --- EL CAMINO DE NODOS (Alternando Izquierda/Derecha) --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', padding: '0 20px' }}>
                
                <PackNode 
                    title="STARTER_NODE" points="10k" price="0.15 TON" 
                    color="#00F2FE" icon={<Zap size={18}/>} side="left"
                    onClick={() => buyPack('starter')} 
                />

                <PackNode 
                    title="PRO_MODULE" points="50k" price="0.75 TON" 
                    color="#4CAF50" icon={<Cpu size={18}/>} side="right"
                    onClick={() => buyPack('pro')} 
                />

                <PackNode 
                    title="WHALE_SERVER" points="120k" price="1.50 TON" 
                    color="#FFD700" icon={<Shield size={18}/>} side="left"
                    isLocked={true} onClick={() => unlockPack('WHALE')} // Ejemplo de bloqueo
                />

                <PackNode 
                    title="TYCOON_CORE" points="800k" price="7.50 TON" 
                    color="#E040FB" icon={<Rocket size={18}/>} side="right"
                    isLocked={true} onClick={() => unlockPack('TYCOON')}
                />

                {/* GOD MODE (Centro) */}
                <div style={{ position: 'relative', zIndex: 2, margin: '20px 0' }}>
                    <div className="cyber-card" style={{ 
                        textAlign: 'center', padding: '20px', border: '2px solid #fff', 
                        background: '#000', boxShadow: '0 0 30px rgba(255,255,255,0.3)' 
                    }}>
                        <h3 style={{margin:0, color:'#fff', fontSize:'24px', letterSpacing:'4px'}}>BLACK_HOLE</h3>
                        <p style={{color:'#aaa', fontSize:'10px'}}>ULTIMATE RESOURCE INJECTION</p>
                        <div style={{fontSize:'32px', fontWeight:'900', color:'#fff', margin:'10px 0', textShadow:'0 0 10px #fff'}}>15M PTS</div>
                        <button className="btn-cyber" style={{width:'100%', padding:'15px', fontSize:'16px'}} onClick={() => unlockPack('BLACKHOLE')}>
                            UNLOCK [100 TON]
                        </button>
                    </div>
                </div>

            </div>

            {/* --- LA BÓVEDA (Staking) --- */}
            <div style={{ marginTop: '60px', padding: '0 20px', position:'relative', zIndex:2 }}>
                {/* Conector visual */}
                <div style={{width:'4px', height:'40px', background:'#E040FB', margin:'0 auto 10px auto', boxShadow:'0 0 10px #E040FB'}}></div>
                
                <div className="circuit-vault" style={{ borderRadius: '15px', padding: '2px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.9)', borderRadius: '13px', overflow: 'hidden' }}>
                        {/* Usamos el componente del banco existente pero envuelto en el estilo cyber */}
                        <StakingBank />
                    </div>
                    {/* Decoración de "Luces LED" */}
                    <div style={{position:'absolute', bottom:'-5px', left:'20px', width:'30px', height:'4px', background:'#00F2FE', boxShadow:'0 0 10px #00F2FE'}}></div>
                    <div style={{position:'absolute', bottom:'-5px', right:'20px', width:'10px', height:'4px', background:'#FF512F', boxShadow:'0 0 10px #FF512F', animation:'blink 1s infinite'}}></div>
                </div>
            </div>
            
            <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }`}</style>
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
        {/* Línea conectora hacia el centro */}
        <div style={{
            position: 'absolute', top: '50%', 
            left: side === 'left' ? 'auto' : '0', 
            right: side === 'left' ? '0' : 'auto',
            width: '50%', height: '1px', background: color, 
            boxShadow: `0 0 8px ${color}`, zIndex: 0
        }}></div>

        <div className="cyber-card" style={{ 
            width: '160px', padding: '15px', borderRadius: '10px', 
            borderLeft: side === 'left' ? `4px solid ${color}` : '1px solid #333',
            borderRight: side === 'right' ? `4px solid ${color}` : '1px solid #333',
            cursor: 'pointer'
        }} onClick={onClick}>
            
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                <span style={{color:color}}>{icon}</span>
                {isLocked && <Lock size={14} color="#FF512F" />}
            </div>

            <div style={{fontSize:'12px', fontWeight:'bold', color:'#fff', marginBottom:'2px'}}>{title}</div>
            <div style={{fontSize:'18px', fontWeight:'900', color:color, textShadow:`0 0 5px ${color}`}}>{points}</div>
            
            <div style={{
                marginTop:'10px', fontSize:'10px', background: isLocked ? '#330000' : 'rgba(255,255,255,0.1)', 
                padding:'4px', textAlign:'center', color: isLocked ? '#FF512F' : '#fff', borderRadius:'4px',
                border: isLocked ? '1px solid #FF512F' : 'none'
            }}>
                {isLocked ? <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'4px'}}><Play size={8}/> UNLOCK</span> : price}
            </div>
        </div>
    </div>
);