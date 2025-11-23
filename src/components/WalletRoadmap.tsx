import React from 'react';
import { X, CheckCircle, Circle, Wallet, Map } from 'lucide-react';

// 1. Definimos la estructura de un paso del Roadmap
interface RoadmapStep {
    phase: string;
    title: string;
    status: 'done' | 'active' | 'upcoming';
}

// 2. Definimos las Props que recibe este componente (ADIÓS ANY)
interface RoadmapWalletProps {
    onClose: () => void;           // Función para cerrar el modal
    walletAddress: string | null;  // Dirección de la wallet (texto o null)
    onConnect: () => void;         // Función para conectar la wallet
}

// Datos del Roadmap (puedes moverlos a una config externa si prefieres)
const ROADMAP_STEPS: RoadmapStep[] = [
    { phase: 'Q1 2024', title: 'Community Launch & Mining', status: 'done' },
    { phase: 'Q2 2024', title: 'Boosters & Social Tasks', status: 'done' },
    { phase: 'Q3 2024', title: 'Wallet Connect Integration', status: 'active' },
    { phase: 'Q4 2024', title: 'Token Airdrop & Listing', status: 'upcoming' },
];

export const RoadmapWallet: React.FC<RoadmapWalletProps> = ({ onClose, walletAddress, onConnect }) => {
    
    // Función auxiliar para renderizar el icono según estado
    const renderStatusIcon = (status: string) => {
        if (status === 'done') return <CheckCircle size={18} color="#4CAF50" />;
        if (status === 'active') return <div className="pulse-dot" />;
        return <Circle size={18} color="#666" />;
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 3000,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }}>
            {/* Área transparente para cerrar */}
            <div style={{flex: 1}} onClick={onClose} />

            <div className="glass-card" style={{ 
                margin: 0, borderRadius: '24px 24px 0 0', padding: '24px', 
                borderBottom: 'none', maxHeight: '80vh', overflowY: 'auto',
                animation: 'slideUp 0.3s ease-out', background: '#1a1a1a', border: '1px solid #333'
            }}>
                {/* Header */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <Map size={24} color="#A020F0" />
                        <h2 style={{margin: 0, fontSize: '20px'}}>Roadmap</h2>
                    </div>
                    <button onClick={onClose} style={{background:'none', border:'none', color:'#fff', cursor:'pointer'}}><X /></button>
                </div>

                {/* Wallet Section */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)', 
                    borderRadius: '16px', padding: '16px', marginBottom: '24px',
                    border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center'
                }}>
                    <Wallet size={32} color="#0088CC" style={{marginBottom: '10px'}}/>
                    <h3 style={{margin: '0 0 10px 0', fontSize: '16px'}}>TON Wallet</h3>
                    
                    {!walletAddress ? (
                        <button onClick={onConnect} className="btn-neon" style={{width: '100%', background: '#0088CC', color: 'white'}}>
                            Connect Wallet
                        </button>
                    ) : (
                        <div style={{
                            background: 'rgba(0, 136, 204, 0.2)', color: '#0088CC', 
                            padding: '10px', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace'
                        }}>
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </div>
                    )}
                </div>

                {/* Timeline */}
                <div style={{position: 'relative', paddingLeft: '10px'}}>
                    {/* Línea vertical conectora */}
                    <div style={{
                        position: 'absolute', left: '19px', top: '10px', bottom: '30px', 
                        width: '2px', background: '#333'
                    }} />

                    {ROADMAP_STEPS.map((step, idx) => (
                        <div key={idx} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '20px', position: 'relative'
                        }}>
                            {/* Icono de estado */}
                            <div style={{
                                background: '#1a1a1a', zIndex: 2, padding: '2px 0' // Fondo para tapar la línea
                            }}>
                                {renderStatusIcon(step.status)}
                            </div>
                            
                            {/* Texto */}
                            <div style={{opacity: step.status === 'upcoming' ? 0.5 : 1}}>
                                <div style={{fontSize: '12px', color: '#00F2FE', marginBottom: '2px'}}>{step.phase}</div>
                                <div style={{fontWeight: 'bold', fontSize: '15px'}}>{step.title}</div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
            
            {/* Estilos inline para la animación del punto activo */}
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .pulse-dot {
                    width: 14px; height: 14px; background: #00F2FE; border-radius: 50%;
                    box-shadow: 0 0 0 0 rgba(0, 242, 254, 0.7);
                    animation: pulse-cyan 2s infinite;
                }
                @keyframes pulse-cyan {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 242, 254, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 242, 254, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 242, 254, 0); }
                }
            `}</style>
        </div>
    );
};