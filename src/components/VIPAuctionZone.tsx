import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface AuctionProps {
    user: { id: string };
    score: number;
    userLevel: number;
    onClose: () => void;
}

// Interfaz para mapear los datos que vienen de SQL
interface AuctionData {
    id: number;
    title: string;
    prize_ton: number;
    starting_bid: number;
    min_increment: number;
    lvl7_entry_fee: number;
    highest_bid: number;
    status: string;
}

export const VIPAuctionZone: React.FC<AuctionProps> = ({ user, score, userLevel, onClose }) => {
    const [auctions, setAuctions] = useState<AuctionData[]>([]);
    const [selectedId, setSelectedId] = useState<number>(1); // Empieza mostrando la de 5 TON
    
    const [myEscrow, setMyEscrow] = useState(0); 
    const [targetBid, setTargetBid] = useState(0); 
    const [isBidding, setIsBidding] = useState(false);

    // Cargar las subastas desde DB
    const fetchAuctions = async () => {
        const { data, error } = await supabase.from('auctions').select('*').order('id', { ascending: true });
        if (!error && data) {
            setAuctions(data);
            // Configurar la puja inicial si no se ha tocado
            const activeAuction = data.find(a => a.id === selectedId);
            if (activeAuction && targetBid === 0) {
                setTargetBid(activeAuction.highest_bid + activeAuction.min_increment);
            }
        }

        // Recuperar la bóveda del usuario para la subasta seleccionada
        const { data: vaultData } = await supabase
            .from('auction_vault')
            .select('escrowed_points')
            .eq('auction_id', selectedId)
            .eq('user_id', user.id)
            .single();
        
        if (vaultData) setMyEscrow(vaultData.escrowed_points);
        else setMyEscrow(0);
    };

    useEffect(() => {
        fetchAuctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId]);

    const activeAuction = auctions.find(a => a.id === selectedId);
    
    // Matemáticas de liquidez
    const liquidityNeeded = Math.max(0, targetBid - myEscrow);
    const hasEnoughFunds = score >= liquidityNeeded;

    const handlePlaceBid = async () => {
        if (userLevel < 7) {
            alert("Acceso denegado: Requiere Nivel 7.");
            return;
        }

        if (activeAuction?.status === 'locked') {
            alert("Subasta bloqueada. Alcanza la meta de la comunidad primero.");
            return;
        }

        // AQUI IRÍA LA LÓGICA DE TONCONNECT PARA COBRAR EL FEE (0.10 o 0.15 TON)

        setIsBidding(true);
        try {
            const { error } = await supabase.rpc('place_bid', {
                p_user_id: user.id,
                p_auction_id: selectedId,
                p_target_bid: targetBid
            });

            if (error) throw error;
            
            alert("¡Puja aceptada! Eres el líder actual.");
            fetchAuctions(); // Refrescar datos
            
        } catch (error: unknown) {
            alert((error as Error).message || "Error al pujar");
        } finally {
            setIsBidding(false);
        }
    };

    if (!activeAuction) return <div style={styles.overlay}><p>Cargando Bóvedas...</p></div>;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeBtn}>✕</button>
                
                {/* Selector de Subastas */}
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

                <h2 style={{ color: '#FFD700', margin: '0 0 5px 0', fontSize: '18px' }}>
                    {activeAuction.title}
                </h2>
                
                {activeAuction.status === 'locked' && (
                    <div style={{ background: '#FF4444', color: '#FFF', padding: '5px', borderRadius: '5px', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>
                        🔒 BLOQUEADA: Esperando a 20 VIPs
                    </div>
                )}

                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <span style={styles.statLabel}>Puja Máxima</span>
                        <span style={styles.statValue}>{activeAuction.highest_bid.toLocaleString()}</span>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.statLabel}>Tu Bóveda</span>
                        <span style={{...styles.statValue, color: '#4CAF50'}}>{myEscrow.toLocaleString()}</span>
                    </div>
                </div>

                {/* Panel de Operaciones */}
                <div style={styles.tradingPanel}>
                    <label style={{ color: '#aaa', fontSize: '12px' }}>Nueva Puja (Sube de {activeAuction.min_increment / 1000}k):</label>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                        <button onClick={() => setTargetBid(activeAuction.highest_bid + activeAuction.min_increment)} style={styles.quickBidBtn}>+{activeAuction.min_increment / 1000}k</button>
                        <button onClick={() => setTargetBid(activeAuction.highest_bid + (activeAuction.min_increment * 2))} style={styles.quickBidBtn}>+{(activeAuction.min_increment * 2) / 1000}k</button>
                    </div>
                    
                    <div style={styles.liquidityBox}>
                        <span>Liquidez requerida ahora:</span>
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
                        {isBidding ? 'PROCESANDO...' : `CONFIRMAR PUJA`}
                    </button>

                    <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '10px' }}>
                        Nivel 7 Entry Fee: <strong>{activeAuction.lvl7_entry_fee} TON</strong> | 5% Burn si pierdes.
                    </p>
                </div>
            </div>
        </div>
    );
};

// ==========================================================
// COMPONENTE: HYPE METER (Barra Superior)
// Importa esto en tu App.tsx o MarketDashboard
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
                {vipCount >= targetVips ? '🔥 BÓVEDAS VIP ACTIVAS 🔥' : '🔒 Desbloqueo de Subastas VIP'}
            </h4>
            <p style={{ color: '#aaa', fontSize: '11px', margin: '0 0 10px 0' }}>
                1x 10 TON | 1x 5 TON. Meta: 20 Inversores (Nivel 7+).
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

// --- Estilos ---
const styles = {
    overlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },
    modal: { background: '#121212', border: '1px solid #333', borderRadius: '20px', padding: '25px', width: '90%', maxWidth: '400px', position: 'relative' as const, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    closeBtn: { position: 'absolute' as const, top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' },
    statsGrid: { display: 'flex', gap: '10px', marginBottom: '15px' },
    statCard: { flex: 1, background: '#1E1E1E', padding: '15px', borderRadius: '12px', textAlign: 'center' as const },
    statLabel: { display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px', textTransform: 'uppercase' as const },
    statValue: { display: 'block', fontSize: '18px', fontWeight: 'bold', color: '#FFF' },
    tradingPanel: { background: '#1A1A1A', padding: '20px', borderRadius: '15px', border: '1px solid #2A2A2A' },
    quickBidBtn: { flex: 1, background: '#2A2A2A', border: '1px solid #444', color: '#FFF', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    liquidityBox: { display: 'flex', justifyContent: 'space-between', margin: '15px 0', padding: '12px', background: '#000', borderRadius: '8px', borderLeft: '4px solid #FFD700', fontSize: '13px' },
    mainActionBtn: { width: '100%', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', textTransform: 'uppercase' as const }
};