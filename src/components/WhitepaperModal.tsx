import React, { useState } from 'react';
import { X, ChevronRight, BookOpen } from 'lucide-react';

interface WhitepaperModalProps {
    onClose: () => void;
    onClaim: () => void;
    canClaim: boolean;
    isClaiming: boolean;
}

export const WhitepaperModal: React.FC<WhitepaperModalProps> = ({ onClose, onClaim, canClaim, isClaiming }) => {
    const [page, setPage] = useState(0);

    const pages = [
        {
            title: "1. The Hard Money Vision",
            icon: "💎",
            content: "We are tired of games printing trillions of worthless tokens. Gem Nova is built on SCARCITY. Points are hard to get. Energy is limited. This is a Deflationary Engine designed to protect value, not dilute it. We don't sell air; we mine digital gold."
        },
        {
            title: "2. The 1% Partner Revolution",
            icon: "🤝",
            content: "Marketing agencies are expensive and useless. We fired them to pay YOU. Every user is a Partner. Invite a friend, and earn 1% of their TON purchases instantly. Real cash rewards for growing the tribe. No limits. The first Community-Driven Economy."
        },
        {
            title: "3. Reverse Tokenomics",
            icon: "📉",
            content: "Most projects dump on retail. We flip the script with a 'Merit-Based Swap'. Active players (Level 8) unlock the prime 80:1 rate, while passive users get 500:1. 70% of revenue goes back into Liquidity and Buybacks. We burn points daily via Raids & Arcade."
        },
        {
            title: "4. The Ecosystem Future",
            icon: "🪐",
            content: "Phase 1 is just the spark. Coming next: 'Nova Bank' (High Yield Staking), 'Operation Eclipse' (Raid Events with TON prizes), and the P2P Marketplace. Our goal: Listing on Ston.fi with a liquidity pool funded by the community, owned by the community."
        }
    ];

    const isLastPage = page === pages.length - 1;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 3000, padding: '20px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center'
        }}>
            <div className="glass-card" style={{ position: 'relative', height: 'auto', minHeight: '450px', display: 'flex', flexDirection: 'column', border: '1px solid #00F2FE' }}>
                
                {/* Header */}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                        <BookOpen color="#00F2FE" />
                        <span style={{fontWeight:'bold', color:'#fff'}}>WHITEPAPER v2.0</span>
                    </div>
                    <button onClick={onClose} style={{background:'none', border:'none', color:'#fff', cursor:'pointer'}}><X /></button>
                </div>

                {/* Contenido */}
                <div style={{ flex: 1, textAlign: 'center', padding: '10px' }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>{pages[page].icon}</div>
                    <h2 style={{ color: '#00F2FE', marginBottom: '15px', fontSize:'22px' }}>{pages[page].title}</h2>
                    <p style={{ lineHeight: '1.6', color: '#ddd', fontSize: '14px' }}>
                        {pages[page].content}
                    </p>
                </div>

                {/* Indicador */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                    {pages.map((_, i) => (
                        <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === page ? '#00F2FE' : '#333', transition:'all 0.3s' }} />
                    ))}
                </div>

                {/* Botón */}
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
                    disabled={isClaiming}
                    style={{ width: '100%', padding: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                    {isLastPage ? (
                        canClaim ? (isClaiming ? 'Claiming...' : '✅ I UNDERSTAND & CLAIM 5,000 PTS') : 'CLOSE'
                    ) : (
                        <>NEXT PAGE <ChevronRight size={18}/></>
                    )}
                </button>

            </div>
        </div>
    );
};