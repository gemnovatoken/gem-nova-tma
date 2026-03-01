import React, { useState } from 'react'; // Eliminado useEffect
import { supabase } from '../services/supabase';

// Props esperadas desde tu App principal
interface AuctionProps {
    user: { id: string }; // Reemplazado 'any' por la estructura exacta que usas
    score: number; // Saldo disponible en billetera
    userLevel: number;
    onClose: () => void;
}

export const VIPAuctionZone: React.FC<AuctionProps> = ({ user, score, userLevel, onClose }) => {
    // Estado de la subasta (Simulado para este ejemplo, idealmente viene de Supabase)
    const [highestBid, setHighestBid] = useState(7500000); 
    const [timeLeft] = useState("05:24"); // Eliminado setTimeLeft que no se usaba
    
    // Estado de la Bóveda del Usuario (Escrow)
    const [myEscrow, setMyEscrow] = useState(5000000); // Ejemplo: Ya metió 5M antes
    
    // Estado de la nueva puja
    const [targetBid, setTargetBid] = useState(highestBid + 250000); // Por defecto, el mínimo para superar
    const [isBidding, setIsBidding] = useState(false);

    // Matemáticas de Wall Street: ¿Cuánto cash necesita inyectar AHORA?
    const liquidityNeeded = Math.max(0, targetBid - myEscrow);
    const hasEnoughFunds = score >= liquidityNeeded;

    const handlePlaceBid = async () => {
        if (userLevel < 7) {
            alert("Acceso denegado: Requiere Nivel 7.");
            return;
        }

        // AQUI IRÍA LA LÓGICA DE TONCONNECT PARA COBRAR 0.15 TON AL NIVEL 7 (Si es su primera puja)

        setIsBidding(true);
        try {
            const { data, error } = await supabase.rpc('place_bid', {
                p_user_id: user.id,
                p_auction_id: 1, // ID dinámico de la subasta activa
                p_target_bid: targetBid
            });

            if (error) throw error;
            
            console.log("Puja exitosa:", data);
            // Actualizamos la UI localmente para dar feedback inmediato
            setMyEscrow(targetBid);
            setHighestBid(targetBid);
            alert("¡Puja aceptada! Eres el líder actual.");
            
        } catch (error: unknown) { // Reemplazado 'any' por 'unknown' (Mejor práctica en TS)
            // Casteamos el error a tipo Error para poder leer su mensaje con seguridad
            alert((error as Error).message || "Error al pujar");
        } finally {
            setIsBidding(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeBtn}>✕</button>
                
                <h2 style={{ color: '#FFD700', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                    💎 The Board of Directors
                </h2>
                <div style={styles.prizeBadge}>Premio: 10 TON REAL</div>

                {/* Reloj de Pánico */}
                <div style={styles.timerBox}>
                    <span style={{ fontSize: '12px', color: '#aaa' }}>TIEMPO RESTANTE</span>
                    <div style={{ fontSize: '28px', color: '#FF4444', fontWeight: 'bold' }}>{timeLeft}</div>
                </div>

                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <span style={styles.statLabel}>Puja Máxima Actual</span>
                        <span style={styles.statValue}>{highestBid.toLocaleString()}</span>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.statLabel}>Tu Bóveda (Atrapado)</span>
                        <span style={{...styles.statValue, color: '#4CAF50'}}>{myEscrow.toLocaleString()}</span>
                    </div>
                </div>

                {/* Panel de Operaciones */}
                <div style={styles.tradingPanel}>
                    <label style={{ color: '#aaa', fontSize: '14px' }}>Establecer Nueva Puja Total:</label>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button onClick={() => setTargetBid(highestBid + 250000)} style={styles.quickBidBtn}>+250k</button>
                        <button onClick={() => setTargetBid(highestBid + 500000)} style={styles.quickBidBtn}>+500k</button>
                        <button onClick={() => setTargetBid(highestBid + 1000000)} style={styles.quickBidBtn}>+1M</button>
                    </div>
                    
                    <div style={styles.liquidityBox}>
                        <span>Liquidez requerida ahora:</span>
                        <strong style={{ color: hasEnoughFunds ? '#FFF' : '#FF4444' }}>
                            {liquidityNeeded.toLocaleString()} Pts
                        </strong>
                    </div>
                    
                    {!hasEnoughFunds && (
                        <p style={{ color: '#FF4444', fontSize: '12px', marginTop: '5px' }}>
                            ⚠️ Saldo insuficiente. ¡Compra puntos en la tienda o perderás tu bóveda!
                        </p>
                    )}

                    <button 
                        onClick={handlePlaceBid} 
                        disabled={!hasEnoughFunds || isBidding}
                        style={{
                            ...styles.mainActionBtn,
                            opacity: (!hasEnoughFunds || isBidding) ? 0.5 : 1,
                            background: userLevel === 8 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : '#333',
                            color: userLevel === 8 ? '#000' : '#FFF'
                        }}
                    >
                        {isBidding ? 'PROCESANDO...' : `CONFIRMAR PUJA`}
                    </button>

                    {userLevel === 7 && (
                        <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '10px' }}>
                            * Nivel 7: Aplica un fee de retiro del 5% si pierdes la subasta. Nivel 8 libre de fees.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Estilos Nivel Premium ---
const styles = {
    overlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },
    modal: { background: '#121212', border: '1px solid #333', borderRadius: '20px', padding: '25px', width: '90%', maxWidth: '400px', position: 'relative' as const, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    closeBtn: { position: 'absolute' as const, top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' },
    prizeBadge: { background: 'rgba(255, 215, 0, 0.1)', color: '#FFD700', padding: '5px 10px', borderRadius: '8px', display: 'inline-block', fontSize: '14px', fontWeight: 'bold', border: '1px solid rgba(255, 215, 0, 0.3)' },
    timerBox: { textAlign: 'center' as const, margin: '20px 0', padding: '15px', background: 'rgba(255, 68, 68, 0.05)', border: '1px solid rgba(255, 68, 68, 0.2)', borderRadius: '12px' },
    statsGrid: { display: 'flex', gap: '10px', marginBottom: '20px' },
    statCard: { flex: 1, background: '#1E1E1E', padding: '15px', borderRadius: '12px', textAlign: 'center' as const },
    statLabel: { display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px', textTransform: 'uppercase' as const },
    statValue: { display: 'block', fontSize: '18px', fontWeight: 'bold', color: '#FFF' },
    tradingPanel: { background: '#1A1A1A', padding: '20px', borderRadius: '15px', border: '1px solid #2A2A2A' },
    quickBidBtn: { flex: 1, background: '#2A2A2A', border: '1px solid #444', color: '#FFF', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    liquidityBox: { display: 'flex', justifyContent: 'space-between', margin: '20px 0', padding: '15px', background: '#000', borderRadius: '8px', borderLeft: '4px solid #FFD700' },
    mainActionBtn: { width: '100%', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', textTransform: 'uppercase' as const }
};