import React, { useState } from 'react';
import { X, BookOpen, Users, Zap, TrendingUp, Target, ShieldCheck, Wallet, Ticket, CircleDollarSign, ChevronRight, ChevronLeft } from 'lucide-react';
interface WhitepaperModalProps {
    onClose: () => void;
    onClaim: () => void;
    canClaim: boolean;
    isClaiming: boolean;
}

export const WhitepaperModal: React.FC<WhitepaperModalProps> = ({ onClose, onClaim, canClaim, isClaiming }) => {
    // Estado para controlar en qué página del carrusel estamos
    const [currentPage, setCurrentPage] = useState(0);

    // Contenido dividido en "Diapositivas" (Slides) para el carrusel
    const slides = [
        {
            title: "Community First, Always",
            icon: <Users size={24} />,
            color: "#00F2FE",
            content: (
                <p style={{ color: '#ddd', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                    Gnova belongs to the community, and the community makes Gnova. Instead of paying millions to traditional ad agencies, <strong style={{color: '#fff'}}>we pay YOU</strong>. Our ecosystem is built to reward our users with real yield for expanding the network and participating in diverse daily activities. You are our main partner.
                </p>
            )
        },
        {
            title: "The Game: Tap, Upgrade, Conquer",
            icon: <Zap size={24} />,
            color: "#E040FB",
            content: (
                <>
                    <p style={{ color: '#ddd', fontSize: '15px', lineHeight: '1.7', margin: 0, marginBottom: '15px' }}>
                        The core of Gnova is simple but highly strategic: tap to mine, gather points, and upgrade your gear. There are <strong style={{color: '#E040FB'}}>8 Power Levels</strong> to conquer.
                    </p>
                    <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #E040FB' }}>
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>⚡ The Golden Rule:</span>
                        <span style={{ color: '#aaa', fontSize: '14px', display: 'block', marginTop: '6px', lineHeight: '1.5' }}>
                            Your level dictates your future. The higher your level at the snapshot, the <strong style={{color: '#fff'}}>better your conversion rate</strong> from in-game Points to the official Gnova Token during the Airdrop. Upgrade early, upgrade often!
                        </span>
                    </div>
                </>
            )
        },
        {
            title: "The TON Economy: Passive Income",
            icon: <TrendingUp size={24} />,
            color: "#4CAF50",
            content: (
                <>
                    <p style={{ color: '#ddd', fontSize: '15px', lineHeight: '1.7', margin: 0, marginBottom: '15px' }}>
                        Your network is your net worth. As a Gnova Agent, you earn automatic TON commissions from your squad's activity:
                    </p>
                    <ul style={{ color: '#ddd', fontSize: '14px', margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.6' }}>
                        <li><strong>Base Agent:</strong> Earn a solid <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '16px' }}>1%</span> commission on everything your referrals spend.</li>
                        <li>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <ShieldCheck size={16} color="#FFD700" /> 
                                <strong style={{ color: '#FFD700' }}>Super Partner (Level 8):</strong>
                            </div>
                            Reach the max level and your commission gets a massive boost to <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '16px' }}>2.5%</span> for life!
                        </li>
                    </ul>
                </>
            )
        },
        {
            title: "Staking: Maximize Your Yield",
            icon: <Wallet size={24} />,
            color: "#00F2FE",
            content: (
                <p style={{ color: '#ddd', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                    Why let your points sit idle when they could be multiplying? Gnova features a dynamic Staking system designed to compound your wealth. Lock your points to earn anywhere from <strong style={{ color: '#00F2FE', fontSize: '16px' }}>5% up to a massive 60% APY</strong> (Annual Percentage Yield). Your interest is fully rewarded to your balance the moment your staking period ends.
                </p>
            )
        },
        {
            title: "Mission 1 TON: Golden Vouchers",
            icon: <CircleDollarSign size={24} />,
            color: "#FFD700",
            content: (
                <p style={{ color: '#ddd', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                    Every single action you take in Gnova counts toward your ultimate bounty. By completing diverse in-game activities, you accumulate special mission points to claim <strong>Golden Vouchers</strong>. Collect exactly <strong style={{ color: '#FFD700', fontSize: '16px' }}>20 Golden Vouchers</strong>, and you instantly redeem them for <strong style={{ color: '#FFD700', fontSize: '16px' }}>1 real TON</strong>. It’s a direct pipeline from your daily grind to your wallet.
                </p>
            )
        },
        {
            title: "Lucky Tickets & Raffles",
            icon: <Ticket size={24} />,
            color: "#E040FB",
            content: (
                <p style={{ color: '#ddd', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                    We believe in constant, thrilling rewards. You can earn <strong style={{ color: '#E040FB', fontSize: '16px' }}>Lucky Tickets</strong> by actively interacting with the game, watching reward videos, referring new users, and completing other special activities. Hold onto them! These tickets are your entry pass into our recurring and weekly high-stakes raffles, where we give away <strong>real TON</strong>. The more active you are, the luckier you get.
                </p>
            )
        },
        {
            title: "The Launch Protocol",
            icon: <Target size={24} />,
            color: "#F09819",
            content: (
                <div style={{ background: 'linear-gradient(135deg, rgba(255, 81, 47, 0.1) 0%, rgba(240, 152, 25, 0.1) 100%)', border: '1px solid rgba(240, 152, 25, 0.3)', padding: '20px', borderRadius: '12px' }}>
                    <p style={{ color: '#ddd', fontSize: '15px', lineHeight: '1.7', margin: 0 }}>
                        We don't rely on arbitrary calendar dates; we rely on collective power. The Token Generation Event (TGE) and the Airdrop will trigger the exact moment our <strong style={{ color: '#F09819', fontSize: '16px' }}>Community Goal bar hits 100%</strong>. Want the token to launch faster? Invite, play, stake, and push that bar to the limit!
                    </p>
                </div>
            )
        }
    ];

    const isLastPage = currentPage === slides.length - 1;
    const currentSlide = slides[currentPage];

    const handleNext = () => {
        if (!isLastPage) setCurrentPage(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentPage > 0) setCurrentPage(prev => prev - 1);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
            <div className="glass-card" style={{ 
                width: '100%', maxWidth: '400px', height: '80vh', 
                background: '#0d0d12', border: '1px solid #E040FB', borderRadius: '20px', 
                position: 'relative', padding: '0', display: 'flex', flexDirection: 'column'
            }}>
                
                {/* ENCABEZADO FIJO */}
                <div style={{ background: 'rgba(13, 13, 18, 0.95)', borderBottom: '1px solid rgba(224, 64, 251, 0.2)', padding: '20px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen color="#E040FB" size={20} />
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '900', letterSpacing: '1px' }}>THE GNOVA MANIFESTO</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* CONTENIDO DESLIZABLE (SLIDE ACTUAL) */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ background: `rgba(${parseInt(currentSlide.color.slice(1,3), 16)}, ${parseInt(currentSlide.color.slice(3,5), 16)}, ${parseInt(currentSlide.color.slice(5,7), 16)}, 0.05)`, border: `1px solid ${currentSlide.color}40`, padding: '25px', borderRadius: '16px', boxShadow: `0 0 20px ${currentSlide.color}10` }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: currentSlide.color, fontSize: '18px', marginTop: 0, marginBottom: '20px', fontWeight: 'bold' }}>
                            {currentSlide.icon}
                            {currentSlide.title}
                        </h3>
                        {currentSlide.content}
                    </div>
                </div>

                {/* FOOTER CON CONTROLES DE NAVEGACIÓN */}
                <div style={{ background: 'rgba(13, 13, 18, 0.95)', padding: '20px', borderTop: '1px solid rgba(224, 64, 251, 0.2)', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', flexShrink: 0 }}>
                    
                    {/* PUNTITOS DE PROGRESO */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                        {slides.map((_, idx) => (
                            <div key={idx} style={{ 
                                width: currentPage === idx ? '24px' : '8px', 
                                height: '8px', 
                                borderRadius: '4px', 
                                background: currentPage === idx ? currentSlide.color : '#333',
                                transition: 'all 0.3s ease'
                            }} />
                        ))}
                    </div>

                    {/* BOTONES */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                        <button 
                            onClick={handlePrev}
                            disabled={currentPage === 0}
                            style={{ 
                                padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid #333', color: currentPage === 0 ? '#444' : '#fff', 
                                display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: currentPage === 0 ? 'default' : 'pointer'
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>

                        {!isLastPage ? (
                            <button 
                                onClick={handleNext}
                                className="btn-neon" 
                                style={{ 
                                    flex: 1, padding: '15px', borderRadius: '12px', background: currentSlide.color, 
                                    border: 'none', color: '#000', fontSize: '16px', fontWeight: 'bold',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                    boxShadow: `0 0 15px ${currentSlide.color}60`, cursor: 'pointer'
                                }}
                            >
                                NEXT <ChevronRight size={20} />
                            </button>
                        ) : (
                            canClaim ? (
                                <button 
                                    onClick={onClaim}
                                    disabled={isClaiming}
                                    className="btn-neon" 
                                    style={{ 
                                        flex: 1, padding: '15px', borderRadius: '12px', background: '#E040FB', 
                                        border: 'none', color: '#fff', fontSize: '14px', fontWeight: 'bold',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                        boxShadow: '0 0 15px rgba(224, 64, 251, 0.4)', cursor: isClaiming ? 'not-allowed' : 'pointer',
                                        opacity: isClaiming ? 0.7 : 1
                                    }}
                                >
                                    {isClaiming ? 'VERIFYING...' : 'I UNDERSTAND (+2,500 PTS)'}
                                </button>
                            ) : (
                                <button 
                                    onClick={onClose}
                                    style={{ 
                                        flex: 1, padding: '15px', borderRadius: '12px', background: 'rgba(76, 175, 80, 0.1)', 
                                        border: '1px solid #4CAF50', color: '#4CAF50', fontSize: '14px', fontWeight: 'bold',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer'
                                    }}
                                >
                                    KNOWLEDGE SECURED ✓
                                </button>
                            )
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};