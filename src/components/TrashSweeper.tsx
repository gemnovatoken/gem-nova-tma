import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Trash2, ShieldCheck, Zap, AlertCircle, Lock, Search, Unlock } from 'lucide-react';
// Proveedores
import { useWallet, ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, Transaction } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css'; 
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Buffer } from 'buffer';

interface TrashSweeperProps {
    setGlobalScore: (val: number | ((prev: number) => number)) => void;
}

interface ScanResultData {
    exito: boolean;
    mensaje?: string;
    cuentasDetectadas: number;
    solRecuperable: string;
    direccionesBasura: string[];
}

const InnerTrashSweeper: React.FC<TrashSweeperProps> = ({ setGlobalScore }) => {
    const { user } = useAuth();
    const { publicKey, signTransaction } = useWallet();
    
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // 🔥 TUS NUEVAS VARIABLES DE ESTADO 🔥
    const [walletInput, setWalletInput] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);

    const BACKEND_URL = "https://gem-nova-api.onrender.com";

    // 1. ESCANEO PÚBLICO (Solo necesita el texto)
    const handleScan = async () => {
        if (!walletInput.trim()) {
            setError("Please enter a Solana wallet address.");
            return;
        }
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/scan-wallet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: walletInput.trim() })
            });
            
            const data = await response.json();
            if (data.exito) {
                setScanResult(data);
            } else {
                setError(data.mensaje);
            }
        } catch (err) {
            console.error("Error:", err);
            setError("Error connecting to radar server.");
        } finally {
            setLoading(false);
        }
    };

    // 2. DESBLOQUEO (Cobramos los puntos)
    const handleUnlock = () => {
        if (!window.confirm("⚠️ Pay 100,000 Points to unlock the cleaner?")) return;
        
        // Cobramos los puntos al instante
        setGlobalScore(prev => prev - 100000);
        setIsUnlocked(true);
    };

    // 3. LIMPIEZA FINAL (Requiere firma real)
    const handleSweep = async () => {
        if (!user || !publicKey || !signTransaction) {
            setError("Please connect your wallet using the button above to sign the transaction.");
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${BACKEND_URL}/api/execute-sweep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    wallet: publicKey.toString(),
                    userId: user.id 
                })
            });
            
            const data = await response.json();
            if (!data.exito) throw new Error(data.error || "Transaction failed");

            const txBuffer = Buffer.from(data.transaccionBase64, 'base64');
            const transaction = Transaction.from(txBuffer);

            console.log("📝 Requesting user signature...");
            const signedTx = await signTransaction(transaction);

            const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
            const rawTransaction = signedTx.serialize();
            
            console.log("🚀 Broadcasting to Solana network...");
            const signature = await connection.sendRawTransaction(rawTransaction);
            await connection.confirmTransaction(signature);

            alert(`🎉 SUCCESS! Swept ${scanResult?.cuentasDetectadas} accounts. Check your wallet!`);
            setScanResult(null);
            setWalletInput("");

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Transaction failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}>
            <div style={{ background: 'rgba(0, 242, 254, 0.1)', display: 'inline-block', padding: '15px', borderRadius: '50%', marginBottom: '15px', border: '1px solid #00F2FE', boxShadow: '0 0 20px rgba(0,242,254,0.3)' }}>
                <Trash2 size={40} color="#00F2FE" />
            </div>
            
            <h2 style={{ fontSize: '28px', margin: '0 0 10px 0', textShadow: '0 0 10px rgba(0,242,254,0.5)' }}>SOLANA SWEEPER</h2>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>
                Detect dead tokens in any wallet and recover the trapped SOL.
            </p>

            {/* 🔥 PASO 1: BARRA DE BÚSQUEDA 🔥 */}
            {!scanResult && (
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '15px', border: '1px solid #333', marginBottom: '20px' }}>
                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px', textAlign: 'left' }}>Enter Solana Wallet Address:</p>
                    <input 
                        type="text" 
                        placeholder="Paste wallet address here..."
                        value={walletInput}
                        onChange={(e) => setWalletInput(e.target.value)}
                        style={{
                            width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #555',
                            background: '#111', color: '#fff', marginBottom: '15px', boxSizing: 'border-box'
                        }}
                    />
                    <button 
                        onClick={handleScan} 
                        disabled={loading || !walletInput}
                        style={{
                            width: '100%', padding: '15px', borderRadius: '30px', border: 'none',
                            background: loading ? '#555' : '#00F2FE', color: '#000', fontWeight: '900', fontSize: '16px',
                            cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                        }}
                    >
                        {loading ? "SCANNING..." : <><Search size={18} /> SCAN BLOCKCHAIN</>}
                    </button>
                </div>
            )}

            {/* 🔥 PASO 2: RESULTADOS Y CANDADO 🔥 */}
            {scanResult && (
                <div style={{ background: 'rgba(255, 81, 47, 0.1)', padding: '20px', borderRadius: '15px', border: '1px solid #FF512F', animation: 'fadeIn 0.5s' }}>
                    {scanResult.cuentasDetectadas > 0 ? (
                        <>
                            <h3 style={{ margin: '0 0 15px 0', color: '#FF512F' }}>⚠️ {scanResult.cuentasDetectadas} Dead Tokens Found!</h3>
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <span style={{ color: '#aaa' }}>Total Locked SOL:</span>
                                <span style={{ fontWeight: 'bold' }}>{scanResult.solRecuperable} SOL</span>
                            </div>

                            {/* ESTADO BLOQUEADO */}
                            {!isUnlocked ? (
                                <div style={{ background: '#222', padding: '15px', borderRadius: '15px', border: '1px dashed #FFD700' }}>
                                    <Lock size={30} color="#FFD700" style={{ margin: '0 auto 10px auto' }} />
                                    <p style={{ fontSize: '12px', color: '#aaa', margin: '0 0 15px 0' }}>Cleaning is locked. Pay with your in-game points to unlock.</p>
                                    <button 
                                        onClick={handleUnlock}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '30px', border: 'none',
                                            background: '#FFD700', color: '#000', fontWeight: '900', cursor: 'pointer',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                                        }}
                                    >
                                        <Unlock size={16} /> UNLOCK SWEEPER (100k Pts)
                                    </button>
                                </div>
                            ) : (
                                /* ESTADO DESBLOQUEADO (AQUÍ APARECEN LAS WALLETS) */
                                <div style={{ animation: 'fadeIn 0.5s' }}>
                                    <div style={{ background: 'rgba(76, 175, 80, 0.1)', padding: '10px', borderRadius: '10px', border: '1px solid #4CAF50', marginBottom: '15px', color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>
                                        ✅ Unlocked! Connect to clean:
                                    </div>
                                    
                                    {!publicKey ? (
                                        <div style={{ marginBottom: '15px' }}>
                                            <WalletMultiButton style={{ background: 'linear-gradient(90deg, #9945FF, #14F195)', borderRadius: '30px', margin: '0 auto', width: '100%', justifyContent: 'center' }} />
                                            
                                            {/* TU IDEA: Link directo a Phantom por si siguen atrapados en Telegram */}
                                            <a 
                                                href="#"
                                                onClick={(e) => {
                                                e.preventDefault();
                                                // 1. Agarramos tu URL real automáticamente (sin la basura que le mete Telegram)
                                                const miUrlReal = window.location.origin + window.location.pathname;
                                                // 2. Armamos el salto cuántico a Phantom
                                                const linkPhantom = `https://phantom.app/ul/browse/${encodeURIComponent(miUrlReal)}`;
                                                // 3. ¡Disparamos!
                                                window.open(linkPhantom, '_blank');
                                                }}
                                                style={{ display: 'block', marginTop: '15px', color: '#00F2FE', fontSize: '13px', textDecoration: 'underline', fontWeight: 'bold' }}
                                            >
                                                        🚀 PLAYING ON MOBILE? CLICK HERE TO OPEN IN PHANTOM APP
                                            </a>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleSweep}
                                            disabled={loading}
                                            style={{
                                                width: '100%', padding: '15px', borderRadius: '30px', border: 'none',
                                                background: loading ? '#555' : 'linear-gradient(90deg, #FF512F, #DD2476)', 
                                                color: '#fff', fontWeight: '900', fontSize: '16px',
                                                cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 20px rgba(255,81,47,0.5)',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                                            }}
                                        >
                                            {loading ? "PROCESSING..." : <><Zap size={18} /> CONFIRM & CLEAN</>}
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div>
                            <ShieldCheck size={40} color="#4CAF50" style={{ margin: '0 auto 10px auto' }} />
                            <h3 style={{ color: '#4CAF50', margin: 0 }}>Wallet is Clean!</h3>
                            <p style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>No empty token accounts found.</p>
                            <button onClick={() => {setScanResult(null); setWalletInput("");}} style={{ background: 'transparent', color: '#00F2FE', border: '1px solid #00F2FE', padding: '5px 15px', borderRadius: '10px', marginTop: '10px', cursor: 'pointer' }}>Scan another</button>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div style={{ marginTop: '20px', background: 'rgba(255,0,0,0.1)', border: '1px solid red', padding: '10px', borderRadius: '10px', color: '#ff6b6b', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <AlertCircle size={14} /> {error}
                </div>
            )}
        </div>
    );
};

export const TrashSweeper: React.FC<TrashSweeperProps> = (props) => {
    const endpoint = "https://api.mainnet-beta.solana.com";
    const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets}>
                <WalletModalProvider>
                    <InnerTrashSweeper {...props} />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};