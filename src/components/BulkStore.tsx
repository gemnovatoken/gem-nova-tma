import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { StakingBank } from './StakingBank';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { Zap, Cpu, Shield, Rocket, Hexagon, Crown, History, X, ExternalLink, CheckCircle2 } from 'lucide-react';

// 👇 PON AQUÍ TU WALLET REAL
const ADMIN_WALLET_ADDRESS = 'UQD7qJo2-AYe7ehX9_nEk4FutxnmbdiSx3aLlwlB9nENZ43q'; 

interface PackNodeProps {
    title: string;
    points: string;
    price: string;
    color: string;
    icon: React.ReactNode;
    onClick: () => void;
    side: 'left' | 'right';
    disabled?: boolean;
}

interface BulkStoreProps {
    onPurchaseSuccess?: (newScore: number) => void;
    score: number;
    setScore: (val: number) => void;
    userLevel: number; 
}

// Interfaz para el historial
interface PurchaseRecord {
    hash: string;
    ton: number;
    points: number;
    date: string;
}

const PACK_DATA: Record<string, { ton: number, pts: number, label: string }> = {
    'starter':   { ton: 0.15, pts: 100000,   label: "Initialize Protocol" },
    'pro':       { ton: 0.75, pts: 500000,   label: "Upgrade System" },
    'whale':     { ton: 1.50, pts: 1000000,  label: "Deploy Whale Node" },
    'tycoon':    { ton: 7.50, pts: 5000000,  label: "Execute Tycoon Override" },
    'emperor':   { ton: 25.0, pts: 17000000, label: "System Overclock" },
    'blackhole': { ton: 100.0, pts: 70000000, label: "⚠️ GOD MODE" }
};

