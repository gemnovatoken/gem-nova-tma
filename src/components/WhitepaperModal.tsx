import React from 'react';
import { X, FileText, Zap, Coins, Shield } from 'lucide-react'; // CheckCircle eliminado para corregir el error

// Definimos la interfaz para las props (Tipado estricto)
interface WhitepaperModalProps {
    onClose: () => void;
    onClaim: () => void; // Asegúrate que esto sea void
    canClaim: boolean;
    isClaiming: boolean;
}

export const WhitepaperModal: React.FC<WhitepaperModalProps> = ({ onClose }) => {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 3000,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }}>
            {/* Área para cerrar al tocar fuera */}
            <div style={{flex: 1}} onClick={onClose} />

            <div className="glass-card" style={{ 
                margin: 0, borderRadius: '24px 24px 0 0', padding: '24px', 
                borderBottom: 'none', maxHeight: '85vh', overflowY: 'auto',
                animation: 'slideUp 0.3s ease-out', background: '#121212', border: '1px solid #333'
            }}>
                {/* Header */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'sticky', top: 0, background: '#121212', paddingBottom: '10px', zIndex: 10, borderBottom: '1px solid #333'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <FileText size={24} color="#fff" />
                        <h2 style={{margin: 0, fontSize: '20px', color: '#fff'}}>Whitepaper v1.0</h2>
                    </div>
                    <button onClick={onClose} style={{background:'none', border:'none', color:'#fff', cursor:'pointer'}}><X /></button>
                </div>

                {/* Contenido del Whitepaper */}
                <div style={{ color: '#ccc', lineHeight: '1.6', fontSize: '14px' }}>
                    
                    {/* Intro */}
                    <div style={{ marginBottom: '25px' }}>
                        <h3 style={{ color: '#00F2FE', fontSize: '16px', marginBottom: '10px' }}>🌌 Introduction</h3>
                        <p>
                            Gem Nova is a next-generation tap-to-earn game built on the TON blockchain. 
                            Players mine Gems by tapping, upgrade their mining rigs, and complete missions to earn real rewards.
                        </p>
                    </div>

                    {/* Mechanics Section */}
                    <div style={{ marginBottom: '25px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                        <h3 style={{ color: '#FFD700', fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={16} /> Core Mechanics
                        </h3>
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            <li style={{ marginBottom: '8px' }}><strong>Tap & Earn:</strong> Convert energy into Gems directly.</li>
                            <li style={{ marginBottom: '8px' }}><strong>Energy System:</strong> Energy regenerates over time based on your Recharge Speed level.</li>
                            <li><strong>Leagues:</strong> Climb from Bronze to Diamond to unlock higher earning multipliers.</li>
                        </ul>
                    </div>

                    {/* Tokenomics Section */}
                    <div style={{ marginBottom: '25px' }}>
                        <h3 style={{ color: '#E040FB', fontSize: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Coins size={16} /> Tokenomics ($NOVA)
                        </h3>
                        <p style={{ marginBottom: '10px' }}>
                            The $NOVA token is the utility token of the ecosystem. It will be launched on major DEXs in Q4 2024.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                            <div style={{ background: '#222', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #333' }}>
                                <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>55%</div>
                                <div style={{ fontSize: '10px', color: '#888' }}>Community Mining</div>
                            </div>
                            <div style={{ background: '#222', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #333' }}>
                                <div style={{ color: '#2196F3', fontWeight: 'bold' }}>15%</div>
                                <div style={{ fontSize: '10px', color: '#888' }}>Liquidity & Listings</div>
                            </div>
                            <div style={{ background: '#222', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #333' }}>
                                <div style={{ color: '#FF9800', fontWeight: 'bold' }}>20%</div>
                                <div style={{ fontSize: '10px', color: '#888' }}>Marketing & Airdrops</div>
                            </div>
                            <div style={{ background: '#222', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #333' }}>
                                <div style={{ color: '#9C27B0', fontWeight: 'bold' }}>10%</div>
                                <div style={{ fontSize: '10px', color: '#888' }}>Team (Vested)</div>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '15px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '12px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                        <Shield color="#4CAF50" size={24} />
                        <div style={{ fontSize: '12px' }}>
                            <strong style={{ color: '#4CAF50', display: 'block', marginBottom: '2px' }}>Secure & Verified</strong>
                            Smart contracts audited by leading security firms. Fair launch guaranteed.
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '10px', color: '#555' }}>
                        © 2024 Gem Nova Foundation. All rights reserved.
                    </div>

                </div>
            </div>
            
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>
        </div>
    );
};