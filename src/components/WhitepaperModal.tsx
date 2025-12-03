import React, { useState } from 'react';
import { X, ChevronRight, Globe, ShieldCheck, Rocket, Coins } from 'lucide-react'; // 🛡️ Eliminado BookOpen

interface WhitepaperModalProps {
    onClose: () => void;
    onClaim: () => void;
    canClaim: boolean;
    isClaiming: boolean;
}

export const WhitepaperModal: React.FC<WhitepaperModalProps> = ({ onClose, onClaim, canClaim, isClaiming }) => {
    const [page, setPage] = useState(0);

    const slides = [
        {
            icon: <Globe size={60} color="#00F2FE" />,
            title: "1. The Vision",
            text: "Gem Nova isn't just a game. It's a Community-Driven Ecosystem built on TON. We don't pay marketing agencies; we pay YOU. Our goal is to create a sustainable, deflationary token owned by the people."
        },
        {
            icon: <ShieldCheck size={60} color="#4CAF50" />,
            title: "2. Hard Money",
            text: "Unlike other clickers with infinite inflation, Gem Nova has strict supply limits. Energy is scarce. Mining Rigs are hard to upgrade. This creates real value for your points when the TGE (Token Generation Event) happens."
        },
        {
            icon: <Coins size={60} color="#FFD700" />,
            title: "3. The 1% Economy",
            text: "We share revenue directly. Every user earns 1% commission in REAL TON from their referrals' purchases. Level 8 'Nova Gods' unlock the Super Partner status (2.5%). This ensures the project has cashflow while rewarding leaders."
        },
        {
            icon: <Rocket size={60} color="#E040FB" />,
            title: "4. Roadmap & Launch",
            text: "Phase 1: Mining & Squad Building (Now). \nPhase 2: Nova Bank & Marketplace. \nPhase 3: Listing on Ston.fi & Airdrop. \n\nThe Launch Progress bar is real. When it hits 100%, we launch."
        }
    ];

    const isLastPage = page === slides.length - 1;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 6000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="glass-card" style={{ 
                width: '100%', maxWidth: '400px', padding: '30px 20px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                border: '1px solid #00F2FE', position: 'relative'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#fff' }}><X /></button>

                {/* Contenido Dinámico */}
                <div style={{ marginBottom: '20px', animation: 'fadeIn 0.5s' }}>
                    <div style={{ marginBottom: '20px', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.2))' }}>
                        {slides[page].icon}
                    </div>
                    <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '15px' }}>{slides[page].title}</h2>
                    <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                        {slides[page].text}
                    </p>
                </div>

                {/* Indicadores de Página */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '30px' }}>
                    {slides.map((_, i) => (
                        <div key={i} style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: i === page ? '#00F2FE' : '#333',
                            transition: 'background 0.3s'
                        }} />
                    ))}
                </div>

                {/* Botón de Acción */}
                <button 
                    className="btn-neon"
                    onClick={() => {
                        if (isLastPage) {
                            if (canClaim) onClaim();
                            else onClose();
                        } else {
                            setPage(p => p + 1);
                        }
                    }}
                    disabled={isLastPage && isClaiming}
                    style={{ width: '100%', fontSize: '16px', padding: '12px', display:'flex', justifyContent:'center', alignItems:'center', gap:'10px' }}
                >
                    {isLastPage ? (
                        canClaim ? (isClaiming ? "CLAIMING..." : "✅ FINISH & CLAIM 2.5K") : "CLOSE (ALREADY CLAIMED)"
                    ) : (
                        <>NEXT <ChevronRight size={16}/></>
                    )}
                </button>

            </div>
        </div>
    );
};