export const BulkStore: React.FC<BulkStoreProps> = ({ onPurchaseSuccess, score, setScore, userLevel }) => {
    const { user } = useAuth();
    const [tonConnectUI] = useTonConnectUI(); 
    const [loading, setLoading] = useState(false);
    
    // Estado para recargar el banco visualmente
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // --- ESTADOS PARA HISTORIAL ---
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState<PurchaseRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Función para cargar historial
    const fetchHistory = async () => {
        if (!user) return;
        setLoadingHistory(true);
        const { data } = await supabase.rpc('get_my_purchase_history', { p_user_id: user.id });
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (data && (data as any).history) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setHistoryData((data as any).history);
        }
        setLoadingHistory(false);
    };

    // Cargar historial al abrir el modal
    useEffect(() => {
        if (showHistory) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showHistory]);

    // Helper para acortar Hash
    const formatHash = (hash: string) => {
        if (!hash || hash === 'unknown') return "Tx-ID";
        return hash.substring(0, 6) + "..." + hash.substring(hash.length - 4);
    };

    const buyPack = async (packKey: string) => {
        // 🔒 1. VALIDACIÓN ESTRICTA DE USUARIO
        const safeUserId = user?.id;
        
        if (!safeUserId || safeUserId.trim() === "" || safeUserId.length < 20) {
            alert("⚠️ CRITICAL ERROR: User Session Missing.\n\nPlease reload the app.");
            return; 
        }

        // 2. CHECK WALLET
        if (!tonConnectUI.connected) {
            alert("⚠️ Please connect your wallet first.");
            return;
        }

        if (loading) return;

        const selectedPack = PACK_DATA[packKey];
        if (!selectedPack) return;

        const msg = `CONFIRM TRANSACTION:\n\nProtocol: ${selectedPack.label}\nCost: ${selectedPack.ton} TON\nReward: ${selectedPack.pts.toLocaleString()} Pts`;
        if (!window.confirm(msg)) return;

        setLoading(true);

        try {
            // 3. PREPARE TRANSACTION
            const amountInNano = (selectedPack.ton * 1000000000).toFixed(0);

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: ADMIN_WALLET_ADDRESS,
                        amount: amountInNano,
                    },
                ],
            };

            // 4. SEND TRANSACTION
            console.log("🔌 Sending Transaction...");
            const result = await tonConnectUI.sendTransaction(transaction);
            console.log("✅ PAYMENT SUCCESSFUL. Hash:", result.boc);

            // 5. SAVE TO DATABASE (Usando la función CORREGIDA buy_points_pack)
            const { data, error } = await supabase.rpc('buy_points_pack', {
                p_user_id: safeUserId,
                p_points_amount: selectedPack.pts,
                p_cost_ton: selectedPack.ton,
                p_tx_hash: result.boc // Ahora enviamos el Hash también
            });

            if (error) throw new Error(`DB_ERROR: ${error.message}`);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = data as any;

            if (response.success) {
                if (onPurchaseSuccess) onPurchaseSuccess(response.new_score);
                setScore(response.new_score);
                setRefreshTrigger(prev => prev + 1); 
                alert(`✅ SUCCESS!\n\n+${selectedPack.pts.toLocaleString()} Points added.`);
            } else {
                throw new Error(`API_ERROR: ${response.message}`);
            }

        } catch (err) {
            console.error("❌ Transaction Flow Error:", err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errMsg = (err as any).message || JSON.stringify(err);

            if (errMsg.includes("User rejected")) {
                // Usuario canceló, no mostrar alerta invasiva
            } 
            else if (errMsg.includes("DB_ERROR")) {
                alert(`⚠️ PAYMENT SUCCESSFUL, BUT DB ERROR.\n\nPoints were not added automatically.\nError: ${errMsg}`);
            } 
            else {
                alert(`⚠️ Transaction Failed.\n\nReason: ${errMsg}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cyber-bg" style={{ minHeight: '100%', paddingBottom: '120px', paddingTop: '20px' }}>
            
            <div className="data-stream"></div>

            {/* MODAL DE HISTORIAL */}
            {showHistory && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #00F2FE', background: '#050505', padding: '0' }}>
                        <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 242, 254, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00F2FE' }}>
                                <History size={18} />
                                <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>TRANSACTION_LOG</span>
                            </div>
                            <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}><X /></button>
                        </div>
                        <div style={{ padding: '15px' }}>
                            {loadingHistory ? (
                                <p style={{ color: '#aaa', textAlign: 'center', fontFamily: 'monospace' }}>DECRYPTING LOGS...</p>
                            ) : historyData.length === 0 ? (
                                <p style={{ color: '#555', textAlign: 'center', marginTop: '20px' }}>No transactions found.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {historyData.map((tx, idx) => (
                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '14px', display:'flex', alignItems:'center', gap:'4px' }}>
                                                    <CheckCircle2 size={12}/> +{tx.points.toLocaleString()} PTS
                                                </span>
                                                <span style={{ color: '#fff', fontSize: '12px' }}>{tx.ton} TON</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#aaa' }}>
                                                <span>{new Date(tx.date).toLocaleDateString()}</span>
                                                <a 
                                                    href={`https://tonviewer.com/transaction/${tx.hash}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#00F2FE', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                                                >
                                                    {formatHash(tx.hash)} <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div style={{ textAlign: 'center', marginBottom: '50px', position: 'relative', zIndex: 2 }}>
                <h2 style={{ 
                    color: '#00F2FE', textShadow: '0 0 15px #00F2FE', 
                    fontFamily: 'monospace', fontSize: '32px', margin: 0, letterSpacing: '4px'
                }}>
                    &lt;NET_STORE /&gt;
                </h2>
                <div style={{width: '100px', height: '2px', background: '#00F2FE', margin: '10px auto', boxShadow: '0 0 10px #00F2FE'}}></div>
                
                <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'15px', marginBottom:'15px'}}>
                    <p style={{ color: '#aaa', fontSize: '10px', margin:0 }}>SECURE CONNECTION: ENCRYPTED</p>
                    
                    <button 
                        onClick={() => setShowHistory(true)}
                        style={{
                            background: 'rgba(0, 242, 254, 0.1)', border: '1px solid #00F2FE', 
                            color: '#00F2FE', borderRadius: '5px', padding: '4px 8px', 
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px'
                        }}
                    >
                        <History size={12} /> LOGS
                    </button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', transform: 'scale(0.85)' }}>
                    <TonConnectButton />
                </div>
            </div>

            {/* NODOS DE COMPRA (AHORA TODOS DIRECTOS) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '50px', padding: '0 20px', position: 'relative' }}>
                
                {loading && (
                    <div style={{
                        position: 'fixed', top:0, left:0, right:0, bottom:0, 
                        background:'rgba(0,0,0,0.8)', zIndex: 9999, 
                        display:'flex', alignItems:'center', justifyContent:'center', color:'#00F2FE',
                        fontFamily:'monospace', fontSize:'20px'
                    }}>
                        PROCESSING BLOCKCHAIN TRANSACTION...
                    </div>
                )}

                <PackNode 
                    title="STARTER_NODE" points="100k" price="0.15 TON" 
                    color="#00F2FE" icon={<Zap size={20}/>} side="left"
                    onClick={() => buyPack('starter')} disabled={loading}
                />

                <PackNode 
                    title="PRO_MODULE" points="500k" price="0.75 TON" 
                    color="#4CAF50" icon={<Cpu size={20}/>} side="right"
                    onClick={() => buyPack('pro')} disabled={loading}
                />

                <PackNode 
                    title="WHALE_SERVER" points="1M" price="1.50 TON" 
                    color="#FFD700" icon={<Shield size={20}/>} side="left"
                    onClick={() => buyPack('whale')} disabled={loading}
                />

                <PackNode 
                    title="TYCOON_CORE" points="5M" price="7.50 TON" 
                    color="#E040FB" icon={<Rocket size={20}/>} side="right"
                    onClick={() => buyPack('tycoon')} disabled={loading}
                />

                <PackNode 
                    title="EMPEROR_SYS" points="17M" price="25 TON" 
                    color="#FF512F" icon={<Crown size={20}/>} side="left"
                    onClick={() => buyPack('emperor')} disabled={loading}
                />

                {/* BOTÓN GOD MODE AHORA COMPRA DIRECTO */}
                <div style={{ position: 'relative', zIndex: 2, margin: '40px 0' }}>
                    <div className="cyber-card" style={{ 
                        textAlign: 'center', padding: '30px', border: '2px solid #fff', 
                        background: '#000', boxShadow: '0 0 40px rgba(255,255,255,0.2)' 
                    }}>
                        <div style={{position:'absolute', top:-15, left:'50%', transform:'translateX(-50%)', background:'white', color:'black', padding:'2px 10px', fontSize:'10px', fontWeight:'bold'}}>ULTIMATE</div>
                        <Hexagon size={40} color="#fff" style={{margin:'0 auto 10px auto'}}/>
                        <h3 style={{margin:0, color:'#fff', fontSize:'24px', letterSpacing:'4px'}}>BLACK_HOLE</h3>
                        <p style={{color:'#aaa', fontSize:'10px', margin:'5px 0'}}>DATA INJECTION: 70M PTS</p>
                        
                        <button 
                            className="btn-cyber" 
                            style={{width:'100%', padding:'15px', fontSize:'16px', marginTop:'15px', background:'#fff', color:'#000'}} 
                            onClick={() => buyPack('blackhole')}
                            disabled={loading}
                        >
                            <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}>
                                💎 BUY NOW [100 TON]
                            </span>
                        </button>
                    </div>
                </div>

            </div>

            {/* --- LA BÓVEDA (STAKING BANK) --- */}
            <div style={{ marginTop: '60px', padding: '0 20px', position:'relative', zIndex:2 }}>
                <div style={{width:'6px', height:'60px', background:'#E040FB', margin:'0 auto 15px auto', boxShadow:'0 0 15px #E040FB'}}></div>
                
                <div className="circuit-vault" style={{ borderRadius: '20px', padding: '4px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.95)', borderRadius: '16px', overflow: 'hidden', padding:'10px' }}>
                        
                        <StakingBank 
                            key={refreshTrigger} 
                            globalScore={score} 
                            setGlobalScore={setScore}
                            userLevel={userLevel} 
                        />
                        
                    </div>
                    <div style={{position:'absolute', bottom:'10px', left:'20px', width:'40px', height:'4px', background:'#00F2FE', boxShadow:'0 0 10px #00F2FE'}}></div>
                    <div style={{position:'absolute', bottom:'10px', right:'20px', width:'15px', height:'4px', background:'#FF512F', boxShadow:'0 0 10px #FF512F', animation:'blink 1s infinite'}}></div>
                </div>
                <div style={{textAlign:'center', color:'#E040FB', fontSize:'10px', marginTop:'10px', letterSpacing:'2px'}}>SECURE VAULT ACCESS</div>
            </div>
            
            <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
        </div>
    );
};

