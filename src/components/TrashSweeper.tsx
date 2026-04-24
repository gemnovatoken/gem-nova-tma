import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Trash2, ShieldCheck, Zap, AlertCircle, Lock, Search, Unlock, Copy, Check, Coins } from 'lucide-react';
// Proveedores
import { useWallet, ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, Transaction } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css'; 
// @ts-expect-error: se revisara
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Buffer } from 'buffer';

interface TrashSweeperProps {
    setGlobalScore: (val: number | ((prev: number) => number)) => void;
}

// 🔥 Creamos un "molde" exacto para el nuevo formato del backend 🔥
interface TokenBasuraInfo {
    cuenta: string;
    simbolo?: string;
}

// 🔥 ACTUALIZADO: Sin usar la palabra prohibida 'any' 🔥
interface ScanResultData {
    exito: boolean;
    mensaje?: string;
    cuentasDetectadas: number;
    solRecuperable: string;
    // Le decimos a TypeScript: "Puede ser un texto simple, O el objeto nuevo"
    direccionesBasura: (string | TokenBasuraInfo)[]; 
}

const InnerTrashSweeper: React.FC<TrashSweeperProps> = ({ setGlobalScore }) => {
    const { user } = useAuth();
    const { publicKey, signTransaction } = useWallet();
    
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const [walletInput, setWalletInput] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [copied, setCopied] = useState(false); 
    
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlUnlocked = params.get('unlocked');
        const urlWallet = params.get('wallet');

        if (urlUnlocked === 'true') {
            setIsUnlocked(true); 
        }
        if (urlWallet) {
            setWalletInput(urlWallet); 
        }
    }, []);

    useEffect(() => {
        if (scanResult && scanResult.direccionesBasura) {
            // Extraemos solo las direcciones para los checkboxes (soportando el formato viejo y el nuevo)
            const addresses = scanResult.direccionesBasura.map(item => 
                typeof item === 'string' ? item : item.cuenta
            );
            setSelectedAccounts(addresses);
        }
    }, [scanResult]);

    const BACKEND_URL = "https://gem-nova-api.onrender.com";

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

    const handleUnlock = () => {
        if (!window.confirm("⚠️ Pay 100,000 Points to unlock the cleaner?")) return;
        setGlobalScore(prev => prev - 100000);
        setIsUnlocked(true);
    };

    const toggleAccount = (address: string) => {
        setSelectedAccounts(prev => 
            prev.includes(address) 
                ? prev.filter(acc => acc !== address) 
                : [...prev, address] 
        );
    };

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
                    userId: user.id,
                    cuentasAQuemar: selectedAccounts 
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

            alert(`🎉 SUCCESS! Swept ${selectedAccounts.length} accounts. Check your wallet!`);
            setScanResult(null);
            setWalletInput("");

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Transaction failed.");
        } finally {
            setLoading(false);
        }
    };

    const magicUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}${window.location.pathname}?unlocked=true&wallet=${walletInput}`
        : '';

    const openPhantom = () => {
        const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(magicUrl)}`;
        const win = window as unknown as { Telegram?: { WebApp?: { openLink?: (url: string) => void } } };
        const tg = win.Telegram?.WebApp;
        if (tg && typeof tg.openLink === 'function') tg.openLink(phantomUrl);
        else window.location.href = phantomUrl;
    };

    const openSolflare = () => {
        const solflareUrl = `https://solflare.com/ul/v1/browse/${encodeURIComponent(magicUrl)}`;
        const win = window as unknown as { Telegram?: { WebApp?: { openLink?: (url: string) => void } } };
        const tg = win.Telegram?.WebApp;
        if (tg && typeof tg.openLink === 'function') tg.openLink(solflareUrl);
        else window.location.href = solflareUrl;
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(magicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); 
    };

    const truncateAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

    const dynamicSolRecuperable = (selectedAccounts.length * 0.002039).toFixed(4);

    return (
        <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}>
            <div style={{ background: 'rgba(0, 242, 254, 0.1)', display: 'inline-block', padding: '15px', borderRadius: '50%', marginBottom: '15px', border: '1px solid #00F2FE', boxShadow: '0 0 20px rgba(0,242,254,0.3)' }}>
                <Trash2 size={40} color="#00F2FE" />
            </div>
            
            <h2 style={{ fontSize: '28px', margin: '0 0 10px 0', textShadow: '0 0 10px rgba(0,242,254,0.5)' }}>SOLANA SWEEPER</h2>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>
                Detect dead tokens in any wallet and recover the trapped SOL.
            </p>

            {!scanResult && (
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '15px', border: '1px solid #333', marginBottom: '20px' }}>
                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px', textAlign: 'left' }}>Enter Solana Wallet Address:</p>
                    <input 
                        type="text" 
                        placeholder="Paste wallet address here..."
                        value={walletInput}
                        onChange={(e) => setWalletInput(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #555', background: '#111', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }}
                    />
                    <button 
                        onClick={handleScan} 
                        disabled={loading || !walletInput}
                        style={{ width: '100%', padding: '15px', borderRadius: '30px', border: 'none', background: loading ? '#555' : '#00F2FE', color: '#000', fontWeight: '900', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                        {loading ? "SCANNING..." : <><Search size={18} /> SCAN BLOCKCHAIN</>}
                    </button>
                </div>
            )}

            {scanResult && (
                <div style={{ background: 'rgba(255, 81, 47, 0.1)', padding: '20px', borderRadius: '15px', border: '1px solid #FF512F', animation: 'fadeIn 0.5s' }}>
                    {scanResult.cuentasDetectadas > 0 ? (
                        <>
                            <h3 style={{ margin: '0 0 10px 0', color: '#FF512F' }}>⚠️ {scanResult.cuentasDetectadas} Dead Tokens Found!</h3>
                            
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: '#aaa' }}>Selected to Burn:</span>
                                <span style={{ fontWeight: 'bold' }}>{selectedAccounts.length} / {scanResult.cuentasDetectadas}</span>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <span style={{ color: '#aaa' }}>Total Locked SOL:</span>
                                <span style={{ fontWeight: 'bold', color: '#14F195' }}>~{dynamicSolRecuperable} SOL</span>
                            </div>

                            {/* 🔥 LA LISTA MEJORADA CON NOMBRES DE TOKENS 🔥 */}
                            <div style={{ background: '#111', border: '1px solid #333', borderRadius: '10px', padding: '10px', marginBottom: '20px', maxHeight: '180px', overflowY: 'auto', textAlign: 'left' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #444', paddingBottom: '5px', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#888' }}>Token / Symbol</span>
                                    <span style={{ fontSize: '11px', color: '#888' }}>Account Addr.</span>
                                </div>

                                {scanResult.direccionesBasura.map((item, idx) => {
                                    // Soportamos el backend viejo (string) y el nuevo (objeto)
                                    const cuenta = typeof item === 'string' ? item : item.cuenta;
                                    const simbolo = typeof item === 'string' ? 'Unknown Token' : (item.simbolo || 'Unknown Token');
                                    
                                    return (
                                        <label key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedAccounts.includes(cuenta)}
                                                    onChange={() => toggleAccount(cuenta)}
                                                    style={{ width: '16px', height: '16px', accentColor: '#FF512F', cursor: 'pointer' }}
                                                />
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: selectedAccounts.includes(cuenta) ? '#fff' : '#666' }}>
                                                    <Coins size={14} color={selectedAccounts.includes(cuenta) ? '#FFD700' : '#555'} />
                                                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{simbolo}</span>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '11px', color: selectedAccounts.includes(cuenta) ? '#aaa' : '#444', fontFamily: 'monospace' }}>
                                                {truncateAddress(cuenta)}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            {!isUnlocked ? (
                                <div style={{ background: '#222', padding: '15px', borderRadius: '15px', border: '1px dashed #FFD700' }}>
                                    <Lock size={30} color="#FFD700" style={{ margin: '0 auto 10px auto' }} />
                                    <p style={{ fontSize: '12px', color: '#aaa', margin: '0 0 15px 0' }}>Cleaning is locked. Pay with your in-game points to unlock.</p>
                                    <button 
                                        onClick={handleUnlock}
                                        style={{ width: '100%', padding: '12px', borderRadius: '30px', border: 'none', background: '#FFD700', color: '#000', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    >
                                        <Unlock size={16} /> UNLOCK SWEEPER (100k Pts)
                                    </button>
                                </div>
                            ) : (
                                <div style={{ animation: 'fadeIn 0.5s' }}>
                                    <div style={{ background: 'rgba(76, 175, 80, 0.1)', padding: '10px', borderRadius: '10px', border: '1px solid #4CAF50', marginBottom: '15px', color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>
                                        ✅ Unlocked! Connect to clean:
                                    </div>
                                    
                                    {!publicKey ? (
                                        <div style={{ marginBottom: '15px' }}>
                                            <WalletMultiButton style={{ background: 'linear-gradient(90deg, #9945FF, #14F195)', borderRadius: '30px', margin: '0 auto', width: '100%', justifyContent: 'center' }} />
                                            
                                            <div style={{ margin: '20px 0 10px 0', borderBottom: '1px dashed #444' }}></div>
                                            <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>Playing on Mobile? Open app directly:</p>
                                            
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
                                                <button onClick={openPhantom} style={{ background: '#551BF9', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>👻 PHANTOM</button>
                                                <button onClick={openSolflare} style={{ background: '#FC7A1E', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>🔥 SOLFLARE</button>
                                            </div>

                                            <div style={{ background: '#111', border: '1px solid #333', borderRadius: '10px', padding: '10px', textAlign: 'left' }}>
                                                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px 0' }}>Or copy link and paste in your Wallet Browser:</p>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <input type="text" value={magicUrl} readOnly style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#aaa', fontSize: '10px' }} />
                                                    <button onClick={handleCopyLink} style={{ background: copied ? '#4CAF50' : '#333', color: '#fff', border: 'none', borderRadius: '5px', padding: '0 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: '0.3s' }}>
                                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleSweep}
                                            disabled={loading || selectedAccounts.length === 0}
                                            style={{ width: '100%', padding: '15px', borderRadius: '30px', border: 'none', background: (loading || selectedAccounts.length === 0) ? '#555' : 'linear-gradient(90deg, #FF512F, #DD2476)', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: (loading || selectedAccounts.length === 0) ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 20px rgba(255,81,47,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
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