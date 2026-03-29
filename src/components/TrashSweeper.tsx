import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Trash2, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
// 🔥 IMPORTAMOS LOS PROVEEDORES DE SOLANA AQUI 🔥
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

// 1. ESTE ES TU COMPONENTE EXACTO, SOLO LE CAMBIAMOS EL NOMBRE A "InnerTrashSweeper"
const InnerTrashSweeper: React.FC<TrashSweeperProps> = ({ setGlobalScore }) => {
    const { user } = useAuth();
    const { publicKey, signTransaction } = useWallet();
    
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const BACKEND_URL = "https://gem-nova-api.onrender.com";

    const handleScan = async () => {
        if (!publicKey) return;
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/scan-wallet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: publicKey.toString() })
            });
            
            const data = await response.json();
            if (data.exito) {
                setScanResult(data);
            } else {
                setError(data.mensaje);
            }
        } catch (err) {
            console.error("Error en el radar:", err);
            setError("Error connecting to radar server.");
        } finally {
            setLoading(false);
        }
    };

    const handleSweep = async () => {
        if (!user || !publicKey || !signTransaction) return;
        
        if (!window.confirm("⚠️ Pay 100,000 Points to clean your wallet and recover SOL?")) return;
        
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
            
            if (!data.exito) {
                setError(data.error || "Transaction failed");
                setLoading(false);
                return;
            }

            const txBuffer = Buffer.from(data.transaccionBase64, 'base64');
            const transaction = Transaction.from(txBuffer);

            console.log("📝 Requesting user signature...");
            const signedTx = await signTransaction(transaction);

            const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
            const rawTransaction = signedTx.serialize();
            
            console.log("🚀 Broadcasting to Solana network...");
            const signature = await connection.sendRawTransaction(rawTransaction);
            
            console.log("⏳ Waiting for confirmation...");
            await connection.confirmTransaction(signature);

            alert(`🎉 SUCCESS! Swept ${scanResult?.cuentasDetectadas} accounts. Check your wallet!`);
            
            setGlobalScore(prev => prev - 100000);
            setScanResult(null);

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "User rejected the transaction or network error.";
            setError(errorMessage);
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
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '30px' }}>
                Detect dead tokens in your wallet and recover the SOL trapped inside them.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '15px', border: '1px solid #333', marginBottom: '20px' }}>
                {!publicKey ? (
                    <>
                        <p style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>Connect your Web3 Wallet to start scanning.</p>
                        <WalletMultiButton style={{ background: 'linear-gradient(90deg, #9945FF, #14F195)', borderRadius: '30px', margin: '0 auto' }} />
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#14F195', marginBottom: '15px', fontWeight: 'bold' }}>
                            <ShieldCheck size={20} /> Wallet Connected
                        </div>
                        
                        {!scanResult && (
                            <button 
                                onClick={handleScan} 
                                disabled={loading}
                                style={{
                                    width: '100%', padding: '15px', borderRadius: '30px', border: 'none',
                                    background: loading ? '#555' : '#00F2FE', color: '#000', fontWeight: '900', fontSize: '16px',
                                    cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 15px rgba(0,242,254,0.4)'
                                }}
                            >
                                {loading ? "SCANNING BLOCKCHAIN..." : "SCAN FOR JUNK NOW"}
                            </button>
                        )}
                    </>
                )}
            </div>

            {scanResult && (
                <div style={{ background: 'rgba(255, 81, 47, 0.1)', padding: '20px', borderRadius: '15px', border: '1px solid #FF512F', animation: 'fadeIn 0.5s' }}>
                    {scanResult.cuentasDetectadas > 0 ? (
                        <>
                            <h3 style={{ margin: '0 0 15px 0', color: '#FF512F' }}>⚠️ {scanResult.cuentasDetectadas} Dead Tokens Found!</h3>
                            
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: '#aaa' }}>Total Locked SOL:</span>
                                <span style={{ fontWeight: 'bold' }}>{scanResult.solRecuperable} SOL</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '20px', padding: '0 5px' }}>
                                <span>Platform Fee: 15%</span>
                                <span>You Keep: 85%</span>
                            </div>

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
                                {loading ? "PROCESSING..." : <><Zap size={18} /> CLEAN & RECOVER (100k Pts)</>}
                            </button>
                        </>
                    ) : (
                        <div>
                            <ShieldCheck size={40} color="#4CAF50" style={{ margin: '0 auto 10px auto' }} />
                            <h3 style={{ color: '#4CAF50', margin: 0 }}>Wallet is Clean!</h3>
                            <p style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>No empty token accounts found.</p>
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

/// 🔥 EL ENVOLTORIO ACTUALIZADO 🔥
export const TrashSweeper: React.FC<TrashSweeperProps> = (props) => {
    const endpoint = "https://api.mainnet-beta.solana.com";
    
    // AQUÍ LE DECIMOS EXPLÍCITAMENTE QUE ACTIVE LOS LINKS PARA PHANTOM Y SOLFLARE
    const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <InnerTrashSweeper {...props} />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};