import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Clock, Diamond, Lock, Unlock, Zap, ShieldAlert, Star, Flame, Ticket, Trophy, ArrowRightCircle, CheckCircle2, Box } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import * as animejs from 'animejs';

interface AnimeEngine {
    (params: Record<string, unknown>): void;
    stagger: (value: number | string | number[], options?: Record<string, unknown>) => unknown;
}

const getAnime = (): AnimeEngine | null => {
    try {
        if (typeof animejs === 'function') return animejs as unknown as AnimeEngine;
        const animeDefault = (animejs as unknown as { default: unknown }).default;
        if (typeof animeDefault === 'function') return animeDefault as AnimeEngine;
        return null;
    } catch {
        return null;
    }
};

const anime = getAnime();

interface PuzzleModalProps {
    onClose: () => void;
    piecesCollected: number;
    piecesBought: number; 
    premiumPiecesBought: number; 
    currentReward: number;
    isLocked: boolean;
    timeLeft: string;
    puzzleFragments?: number; // 🔥 NUEVO: Recibimos los fragmentos
    onPuzzleUpdate: () => void;
}

interface ModernTelegram {
    WebApp: {
        openInvoice: (url: string, callback: (status: string) => void) => void;
    };
}

const triggerGODConfetti = () => {
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 }, colors: ['#FFD700', '#00F2FE', '#FFFFFF', '#B100FF'] });
};

const getTotalPiecesForReward = (reward: number): number => {
    if (reward <= 0.15) return 6;
    if (reward <= 0.20) return 9;
    if (reward <= 0.30) return 12;
    if (reward <= 0.50) return 18;
    if (reward <= 1.0) return 24;
    return 30; 
};

const getMaxBuysForTotal = (totalPieces: number): number => {
    return Math.floor(3 + (totalPieces - 6) / 3);
};

const getPremiumBuysLimit = (totalPieces: number): number => {
    if (totalPieces === 18) return 5;
    if (totalPieces === 24) return 8;
    if (totalPieces >= 30) return 15;
    return 0; 
};

