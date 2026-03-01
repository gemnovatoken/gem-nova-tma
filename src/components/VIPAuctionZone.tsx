import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface AuctionProps {
    user: { id: string };
    score: number;
    userLevel: number;
    onClose: () => void;
}

interface AuctionData {
    id: number;
    title: string;
    prize_ton: number;
    starting_bid: number;
    min_increment: number;
    lvl7_entry_fee: number;
    highest_bid: number;
    status: string;
    end_time: string; 
}

export const VIPAuctionZone: React.FC<AuctionProps> = ({ user, score, userLevel, onClose }) => {
    const [auctions, setAuctions] = useState<AuctionData[]>([]);
    const [selectedId, setSelectedId] = useState<number>(1); 
    
    const [myEscrow, setMyEscrow] = useState(0); 
    const [targetBid, setTargetBid] = useState(0); 
    const [isBidding, setIsBidding] = useState(false);
    
    const [timeLeft, setTimeLeft] = useState("00:00:00");
    const [isFinished, setIsFinished] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [vipCount, setVipCount] = useState(0);
    const targetVips = 20;

    const fetchAuctions = async () => {
        const { data, error } = await supabase.from('auctions').select('*').order('id', { ascending: true });
        if (!error && data) {
            setAuctions(data);
            const activeAuction = data.find(a => a.id === selectedId);
            if (activeAuction && targetBid === 0) {
                setTargetBid(activeAuction.highest_bid + activeAuction.min_increment);
            }
        }

        const { data: vaultData } = await supabase
            .from('auction_vault')
            .select('escrowed_points')
            .eq('auction_id', selectedId)
            .eq('user_id', user.id)
            .single();
        
        if (vaultData) setMyEscrow(vaultData.escrowed_points);
        else setMyEscrow(0);

        const { data: vips } = await supabase.rpc('get_vip_user_count');
        if (vips !== null) setVipCount(Number(vips));
    };

    // Actualizar periódicamente para atrapar cambios de tiempo (Anti-Sniper)
    useEffect(() => {
        fetchAuctions();
        const interval = setInterval(fetchAuctions, 5000); // Refresca cada 5s en background
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId]);

    const activeAuction = auctions.find(a => a.id === selectedId);

    // LÓGICA DEL RELOJ EN TIEMPO REAL
    useEffect(() => {
        if (!activeAuction) return;

        if (activeAuction.status === 'locked') {
            setTimeLeft("WAITING TO START");
            setIsFinished(false);
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(activeAuction.end_time).getTime();
            const distance = end - now;

            if (distance <= 0 || activeAuction.status === 'finished') {
                clearInterval(interval);
                setTimeLeft("00:00:00");
                setIsFinished(true);
            } else {
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                setIsFinished(false);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [activeAuction]); // Se re-ejecuta si activeAuction cambia (ej. por el Anti-Sniper)
    
    const liquidityNeeded = Math.max(0, targetBid - myEscrow);
    const hasEnoughFunds = score >= liquidityNeeded;

    const handlePlaceBid = async () => {
        if (userLevel < 7) {
            alert("Access Denied: Level 7 Required.");
            return;
        }

        if (activeAuction?.status === 'locked') {
            alert("Auction locked. Reach the community milestone first.");
            return;
        }

        setIsBidding(true);
        try {
            const { error } = await supabase.rpc('place_bid', {
                p_user_id: user.id,
                p_auction_id: selectedId,
                p_target_bid: targetBid
            });

            if (error) throw error;
            
            alert("Bid accepted! You are the current leader.");
            fetchAuctions(); 
            
        } catch (error: unknown) {
            alert((error as Error).message || "Error placing bid");
        } finally {
            setIsBidding(false);
        }
    };

    const handleClaim = async () => {
        setIsClaiming(true);
        try {
            const { data, error } = await supabase.rpc('claim_auction_reward', {
                p_user_id: user.id,
                p_auction_id: selectedId
            });

            if (error) throw error;
            
            alert(data); 
            fetchAuctions(); 
            
        } catch (error: unknown) {
            alert((error as Error).message || "Error claiming vault");
        } finally {
            setIsClaiming(false);
        }
    };

    if (!activeAuction) return <div style={styles.overlay}><p>Loading Vaults...</p></div>;

    const progressPercent = Math.min((vipCount / targetVips) * 100, 100);

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeBtn}>✕</button>
                
                {/* Auction Selector */}
                <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                    {auctions.map(a => (
                        <button 
                            key={a.id} 
                            onClick={() => { setSelectedId(a.id); setTargetBid(a.highest_bid + a.min_increment); }}
                            style={{
                                flex: 1, padding: '10px', fontSize: '12px', fontWeight: 'bold', border: 'none',
                                borderRadius: '8px', cursor: 'pointer',
                                background: selectedId === a.id ? '#FFD700' : '#333',
                                color: selectedId === a.id ? '#000' : '#FFF'
                            }}
                        >
                            {a.prize_ton} TON 
                        </button>
                    ))}
                </div>

                <h2 style={{ color: '#FFD700', margin: '0 0 5px 0', fontSize: '18px', textAlign: 'center' }}>
                    {activeAuction.title}
                </h2>
                
                {/* BARRA DE PROGRESO INTERNA */}
                {activeAuction.status === 'locked' && (
                    <div style={{ background: '#1A1A1A', padding: '15px', borderRadius: '12px', textAlign: 'center', marginBottom: '15px', border: '1px solid #FFD700' }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#aaa', textTransform: 'uppercase' }}>
                            Unlock Progress
                        </p>
                        <div style={{ width: '100%', background: '#333', borderRadius: '10px', height: '20px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #FF8C00 0%, #FFD700 100%)', transition: 'width 1s ease-in-out' }}></div>
                            <span style={{ position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', fontWeight: 'bold', color: progressPercent > 50 ? '#000' : '#FFF' }}>
                                {vipCount} / {targetVips} VIPs
                            </span>
                        </div>
                        <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#FFD700' }}>Waiting for community goal to start!</p>
                    </div>
                )}

                {/* Reloj de Pánico */}
                <div style={styles.timerBox}>
                    <span style={{ fontSize: '12px', color: '#aaa' }}>TIME REMAINING</span>
                    <div style={{ fontSize: '28px', color: '#FF4444', fontWeight: 'bold' }}>{timeLeft}</div>
                </div>

                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <span style={styles.statLabel}>Highest Bid</span>
                        <span style={styles.statValue}>{activeAuction.highest_bid.toLocaleString()}</span>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.statLabel}>Your Vault</span>
                        <span style={{...styles.statValue, color: '#4CAF50'}}>{myEscrow.toLocaleString()}</span>
                    </div>
                </div>

                {/* SISTEMA DUAL: TRADING PANEL VS CLAIM PANEL */}
                {!isFinished ? (
                    <div style={styles.tradingPanel}>
                        <label style={{ color: '#aaa', fontSize: '12px' }}>New Bid (+{activeAuction.min_increment / 1000}k):</label>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                            <button onClick={() => setTargetBid(activeAuction.highest_bid + activeAuction.min_increment)} style={styles.quickBidBtn}>+{activeAuction.min_increment / 1000}k</button>
                            <button onClick={() => setTargetBid(activeAuction.highest_bid + (activeAuction.min_increment * 2))} style={styles.quickBidBtn}>+{(activeAuction.min_increment * 2) / 1000}k</button>
                        </div>
                        
                        <div style={styles.liquidityBox}>
                            <span>Liquidity required now:</span>
                            <strong style={{ color: hasEnoughFunds ? '#FFF' : '#FF4444' }}>
                                {liquidityNeeded.toLocaleString()} Pts
                            </strong>
                        </div>

                        <button 
                            onClick={handlePlaceBid} 
                            disabled={!hasEnoughFunds || isBidding || activeAuction.status === 'locked'}
                            style={{
                                ...styles.mainActionBtn,
                                opacity: (!hasEnoughFunds || isBidding || activeAuction.status === 'locked') ? 0.5 : 1,
                                background: userLevel === 8 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : '#333',
                                color: userLevel === 8 ? '#000' : '#FFF'
                            }}
                        >
                            {isBidding ? 'PROCESSING...' : `CONFIRM BID`}
                        </button>

                        <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '10px' }}>
                            Lvl 7 Entry Fee: <strong>{activeAuction.lvl7_entry_fee} TON</strong>.<br/>
                            <span style={{ color: '#FF4444' }}>⚠️ 5% BURN FOR ALL LOSING BIDS.</span>
                        </p>
                    </div>
                ) : (
                    <div style={{...styles.tradingPanel, border: '1px solid #4CAF50'}}>
                        <h3 style={{ color: '#FFF', margin: '0 0 10px 0', textAlign: 'center', textTransform: 'uppercase' }}>Auction Finished</h3>
                        
                        {myEscrow > 0 ? (
                            <>
                                <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', marginBottom: '15px' }}>
                                    You have funds locked in the vault. Proceed to claim your reward or refund.
                                </p>
                                <button 
                                    onClick={handleClaim} 
                                    disabled={isClaiming}
                                    style={{
                                        ...styles.mainActionBtn,
                                        background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                                        color: '#FFF'
                                    }}
                                >
                                    {isClaiming ? 'PROCESSING...' : `CLAIM VAULT`}
                                </button>
                            </>
                        ) : (
                            <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
                                You didn't participate or have already claimed your vault.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================================
// HYPE METER COMPONENT (Top Bar)
// ==========================================================
export const VIPUnlockProgressBar = () => {
    const [vipCount, setVipCount] = useState(0);
    const targetVips = 20;

    useEffect(() => {
        const fetchVipCount = async () => {
            const { data } = await supabase.rpc('get_vip_user_count');
            if (data !== null) setVipCount(Number(data));
        };
        fetchVipCount();
        const interval = setInterval(fetchVipCount, 60000);
        return () => clearInterval(interval);
    }, []);

    const progressPercent = Math.min((vipCount / targetVips) * 100, 100);

    return (
        <div style={{ background: '#111', borderBottom: '2px solid #FFD700', padding: '15px', textAlign: 'center' }}>
            <h4 style={{ color: '#FFF', margin: '0 0 5px 0', fontSize: '14px', textTransform: 'uppercase' }}>
                {vipCount >= targetVips ? '🔥 VIP VAULTS ACTIVE 🔥' : '🔒 VIP Auctions Unlock'}
            </h4>
            <p style={{ color: '#aaa', fontSize: '11px', margin: '0 0 10px 0' }}>
                1x 10 TON | 1x 5 TON. Goal: 20 Investors (Level 7+).
            </p>
            <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto', background: '#333', borderRadius: '10px', height: '18px', position: 'relative' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #FF8C00 0%, #FFD700 100%)', borderRadius: '10px' }}></div>
                <span style={{ position: 'absolute', top: '1px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', fontWeight: 'bold', color: progressPercent > 50 ? '#000' : '#FFF' }}>
                    {vipCount} / {targetVips} VIPs
                </span>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },
    modal: { background: '#121212', border: '1px solid #333', borderRadius: '20px', padding: '25px', width: '90%', maxWidth: '400px', position: 'relative' as const, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    closeBtn: { position: 'absolute' as const, top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' },
    timerBox: { textAlign: 'center' as const, margin: '20px 0', padding: '15px', background: 'rgba(255, 68, 68, 0.05)', border: '1px solid rgba(255, 68, 68, 0.2)', borderRadius: '12px' },
    statsGrid: { display: 'flex', gap: '10px', marginBottom: '15px' },
    statCard: { flex: 1, background: '#1E1E1E', padding: '15px', borderRadius: '12px', textAlign: 'center' as const },
    statLabel: { display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px', textTransform: 'uppercase' as const },
    statValue: { display: 'block', fontSize: '18px', fontWeight: 'bold', color: '#FFF' },
    tradingPanel: { background: '#1A1A1A', padding: '20px', borderRadius: '15px', border: '1px solid #2A2A2A' },
    quickBidBtn: { flex: 1, background: '#2A2A2A', border: '1px solid #444', color: '#FFF', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    liquidityBox: { display: 'flex', justifyContent: 'space-between', margin: '15px 0', padding: '12px', background: '#000', borderRadius: '8px', borderLeft: '4px solid #FFD700', fontSize: '13px' },
    mainActionBtn: { width: '100%', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', textTransform: 'uppercase' as const }
};