// Componente PackNode Simplificado (Sin candados)
const PackNode: React.FC<PackNodeProps> = ({ title, points, price, color, icon, onClick, side, disabled }) => (
    <div style={{ 
        display: 'flex', 
        justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
        position: 'relative',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
    }}>
        <div style={{
            position: 'absolute', top: '50%', 
            left: side === 'left' ? 'auto' : '50%', 
            right: side === 'left' ? '50%' : 'auto',
            width: '50%', height: '2px', background: color, 
            boxShadow: `0 0 10px ${color}`, zIndex: 0,
            opacity: 0.5
        }}>
            <div style={{
                position: 'absolute', 
                [side === 'left' ? 'right' : 'left']: '-4px', 
                top: '-3px', width: '8px', height: '8px', 
                background: color, borderRadius: '50%', boxShadow: `0 0 10px ${color}`
            }}></div>
        </div>

        <div className="cyber-card" style={{ 
            width: '180px', padding: '15px', borderRadius: '0', 
            borderLeft: side === 'left' ? `4px solid ${color}` : '1px solid #333',
            borderRight: side === 'right' ? `4px solid ${color}` : '1px solid #333',
            cursor: 'pointer', display:'flex', flexDirection:'column', gap:'10px'
        }} onClick={onClick}>
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{color:color, display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', fontWeight:'bold', fontFamily:'monospace'}}>
                    {icon} {title}
                </div>
            </div>

            <div style={{fontSize:'24px', fontWeight:'900', color:'#fff', textShadow:`0 0 10px ${color}40`}}>
                {points}
            </div>
            
            <button className="btn-cyber" style={{fontSize:'12px', padding:'8px', borderColor:color, color:color}}>
                {price}
            </button>
        </div>
    </div>
);