export const PuzzleModal: React.FC<PuzzleModalProps> = ({ 
    onClose, 
    piecesCollected, 
    piecesBought, 
    premiumPiecesBought,
    currentReward, 
    isLocked, 
    timeLeft,
    puzzleFragments = 0, // Por defecto 0 si no llega el dato
    onPuzzleUpdate 
}) => {
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    
    const totalPieces = getTotalPiecesForReward(currentReward);
    
    const isPuzzleComplete = piecesCollected >= totalPieces;
    
    const maxBuyable = getMaxBuysForTotal(totalPieces);
    const hasReachedStandardLimit = piecesBought >= maxBuyable;
    
    const maxPremiumBuyable = getPremiumBuysLimit(totalPieces);
    const hasReachedPremiumLimit = premiumPiecesBought >= maxPremiumBuyable;
    
    const isCompletelyLocked = hasReachedStandardLimit && (maxPremiumBuyable === 0 || hasReachedPremiumLimit);

    const PIECE_COST_STARS = 9; 
    const PREMIUM_PIECE_COST = 25;
    const UNFREEZE_COST_STARS = 9;
    const SKIP_WAIT_COST_STARS = 25; 
    const FRAGMENTS_NEEDED = 5; // Costo del canje en la bóveda

    const upcomingRewards = [0.10, 0.15, 0.20, 0.30, 0.50, 1.0, 5.0, 25.0];

    useEffect(() => {
        if (!anime) return;

        anime({ targets: '.puzzle-overlay-anim', opacity: [0, 1], easing: 'easeInOutQuad', duration: 400 });
        anime({ targets: '.puzzle-piece-anim', translateY: [-50, 0], opacity: [0, 1], delay: anime.stagger(50), easing: 'easeOutElastic(1, .6)', duration: 1000 });
        
        if (isPuzzleComplete) {
            triggerGODConfetti();
        }
    }, [isPuzzleComplete]);

    const handleBuyPiece = async (isPremium: boolean) => {
        if (!user) return;
        
        const cost = isPremium ? PREMIUM_PIECE_COST : PIECE_COST_STARS;
        const confirmMsg = isPremium 
            ? `🔥 PREMIUM BUY FOR ${cost} STARS?\n\nYou are buying an extra premium piece (${premiumPiecesBought}/${maxPremiumBuyable}).`
            : `⭐ BUY MISSING PIECE FOR ${cost} STARS?\n\nLimit: ${piecesBought}/${maxBuyable} pieces.`;

        const confirmBuy = window.confirm(confirmMsg);
        if(!confirmBuy) return;

        setIsProcessing(true);
        try {
            const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke('create-telegram-invoice', {
                body: { 
                    packageId: `PIECE_${isPremium ? 'PREMIUM' : 'STD'}_${currentReward}`, 
                    packageName: `${isPremium ? 'Premium ' : ''}Piece (${piecesCollected + 1}/${totalPieces})`, 
                    starsCost: cost, 
                    userId: user.id 
                }
            });

            if (invoiceError) throw invoiceError;
            if (!invoiceData || !invoiceData.success) throw new Error(invoiceData?.error || "Failed to generate invoice.");

            const tg = window.Telegram as unknown as ModernTelegram;

            if (tg && tg.WebApp && typeof tg.WebApp.openInvoice === 'function') {
                tg.WebApp.openInvoice(invoiceData.invoiceLink, async (status: string) => {
                    if (status === 'paid') {
                        const { data: purchaseData, error: purchaseError } = await supabase.rpc('process_piece_purchase', {
                            p_user_id: user.id,
                            p_cost_xtr: cost 
                        });

                        if (purchaseError) alert("⚠️ Error Syncing Database. Contact Support.");
                        else if (purchaseData && purchaseData.success) {
                            if (anime) {
                                anime({
                                    targets: `.piece-index-${piecesCollected}`,
                                    scale: [1, 1.3, 1], rotate: '1turn',
                                    background: isPremium ? 'linear-gradient(135deg, #B100FF 0%, #7B2CBF 100%)' : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                    duration: 800, easing: 'easeInOutSine'
                                });
                            }
                            onPuzzleUpdate(); 
                        } else alert(`❌ Failed: ${purchaseData?.message}`);
                    }
                    setIsProcessing(false);
                });
            } else {
                alert("❌ You must open this app inside Telegram to pay with Stars.");
                setIsProcessing(false);
            }
        } catch (err: unknown) {
            let errorMessage = "Unknown error occurred";
            if (err instanceof Error) errorMessage = err.message;
            else if (err && typeof err === 'object' && 'message' in err) errorMessage = String((err as Record<string, unknown>).message);
            alert(`❌ Error: ${errorMessage}`);
            setIsProcessing(false);
        }
    };

    const handleUnfreezePuzzle = async () => {
        if (!user) return;
        const confirmBuy = window.confirm(`🧊 RESTART LEVEL FOR ${UNFREEZE_COST_STARS} STARS?\n\nWARNING: Your current pieces will be wiped to 0, but you will keep your current target of ${currentReward} TON and get 48 hours more.`);
        if(!confirmBuy) return;

        setIsProcessing(true);
        try {
            const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke('create-telegram-invoice', {
                body: { packageId: `UNFREEZE_PUZZLE`, packageName: `Unfreeze ${currentReward} TON Level`, starsCost: UNFREEZE_COST_STARS, userId: user.id }
            });

            if (invoiceError) throw invoiceError;
            if (!invoiceData || !invoiceData.success) throw new Error(invoiceData?.error || "Failed to generate invoice.");

            const tg = window.Telegram as unknown as ModernTelegram;
            if (tg && tg.WebApp && typeof tg.WebApp.openInvoice === 'function') {
                tg.WebApp.openInvoice(invoiceData.invoiceLink, async (status: string) => {
                    if (status === 'paid') {
                        const { error: resetError } = await supabase.rpc('unfreeze_puzzle_level', { p_user_id: user.id });
                        if (resetError) alert("⚠️ Error Syncing Database. Contact Support.");
                        else {
                            alert("✅ LEVEL RESTARTED!\n\nYou have 48 hours to complete it. Good luck!");
                            onPuzzleUpdate();
                        }
                    }
                    setIsProcessing(false);
                });
            }
        } catch (err: unknown) {
            let errorMessage = "Unknown error occurred";
            if (err instanceof Error) errorMessage = err.message;
            alert(`❌ Error: ${errorMessage}`);
            setIsProcessing(false);
        }
    };

    const handleRedeemReward = async () => {
        if (!user) return;
        setIsProcessing(true);
        try {
            const { error } = await supabase.rpc('redeem_puzzle_reward', { p_user_id: user.id });
            if (error) throw error;
            
            triggerGODConfetti();
            alert(`🎉 SUCCESS! ${currentReward} TON has been added to your pending balance!`);
            onPuzzleUpdate();
        } catch (err) {
            console.error(err);
            alert("⚠️ Error redeeming reward. Try again.");
        }
        setIsProcessing(false);
    };

    const handleSkipWait = async () => {
        if (!user) return;
        const confirmBuy = window.confirm(`🚀 SKIP WAIT FOR ${SKIP_WAIT_COST_STARS} STARS?\n\nStart the next level immediately!`);
        if(!confirmBuy) return;

        setIsProcessing(true);
        try {
            const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke('create-telegram-invoice', {
                body: { packageId: `SKIP_WAIT`, packageName: `Skip Puzzle Wait`, starsCost: SKIP_WAIT_COST_STARS, userId: user.id }
            });

            if (invoiceError) throw invoiceError;
            if (!invoiceData || !invoiceData.success) throw new Error(invoiceData?.error || "Failed to generate invoice.");

            const tg = window.Telegram as unknown as ModernTelegram;
            if (tg && tg.WebApp && typeof tg.WebApp.openInvoice === 'function') {
                tg.WebApp.openInvoice(invoiceData.invoiceLink, async (status: string) => {
                    if (status === 'paid') {
                        const { error: skipError } = await supabase.rpc('skip_puzzle_wait', { p_user_id: user.id });
                        if (skipError) alert("⚠️ Error Syncing Database.");
                        else {
                            alert("✅ WAIT SKIPPED!\n\nNext level unlocked.");
                            onPuzzleUpdate();
                        }
                    }
                    setIsProcessing(false);
                });
            }
        } catch (err: unknown) {
            let errorMessage = "Unknown error occurred";
            if (err instanceof Error) errorMessage = err.message;
            alert(`❌ Error: ${errorMessage}`);
            setIsProcessing(false);
        }
    };

    // 🔥 NUEVO: Función para Canjear Fragmentos de la Bóveda
    const handleRedeemFragments = async (rewardType: 'VIP' | 'GNT') => {
        if (puzzleFragments < FRAGMENTS_NEEDED) {
            alert(`⚠️ Not enough fragments!\nYou need ${FRAGMENTS_NEEDED} to redeem a prize.`);
            return;
        }

        const confirmCanje = window.confirm(`💎 REDEEM ${FRAGMENTS_NEEDED} FRAGMENTS?\n\nYou will receive: ${rewardType === 'VIP' ? '2 VIP Tickets' : '1 GNT Token'}`);
        if (!confirmCanje) return;

        setIsProcessing(true);
        try {
            // Este RPC lo crearemos en Supabase en el siguiente paso
            const { error } = await supabase.rpc('redeem_puzzle_fragments', { 
                p_user_id: user?.id, 
                p_reward_type: rewardType 
            });

            if (error) throw error;
            alert(`🎉 SUCCESS! You received ${rewardType === 'VIP' ? '2 VIP Tickets' : '1 GNT Token'}!`);
            onPuzzleUpdate(); // Actualiza la UI para descontar los fragmentos
        } catch (err) {
            console.error(err);
            alert("⚠️ Error redeeming fragments.");
        }
        setIsProcessing(false);
    };

    const getGridColumns = () => {
        if (totalPieces <= 9) return 3;
        if (totalPieces <= 16) return 4;
        return 5; 
    };

    return (
        <div className="puzzle-overlay-anim" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 10, 0.95)', zIndex: 9500,
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', overflowY: 'auto', backdropFilter: 'blur(10px)', opacity: anime ? 0 : 1
        }}>
            
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Diamond color="#FFD700" fill="#FFD700" size={20} />
                    <h2 style={{ color: '#FFD700', margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '1px' }}>GNOVA TREE</h2>
                </div>
                <button onClick={onClose} disabled={isProcessing} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            <div style={{ width: '100%', maxWidth: '400px', marginTop: '20px', textAlign: 'center' }}>
                
                {/* 🔥 EL RELOJ CRUEL: Siempre vivo, siempre presionando 🔥 */}
                <div style={{ 
                    background: isLocked ? 'rgba(255,0,85,0.1)' : 'rgba(255, 152, 0, 0.1)', 
                    border: isLocked ? '1px solid #FF0055' : '1px solid #FF9800', 
                    color: isLocked ? '#FF0055' : '#FF9800', 
                    padding: '10px 20px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '10px',
                    fontWeight: '900', fontSize: '18px', marginBottom: '20px', 
                    boxShadow: isLocked ? '0 0 15px rgba(255,0,85,0.3)' : '0 0 15px rgba(255,152,0,0.3)',
                    animation: isLocked ? 'none' : 'pulse-soft 2s infinite'
                }}>
                    {isLocked ? <ShieldAlert size={20} /> : <Clock size={20} />}
                    {isLocked ? 'PUZZLE EXPIRED' : `EXPIRES: ${timeLeft}`}
                </div>

                {isPuzzleComplete && (
                    <div style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> 
                        Target Reached! Waiting for clock...
                    </div>
                )}

                <div style={{ background: 'rgba(20,20,25,0.8)', border: '1px solid #333', borderRadius: '20px', padding: '30px 15px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '150px', height: '150px', background: isPuzzleComplete ? '#4CAF50' : '#FFD700', filter: 'blur(80px)', opacity: 0.1, zIndex: 0 }}></div>
                    
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#aaa', zIndex: 1, position: 'relative' }}>CURRENT TARGET</h3>                    
                    <div style={{ fontSize: '42px', fontWeight: '900', color: '#fff', textShadow: isPuzzleComplete ? '0 0 15px rgba(76,175,80,0.5)' : '0 0 15px rgba(255,215,0,0.5)', zIndex: 1, position: 'relative', marginBottom: '20px' }}>
                        {currentReward.toFixed(2)} <span style={{ fontSize: '20px', color: isPuzzleComplete ? '#4CAF50' : '#FFD700' }}>TON</span>
                    </div>

                    {!isPuzzleComplete ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`, gap: totalPieces > 12 ? '6px' : '10px', maxWidth: '280px', margin: '0 auto', zIndex: 1, position: 'relative' }}>
                                {[...Array(totalPieces)].map((_, i) => {
                                    const isCollected = i < piecesCollected;
                                    const isNextToBuy = i === piecesCollected && !isLocked; 
                                    const iconSize = totalPieces > 18 ? 14 : 20; 

                                    return (
                                        <div key={i} className={`puzzle-piece-anim piece-index-${i}`} style={{
                                            aspectRatio: '1', borderRadius: totalPieces > 18 ? '8px' : '12px', position: 'relative', overflow: 'hidden',
                                            background: isCollected ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 'rgba(255,255,255,0.05)',
                                            border: isCollected ? 'none' : (isNextToBuy ? (isCompletelyLocked ? '2px dashed #FF0055' : (hasReachedStandardLimit ? '2px dashed #B100FF' : '2px dashed #00F2FE')) : '1px dashed #444'),
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column',
                                            boxShadow: isCollected ? '0 5px 15px rgba(255,215,0,0.4)' : (isNextToBuy ? (isCompletelyLocked ? '0 0 15px rgba(255,0,85,0.2)' : (hasReachedStandardLimit ? '0 0 15px rgba(177,0,255,0.3)' : '0 0 15px rgba(0,242,254,0.2)')) : 'inset 0 0 10px rgba(0,0,0,0.5)'),
                                            transform: isCollected ? 'scale(1)' : 'scale(0.95)',
                                            transition: 'all 0.3s ease', opacity: anime ? 0 : 1
                                        }}>
                                            {isCollected ? (
                                                <Diamond size={iconSize} color="#FFF" />
                                            ) : isNextToBuy ? (
                                                !hasReachedStandardLimit ? (
                                                    <button onClick={() => handleBuyPiece(false)} disabled={isProcessing} style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: '#00F2FE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>
                                                        <Star size={iconSize - 4} fill="#00F2FE" style={{marginBottom: '2px'}}/>
                                                        <span style={{fontSize: totalPieces > 18 ? '8px' : '10px', fontWeight: '900', color: '#FFF'}}>{PIECE_COST_STARS}⭐</span>
                                                    </button>
                                                ) : (!hasReachedPremiumLimit && maxPremiumBuyable > 0) ? (
                                                    <button onClick={() => handleBuyPiece(true)} disabled={isProcessing} style={{ width: '100%', height: '100%', background: 'rgba(177,0,255,0.1)', border: 'none', color: '#E0B0FF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>
                                                        <Flame size={iconSize - 4} fill="#B100FF" style={{marginBottom: '2px'}}/>
                                                        <span style={{fontSize: totalPieces > 18 ? '8px' : '10px', fontWeight: '900', color: '#FFF'}}>{PREMIUM_PIECE_COST}⭐</span>
                                                    </button>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#FF0055', opacity: 0.8 }}>
                                                        <Lock size={iconSize - 4} color="#FF0055" style={{marginBottom: '2px'}}/>
                                                        <span style={{fontSize: totalPieces > 18 ? '7px' : '9px', fontWeight: '900', textAlign: 'center', lineHeight: '1'}}>MAX<br/>BOUGHT</span>
                                                    </div>
                                                )
                                            ) : (
                                                <Lock size={iconSize - 2} color="#333" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: '20px', color: '#00F2FE', fontWeight: 'bold', fontSize: '14px', zIndex: 1, position: 'relative' }}>
                                {piecesCollected} / {totalPieces} PIECES COLLECTED
                            </div>
                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ color: hasReachedStandardLimit ? '#FF0055' : '#888', fontSize: '10px', fontWeight: 'bold' }}>
                                    STANDARD ({PIECE_COST_STARS}⭐): {piecesBought} / {maxBuyable}
                                </div>
                                {maxPremiumBuyable > 0 && (
                                    <div style={{ color: hasReachedPremiumLimit ? '#FF0055' : '#B100FF', fontSize: '10px', fontWeight: 'bold' }}>
                                        PREMIUM ({PREMIUM_PIECE_COST}⭐): {premiumPiecesBought} / {maxPremiumBuyable}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', zIndex: 1, position: 'relative' }}>
                            <Trophy size={60} color="#FFD700" style={{ filter: 'drop-shadow(0 0 15px rgba(255,215,0,0.5))' }} />
                            
                            <button onClick={handleRedeemReward} disabled={isProcessing} style={{ width: '100%', padding: '15px', background: 'linear-gradient(90deg, #4CAF50, #2E7D32)', color: '#fff', border: '1px solid #4CAF50', borderRadius: '10px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 5px 15px rgba(76,175,80,0.4)' }}>
                                <Diamond size={18} /> REDEEM {currentReward} TON
                            </button>
                            
                            <div style={{ width: '100%', height: '1px', background: '#333', margin: '5px 0' }}></div>
                            
                            <p style={{ color: '#aaa', fontSize: '12px', margin: 0, padding: '0 10px' }}>Wait for the clock to reach 0 to start the next target for free, or skip the wait now:</p>
                            
                            <button onClick={handleSkipWait} disabled={isProcessing} style={{ width: '100%', padding: '15px', background: 'rgba(177,0,255,0.1)', color: '#E0B0FF', border: '1px solid #B100FF', borderRadius: '10px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                <ArrowRightCircle size={18} /> SKIP WAIT & LEVEL UP ({SKIP_WAIT_COST_STARS}⭐)
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '20px' }}>
                    {isLocked ? (
                        <div style={{ background: 'rgba(255,0,85,0.1)', border: '1px solid #FF0055', borderRadius: '15px', padding: '15px' }}>
                            <p style={{ color: '#fff', fontSize: '13px', marginBottom: '15px', marginTop: 0 }}>Your time expired. {isPuzzleComplete ? 'But you completed the puzzle! You can start the next one for free.' : `Your pieces are lost, but you can restart the ${currentReward} TON level.`}</p>
                            
                            {/* 🔥 NUEVO: Si expiró PERO lo completó, el reinicio es GRATIS y pasa de nivel */}
                            {isPuzzleComplete ? (
                                <button onClick={handleSkipWait} disabled={isProcessing} style={{ width: '100%', padding: '15px', background: 'linear-gradient(90deg, #4CAF50, #2E7D32)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 5px 15px rgba(76,175,80,0.4)' }}>
                                    <Zap size={18} /> START NEXT LEVEL (FREE)
                                </button>
                            ) : (
                                <button onClick={handleUnfreezePuzzle} disabled={isProcessing} style={{ width: '100%', padding: '15px', background: 'linear-gradient(90deg, #FF0055, #FF4400)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 5px 15px rgba(255,0,85,0.4)' }}>
                                    <Unlock size={18} /> PAY {UNFREEZE_COST_STARS} ⭐ TO RESTART
                                </button>
                            )}
                        </div>
                    ) : (
                        <button onClick={onClose} disabled={isProcessing} style={{ width: '100%', padding: '15px', background: 'linear-gradient(90deg, #0088CC, #00F2FE)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 5px 15px rgba(0,242,254,0.4)' }}>
                            <Zap size={18} /> KEEP SPINNING
                        </button>
                    )}
                </div>

                {/* 🔥 LA BÓVEDA DE FRAGMENTOS (VAULT) 🔥 */}
                <div style={{ marginTop: '30px', width: '100%', textAlign: 'left', background: 'rgba(20,20,25,0.9)', borderRadius: '15px', border: '1px solid #444', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Box color="#00F2FE" />
                            <div style={{ fontSize: '16px', color: '#fff', fontWeight: '900', letterSpacing: '1px' }}>THE VAULT</div>
                        </div>
                        <div style={{ background: 'rgba(0, 242, 254, 0.1)', border: '1px solid #00F2FE', padding: '4px 10px', borderRadius: '8px', color: '#00F2FE', fontWeight: 'bold', fontSize: '12px' }}>
                            {puzzleFragments} FRAGMENTS
                        </div>
                    </div>
                    
                    <p style={{ color: '#aaa', fontSize: '11px', margin: '0 0 15px 0', lineHeight: '1.4' }}>Extra puzzle pieces are stored here. Collect {FRAGMENTS_NEEDED} fragments to redeem exclusive rewards!</p>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => handleRedeemFragments('VIP')} 
                            disabled={isProcessing || puzzleFragments < FRAGMENTS_NEEDED}
                            style={{ flex: 1, padding: '12px 5px', background: puzzleFragments >= FRAGMENTS_NEEDED ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)', border: puzzleFragments >= FRAGMENTS_NEEDED ? '1px solid #FFD700' : '1px dashed #444', borderRadius: '10px', cursor: puzzleFragments >= FRAGMENTS_NEEDED ? 'pointer' : 'not-allowed', opacity: puzzleFragments >= FRAGMENTS_NEEDED ? 1 : 0.5, transition: 'all 0.3s' }}
                        >
                            <Ticket size={16} color="#FFD700" style={{ margin: '0 auto 5px auto', display: 'block' }}/>
                            <div style={{ color: '#FFD700', fontSize: '11px', fontWeight: 'bold' }}>2 VIP TICKETS</div>
                            <div style={{ color: '#888', fontSize: '9px', marginTop: '2px' }}>Cost: {FRAGMENTS_NEEDED} Frag</div>
                        </button>

                        <button 
                            onClick={() => handleRedeemFragments('GNT')} 
                            disabled={isProcessing || puzzleFragments < FRAGMENTS_NEEDED}
                            style={{ flex: 1, padding: '12px 5px', background: puzzleFragments >= FRAGMENTS_NEEDED ? 'rgba(177,0,255,0.1)' : 'rgba(255,255,255,0.05)', border: puzzleFragments >= FRAGMENTS_NEEDED ? '1px solid #B100FF' : '1px dashed #444', borderRadius: '10px', cursor: puzzleFragments >= FRAGMENTS_NEEDED ? 'pointer' : 'not-allowed', opacity: puzzleFragments >= FRAGMENTS_NEEDED ? 1 : 0.5, transition: 'all 0.3s' }}
                        >
                            <Diamond size={16} color="#B100FF" style={{ margin: '0 auto 5px auto', display: 'block' }}/>
                            <div style={{ color: '#E0B0FF', fontSize: '11px', fontWeight: 'bold' }}>1 GNT TOKEN</div>
                            <div style={{ color: '#888', fontSize: '9px', marginTop: '2px' }}>Cost: {FRAGMENTS_NEEDED} Frag</div>
                        </button>
                    </div>
                    
                    {/* Barra de progreso visual para la bóveda */}
                    <div style={{ width: '100%', height: '6px', background: '#111', borderRadius: '3px', marginTop: '15px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min((puzzleFragments / FRAGMENTS_NEEDED) * 100, 100)}%`, background: 'linear-gradient(90deg, #0088CC, #00F2FE)', transition: 'width 0.5s ease' }}></div>
                    </div>
                </div>

                <div style={{ marginTop: '30px', width: '100%', textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', color: '#aaa', fontWeight: 'bold', marginBottom: '15px', letterSpacing: '1px' }}>NEXT TARGETS</div>
                    <div className="no-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                        {upcomingRewards.map((reward, i) => {
                            const isCurrent = reward === currentReward;
                            const isPassed = reward < currentReward;
                            
                            return (
                                <div key={i} style={{
                                    minWidth: '80px', padding: '10px', borderRadius: '12px', flexShrink: 0,
                                    background: isCurrent ? 'rgba(255,215,0,0.1)' : (isPassed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.05)'),
                                    border: isCurrent ? '1px solid #FFD700' : (isPassed ? '1px solid #4CAF50' : '1px solid #333'),
                                    textAlign: 'center', opacity: isPassed ? 0.5 : 1
                                }}>
                                    <div style={{ fontSize: '14px', fontWeight: '900', color: isCurrent ? '#FFD700' : (isPassed ? '#4CAF50' : '#fff') }}>
                                        {reward}
                                    </div>
                                    <div style={{ fontSize: '9px', color: '#888' }}>TON</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
            
            <style>{`
                @keyframes pulse-soft { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};