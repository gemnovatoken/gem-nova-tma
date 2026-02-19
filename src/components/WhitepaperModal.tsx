import React from 'react';
import { X, BookOpen, Users, Zap, TrendingUp, Target, ShieldCheck, ArrowRight, Wallet, Ticket, CircleDollarSign } from 'lucide-react';

interface WhitepaperModalProps {
    onClose: () => void;
    onClaim: () => void;
    canClaim: boolean;
    isClaiming: boolean;
}

export const WhitepaperModal: React.FC<WhitepaperModalProps> = ({ onClose, onClaim, canClaim, isClaiming }) => {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
            <div className="glass-card" style={{ 
                width: '100%', maxWidth: '400px', maxHeight: '85vh', overflowY: 'auto', 
                background: '#0d0d12', border: '1px solid #E040FB', borderRadius: '20px', 
                position: 'relative', padding: '0', display: 'flex', flexDirection: 'column'
            }}>
                
                {/* ENCABEZADO FIJO */}
                <div style={{ position: 'sticky', top: 0, background: 'rgba(13, 13, 18, 0.95)', backdropFilter: 'blur(10px)', padding: '20px', borderBottom: '1px solid rgba(224, 64, 251, 0.2)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen color="#E040FB" size={24} />
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '900', letterSpacing: '1px' }}>THE GNOVA MANIFESTO</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* CONTENIDO DEL WHITEPAPER */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* 1. LA VISIÓN */}
                    <div style={{ background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)', padding: '15px', borderRadius: '12px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00F2FE', fontSize: '14px', marginTop: 0, marginBottom: '10px' }}>
                            <Users size={16} /> Community First, Always
                        </h3>
                        <p style={{ color: '#ddd', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                            Gnova belongs to the community, and the community makes Gnova. Instead of paying millions to traditional ad agencies, <strong>we pay YOU</strong>. Our ecosystem is built to reward our users with real yield for expanding the network and participating in diverse daily activities. You are our main partner.
                        </p>
                    </div>

                    {/* 2. EL JUEGO Y LA CONVERSIÓN */}
                    <div style={{ background: 'rgba(224, 64, 251, 0.05)', border: '1px solid rgba(224, 64, 251, 0.2)', padding: '15px', borderRadius: '12px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E040FB', fontSize: '14px', marginTop: 0, marginBottom: '10px' }}>
                            <Zap size={16} /> The Game: Tap, Upgrade, Conquer
                        </h3>
                        <p style={{ color: '#ddd', fontSize: '12px', lineHeight: '1.6', margin: 0, marginBottom: '10px' }}>
                            The core of Gnova is simple but highly strategic: tap to mine, gather points, and upgrade your gear. There are <strong>8 Power Levels</strong> to conquer.
                        </p>
                        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #E040FB' }}>
                            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>⚡ The Golden Rule:</span>
                            <span style={{ color: '#aaa', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                                Your level dictates your future. The higher your level at the snapshot, the <strong>better your conversion rate</strong> from in-game Points to the official Gnova Token during the Airdrop. Upgrade early, upgrade often!
                            </span>
                        </div>
                    </div>

                    {/* 3. ECONOMÍA REAL (TON) */}
                    <div style={{ background: 'rgba(76, 175, 80, 0.05)', border: '1px solid rgba(76, 175, 80, 0.2)', padding: '15px', borderRadius: '12px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4CAF50', fontSize: '14px', marginTop: 0, marginBottom: '10px' }}>
                            <TrendingUp size={16} /> The TON Economy: Real Passive Income
                        </h3>
                        <p style={{ color: '#ddd', fontSize: '12px', lineHeight: '1.6', margin: 0, marginBottom: '10px' }}>
                            Your network is your net worth. As a Gnova Agent, you earn automatic TON commissions from your squad's activity:
                        </p>
                        <ul style={{ color: '#ddd', fontSize: '12px', margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li><strong>Base Agent:</strong> Earn a solid <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>1%</span> commission on everything your referrals spend.</li>
                            <li>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <ShieldCheck size={14} color="#FFD700" /> 
                                    <strong style={{ color: '#FFD700' }}>Super Partner (Level 8):</strong>
                                </div>
                                Reach the max level and your commission gets a massive boost to <span style={{ color: '#FFD700', fontWeight: 'bold' }}>2.5%</span> for life!
                            </li>
                        </ul>
                    </div>

                    {/* 4. STAKING */}
                    <div style={{ background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)', padding: '15px', borderRadius: '12px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00F2FE', fontSize: '14px', marginTop: 0, marginBottom: '10px' }}>
                            <Wallet size={16} /> Staking: Maximize Your Yield
                        </h3>
                        <p style={{ color: '#ddd', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                            Why let your points sit idle when they could be multiplying? Gnova features a dynamic Staking system designed to compound your wealth. Lock your points to earn anywhere from <strong style={{ color: '#00F2FE' }}>5% up to a massive 60% APY</strong> (Annual Percentage Yield). Your interest is fully rewarded to your balance the moment your staking period ends.
                        </p>
                    </div>

                    {/* 5. MISSION 1 TON */}
                    <div style={{ background: 'rgba(255, 215, 0, 0.05)', border: '1px solid rgba(255, 215, 0, 0.2)', padding: '15px', borderRadius: '12px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFD700', fontSize: '14px', marginTop: 0, marginBottom: '10px' }}>
                            <CircleDollarSign size={16} /> Mission 1 TON: The Golden Vouchers
                        </h3>
                        <p style={{ color: '#ddd', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                            Every single action you take in Gnova counts toward your ultimate bounty. By completing diverse in-game activities, you accumulate special mission points to claim <strong>Golden Vouchers</strong>. Collect exactly <strong style={{ color: '#FFD700' }}>20 Golden Vouchers</strong>, and you instantly redeem them for <strong style={{ color: '#FFD700' }}>1 real TON</strong>. It’s a direct pipeline from your daily grind to your wallet.
                        </p>
                    </div>

                    {/* 6. LUCKY TICKETS */}
                    <div style={{ background: 'rgba(224, 64, 251, 0.05)', border: '1px solid rgba(224, 64, 251, 0.2)', padding: '15px', borderRadius: '12px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E040FB', fontSize: '14px', marginTop: 0, marginBottom: '10px' }}>
                            <Ticket size={16} /> Lucky Tickets & Recurring Raffles
                        </h3>
                        <p style={{ color: '#ddd', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                            We believe in constant, thrilling rewards. You can earn <strong style={{ color: '#E040FB' }}>Lucky Tickets</strong> by actively interacting with the game, watching reward videos, referring new users, and completing other special activities. Hold onto them! These tickets are your entry pass into our recurring and weekly high-stakes raffles, where we give away <strong>real TON</strong>. The more active you are, the luckier you get.
                        </p>
                    </div>

                    {/* 7. EL LANZAMIENTO */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(255, 81, 47, 0.1) 0%, rgba(240, 152, 25, 0.1) 100%)', border: '1px solid rgba(240, 152, 25, 0.3)', padding: '15px', borderRadius: '12px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F09819', fontSize: '14px', marginTop: 0, marginBottom: '10px' }}>
                            <Target size={16} /> The Launch Protocol
                        </h3>
                        <p style={{ color: '#ddd', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                            We don't rely on arbitrary calendar dates; we rely on collective power. The Token Generation Event (TGE) and the Airdrop will trigger the exact moment our <strong style={{ color: '#F09819' }}>Community Goal bar hits 100%</strong>. Want the token to launch faster? Invite, play, stake, and push that bar to the limit!
                        </p>
                    </div>

                </div>

                {/* FOOTER Y BOTÓN DE CLAIM */}
                <div style={{ position: 'sticky', bottom: 0, background: 'rgba(13, 13, 18, 0.95)', backdropFilter: 'blur(10px)', padding: '20px', borderTop: '1px solid rgba(224, 64, 251, 0.2)', zIndex: 10 }}>
                    {canClaim ? (
                        <button 
                            onClick={onClaim}
                            disabled={isClaiming}
                            className="btn-neon" 
                            style={{ 
                                width: '100%', padding: '15px', borderRadius: '12px', background: '#E040FB', 
                                border: 'none', color: '#fff', fontSize: '14px', fontWeight: 'bold',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                boxShadow: '0 0 15px rgba(224, 64, 251, 0.4)', cursor: isClaiming ? 'not-allowed' : 'pointer',
                                opacity: isClaiming ? 0.7 : 1
                            }}
                        >
                            {isClaiming ? 'VERIFYING...' : 'I UNDERSTAND (+2,500 PTS)'} <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button 
                            onClick={onClose}
                            style={{ 
                                width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(76, 175, 80, 0.1)', 
                                border: '1px solid #4CAF50', color: '#4CAF50', fontSize: '14px', fontWeight: 'bold',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer'
                            }}
                        >
                            KNOWLEDGE SECURED ✓
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};