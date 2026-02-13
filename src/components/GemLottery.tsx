import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
// 🔥 IMPORTANTE: Hook para pagos reales
import { useTonConnectUI } from '@tonconnect/ui-react'; 
import { X, Trophy, Timer, History, AlertCircle, CheckCircle2, Hash, Ticket, Wallet, Save, Crown, Frown } from 'lucide-react';

// Si instalaste 'canvas-confetti', descomenta esta línea. 
// Si no, el código abajo tiene un try/catch para que no falle.
import confetti from 'canvas-confetti'; 

// --- CONFIGURACIÓN DE LA WALLET DEL ADMIN (PARA RECIBIR PAGOS) ---
const ADMIN_WALLET = "UQD7qJo2-AYe7ehX9_nEk4FutxnmbdiSx3aLlwlB9nENZ43q"; 

// --- INTERFACES ---
interface MyTicket {
    code: string;
    date: string;
}

interface LotteryInfo {
    sold: number;
    max: number;
    status: 'active' | 'completed';
    winnerCode: string | null;
}

interface LotteryModalProps {
    onClose: () => void;
    luckyTickets: number;
    setLuckyTickets: React.Dispatch<React.SetStateAction<number>>;
}

// --- COMPONENTE: MODAL DE LOTERÍA ---
export const LotteryModal: React.FC<LotteryModalProps> = ({ onClose, luckyTickets, setLuckyTickets }) => {
    const { user } = useAuth();
    // Hook para interactuar con la wallet
    const [tonConnectUI] = useTonConnectUI();
    
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    
    const [myTickets, setMyTickets] = useState<MyTicket[]>([]); 
    const [soldTotal, setSoldTotal] = useState(0); 
    const [lotteryInfo, setLotteryInfo] = useState<LotteryInfo>({ sold: 0, max: 50, status: 'active', winnerCode: null });
    const [loading, setLoading] = useState(false);

    // --- ESTADOS PARA LUCKY WALLET ---
    const [luckyWalletInput, setLuckyWalletInput] = useState('');
    const [savedLuckyWallet, setSavedLuckyWallet] = useState<string | null>(null);
    const [isSavingWallet, setIsSavingWallet] = useState(false);

    const MAX_TICKETS_GLOBAL = 50;
    const PRIZE_POOL = 15; 

    // 🔥 FUNCIÓN DE CARGA DE DATOS
    const fetchLotteryData = async () => {
        if (!user) return;
        
        // 1. Obtener MIS boletos
        const { data: userTickets } = await supabase.rpc('get_my_lottery_tickets', { p_user_id: user.id });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (userTickets && (userTickets as any).tickets) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setMyTickets((userTickets as any).tickets);
        }

        // 2. Obtener el total vendido y estado (Usando la función corregida)
        const { data: statusData, error } = await supabase.rpc('get_lottery_status', { p_round: 1 });
        
        if (error) console.error("Error status:", error);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = statusData as any;

        if (status) {
            setSoldTotal(status.sold || 0); // Actualiza la barra
            setLotteryInfo({
                sold: status.sold || 0,
                max: 50,
                status: status.status || 'active',
                winnerCode: status.winner || null
            });
        }

        // 3. Obtener Lucky Wallet guardada
        const { data: userData } = await supabase
            .from('user_score')
            .select('lucky_wallet')
            .eq('user_id', user.id)
            .single();
        
        if (userData && userData.lucky_wallet) {
            setSavedLuckyWallet(userData.lucky_wallet);
            setLuckyWalletInput(userData.lucky_wallet); 
        }
    };

    // Carga inicial y Polling
    useEffect(() => {
        fetchLotteryData();
        const interval = setInterval(fetchLotteryData, 5000); 
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Efecto Confeti
    useEffect(() => {
        const didIWin = myTickets.some(t => t.code === lotteryInfo.winnerCode);
        if (lotteryInfo.status === 'completed' && didIWin && activeTab === 'active') {
            try { 
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); 
            } catch(e) {
                console.warn("Confetti effect failed or library missing", e);
            }
        }
    }, [lotteryInfo, myTickets, activeTab]);

    // --- GUARDAR WALLET ---
    const handleSaveWallet = async () => {
        if (!user || isSavingWallet) return;
        if (luckyWalletInput.length < 20) {
            alert("⚠️ Please enter a valid TON wallet address.");
            return;
        }
        setIsSavingWallet(true);
        const { error } = await supabase.rpc('set_lucky_wallet', { 
            p_user_id: user.id, 
            p_wallet: luckyWalletInput 
        });

        if (!error) {
            setSavedLuckyWallet(luckyWalletInput);
            alert("✅ Reward Wallet Saved Successfully!");
        } else {
            console.error("Save wallet error:", error); // Log para evitar 'unused var'
            alert("Error saving wallet.");
        }
        setIsSavingWallet(false);
    };

    // 🔥 LÓGICA DE COMPRA CON PAGO REAL 🔥
    const handleBuyTicket = async (ticketSlot: number) => {
        if (!user || loading) return;
        
        if (soldTotal >= MAX_TICKETS_GLOBAL) {
            alert("⛔ SOLD OUT! Waiting for the draw...");
            return;
        }

        // Validación: Necesitamos una wallet para enviar el premio si gana
        const walletToSend = savedLuckyWallet || tonConnectUI.wallet?.account.address;
        if (!walletToSend) {
            alert("⚠️ Please connect your wallet OR save your Reward Wallet address below first!");
            return;
        }

        setLoading(true);

        try {
            let costType = 'ton';
            let costAmount = 0; // Costo en Lucky Tickets
            let burnAmount = 0; // Descuento en Lucky Tickets
            let tonAmount = 0;  // Costo en TON real
            let txHash = null;  // Recibo de la transacción

            if (ticketSlot === 1) {
                // TICKET 1: Paga con Lucky Ticket (Gratis en TON)
                costType = 'lucky_ticket';
                costAmount = 1;
                
                if (luckyTickets < 1) {
                    alert("❌ Insufficient Lucky Tickets! Watch ads to earn more.");
                    setLoading(false);
                    return;
                }
            } else {
                // TICKET 2 y 3: Paga con TON Real
                costType = 'ton'; 
                const basePrice = 0.50;
                const discountPrice = 0.25;
                const ticketsNeededForDiscount = 2;

                let finalPrice = basePrice;
                let userWantsDiscount = false;

                // Ofrecer descuento si tiene tickets
                if (luckyTickets >= ticketsNeededForDiscount) {
                    userWantsDiscount = window.confirm(
                        `🔥 DISCOUNT AVAILABLE!\n\nPay only ${discountPrice} TON instead of ${basePrice} TON?\n\nCost: Burn ${ticketsNeededForDiscount} Lucky Tickets.`
                    );
                    if (userWantsDiscount) {
                        finalPrice = discountPrice;
                        burnAmount = ticketsNeededForDiscount; 
                    }
                }

                const confirmPurchase = window.confirm(`💸 CONFIRM PURCHASE\n\nBuy Ticket #${ticketSlot} for ${finalPrice} TON?`);
                if (!confirmPurchase) {
                    setLoading(false);
                    return;
                }
                
                tonAmount = finalPrice; // Definimos cuánto cobrar
            }

            // --- PROCESAR PAGO EN TON (Si aplica) ---
            if (tonAmount > 0) {
                if (!tonConnectUI.connected) {
                    alert("👛 Please connect your wallet to pay.");
                    setLoading(false);
                    return;
                }

                // 1 TON = 1,000,000,000 NanoTON
                const nanoTonAmount = (tonAmount * 1000000000).toFixed(0);

                const transaction = {
                    validUntil: Math.floor(Date.now() / 1000) + 600, // 10 min validez
                    messages: [
                        {
                            address: ADMIN_WALLET,
                            amount: nanoTonAmount,
                        },
                    ],
                };

                try {
                    // Enviamos la transacción a la wallet del usuario
                    const result = await tonConnectUI.sendTransaction(transaction);
                    
                    // Si llegamos aquí, el usuario firmó y envió. Guardamos el Hash (boc).
                    txHash = result.boc;
                } catch (txError) {
                    console.error("Payment failed/cancelled", txError);
                    alert("❌ Payment Cancelled.");
                    setLoading(false);
                    return; // Detenemos todo si no pagó
                }
            }

            // --- REGISTRAR EN BASE DE DATOS ---
            // Enviamos el hash (p_tx_hash) para verificación
            const { data, error } = await supabase.rpc('buy_lottery_ticket', { 
                p_user_id: user.id, 
                p_cost_type: costType, 
                p_cost_amount: costAmount,
                p_burn_amount: burnAmount,
                p_wallet_address: walletToSend,
                p_tx_hash: txHash, // Enviamos el recibo
                p_ton_amount: tonAmount // 🔥 AQUÍ AGREGAMOS EL MONTO (0, 0.25 o 0.50)
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = data as any;

            if (!error && result.success) {
                // Actualizar visualmente los tickets gastados
                const totalTicketsSpent = costAmount + burnAmount;
                if (totalTicketsSpent > 0) {
                    setLuckyTickets((prev: number) => Math.max(0, prev - totalTicketsSpent));
                }
                
                await fetchLotteryData(); 
                alert(`🎟️ SUCCESS!\n\nTicket Assigned: ${result.ticket_code}\nGood luck!`);
            } else {
                alert("❌ Database Error: " + (result?.message || error?.message || "Transaction failed"));
            }

        } catch (e) {
            console.error(e);
            alert("Unexpected error");
        }
        setLoading(false);
    };

    const myEntriesCount = myTickets.length;
    const isCompleted = lotteryInfo.status === 'completed';
    const winningTicket = lotteryInfo.winnerCode;
    const iWon = isCompleted && myTickets.some(t => t.code === winningTicket);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 6000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth:'400px', maxHeight: '90vh', overflowY: 'auto', border: iWon ? '2px solid #FFD700' : '1px solid #FFD700', position: 'relative', padding:'0', background: '#111' }}>
                
                {/* Header */}
                <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(255,215,0,0.1), transparent)' }}>
                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                        <Trophy size={20} color={iWon ? "#FFD700" : "#FFD700"} />
                        <span style={{ fontWeight: 'bold', color: iWon ? "#FFD700" : '#FFD700' }}>GEM LOTTERY</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa' }}><X /></button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                    <button onClick={() => setActiveTab('active')} style={{ flex: 1, padding: '12px', background: activeTab === 'active' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'active' ? '#fff' : '#555', fontWeight: 'bold', borderBottom: activeTab === 'active' ? '2px solid #FFD700' : 'none' }}>ACTIVE ROUND</button>
                    <button onClick={() => setActiveTab('history')} style={{ flex: 1, padding: '12px', background: activeTab === 'history' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'history' ? '#fff' : '#555', fontWeight: 'bold', borderBottom: activeTab === 'history' ? '2px solid #FFD700' : 'none' }}>HISTORY</button>
                </div>

                <div style={{ padding: '20px' }}>
                    {activeTab === 'active' ? (
                        <>
                            {isCompleted ? (
                                <div style={{textAlign:'center', padding:'20px 0'}}>
                                    {iWon ? (
                                        <div className="winner-animation">
                                            <Crown size={60} color="#FFD700" style={{marginBottom:'10px', filter:'drop-shadow(0 0 10px gold)'}}/>
                                            <h2 style={{color:'#FFD700', fontSize:'28px', margin:'0 0 10px 0'}}>YOU WON!</h2>
                                            <p style={{color:'#fff', marginBottom:'20px'}}>Congratulations! Prize sent to your wallet within 48h.</p>
                                            <div style={{background:'rgba(255,215,0,0.2)', padding:'15px', borderRadius:'10px', border:'1px solid #FFD700', display:'inline-block'}}>
                                                Winning Ticket: <span style={{fontWeight:'bold', fontSize:'18px'}}>{winningTicket}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Frown size={50} color="#555" style={{marginBottom:'10px'}}/>
                                            <h2 style={{color:'#fff', fontSize:'22px', margin:'0 0 5px 0'}}>ROUND ENDED</h2>
                                            <p style={{color:'#aaa', fontSize:'12px', marginBottom:'20px'}}>Unfortunately, you didn't win this time.</p>
                                            <div style={{background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'10px', marginBottom:'20px'}}>
                                                Winning Ticket: <span style={{color:'#FFD700', fontWeight:'bold'}}>{winningTicket}</span>
                                            </div>
                                            <p style={{color:'#4CAF50', fontSize:'12px'}}>Better luck in Round #2!</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* PRIZE CARD */}
                                    <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                                        <div style={{ fontSize: '12px', color: '#aaa', letterSpacing: '2px', marginBottom: '5px' }}>ROUND #1 PRIZE POOL</div>
                                        <div style={{ fontSize: '42px', fontWeight: '900', color: '#fff', textShadow: '0 0 20px #FFD700' }}>{PRIZE_POOL} TON</div>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#333', padding: '4px 10px', borderRadius: '15px', marginTop: '10px' }}>
                                            <Timer size={12} color="#aaa" />
                                            <span style={{ fontSize: '10px', color: '#fff' }}>Ends when 50 tickets sold</span>
                                        </div>
                                    </div>

                                    {/* PROGRESS BAR */}
                                    <div style={{ marginBottom: '30px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px', color: '#aaa' }}>
                                            <span>Tickets Sold</span>
                                            <span style={{ color: '#FFD700' }}>{soldTotal}/{MAX_TICKETS_GLOBAL}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: '#222', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${(soldTotal / MAX_TICKETS_GLOBAL) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #FFD700, #FFA500)' }}></div>
                                        </div>
                                        {soldTotal >= 45 && <div style={{ fontSize: '10px', color: '#FF512F', marginTop: '5px', display:'flex', alignItems:'center', gap:'4px' }}><AlertCircle size={10}/> ALMOST SOLD OUT!</div>}
                                    </div>

                                    {/* BUY SECTION */}
                                    <h4 style={{ color: '#fff', marginBottom: '15px' }}>YOUR ENTRIES ({myEntriesCount}/3)</h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <TicketRow number={1} priceLabel="1 Lucky Ticket" priceColor="#00F2FE" isOwned={myEntriesCount >= 1} ticketCode={myTickets[0]?.code} onBuy={() => handleBuyTicket(1)} disabled={loading} />
                                        <TicketRow number={2} priceLabel="0.50 TON" priceColor="#FFD700" isOwned={myEntriesCount >= 2} ticketCode={myTickets[1]?.code} onBuy={() => handleBuyTicket(2)} disabled={loading || myEntriesCount < 1} />
                                        <TicketRow number={3} priceLabel="0.50 TON" priceColor="#FFD700" isOwned={myEntriesCount >= 3} ticketCode={myTickets[2]?.code} onBuy={() => handleBuyTicket(3)} disabled={loading || myEntriesCount < 2} />
                                    </div>

                                    {/* LUCKY WALLET REWARD */}
                                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #333' }}>
                                        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px'}}>
                                            <Wallet size={16} color="#E040FB" />
                                            <span style={{fontSize:'12px', fontWeight:'bold', color:'#fff'}}>REWARD WALLET</span>
                                        </div>
                                        <p style={{fontSize:'10px', color:'#aaa', marginBottom:'10px'}}>
                                            Add your TON wallet address here to receive the prize if you win! 
                                        </p>
                                        
                                        <div style={{display:'flex', gap:'5px'}}>
                                            <input 
                                                type="text" 
                                                placeholder="Paste your UQ... wallet address"
                                                value={luckyWalletInput}
                                                onChange={(e) => setLuckyWalletInput(e.target.value)}
                                                style={{
                                                    flex: 1, padding: '10px', borderRadius: '8px', 
                                                    border: '1px solid #333', background: '#222', color: '#fff', fontSize: '11px', outline:'none'
                                                }}
                                            />
                                            <button 
                                                onClick={handleSaveWallet}
                                                disabled={isSavingWallet}
                                                className="btn-cyber"
                                                style={{padding:'0 15px', color:'#E040FB', borderColor:'#E040FB', background: savedLuckyWallet === luckyWalletInput && savedLuckyWallet !== '' ? 'rgba(224, 64, 251, 0.1)' : 'transparent'}}
                                            >
                                                {isSavingWallet ? '...' : (savedLuckyWallet === luckyWalletInput && savedLuckyWallet !== '' ? <CheckCircle2 size={16}/> : <Save size={16}/>)}
                                            </button>
                                        </div>
                                        {savedLuckyWallet && (
                                            <div style={{fontSize:'9px', color:'#4CAF50', marginTop:'5px', display:'flex', alignItems:'center', gap:'4px'}}>
                                                <CheckCircle2 size={10}/> Wallet saved securely for rewards.
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#555', marginTop: '20px' }}>
                            <div style={{background: 'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'10px', marginBottom:'20px', border:'1px solid #333'}}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                                    <span style={{color:'#aaa', fontSize:'12px'}}>ROUND #0 (Demo)</span>
                                    <span style={{color:'#FF512F', fontSize:'12px', fontWeight:'bold'}}>EXPIRED</span>
                                </div>
                                <div style={{display:'flex', alignItems:'center', gap:'10px', opacity:0.6}}>
                                    <Ticket size={20} color="#555"/>
                                    <span style={{color:'#fff', fontWeight:'bold'}}>#T-000</span>
                                </div>
                                <div style={{marginTop:'10px', fontSize:'12px', color:'#aaa'}}>
                                    Result: Not Winning
                                </div>
                            </div>
                            <div style={{color:'#888', fontSize:'14px', fontStyle:'italic'}}>
                                <History size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>
                                "Good luck next time! 🍀"
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente auxiliar local
const TicketRow = ({ number, priceLabel, priceColor, isOwned, ticketCode, onBuy, disabled }: { number: number, priceLabel: string, priceColor: string, isOwned: boolean, ticketCode?: string, onBuy: () => void, disabled: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: isOwned ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.05)', borderRadius: '10px', border: isOwned ? '1px solid #4CAF50' : '1px solid #333', opacity: disabled && !isOwned ? 0.5 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isOwned ? '#4CAF50' : '#333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{number}</div>
            <div>
                <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                    {isOwned ? <span style={{color:'#4CAF50'}}>ACTIVE TICKET</span> : `Entry Ticket #${number}`}
                </div>
                <div style={{ color: '#aaa', fontSize: '10px' }}>
                    {isOwned ? (
                        <span style={{display:'flex', alignItems:'center', gap:'4px', color:'#fff'}}>
                            <Hash size={10}/> Code: <span style={{color:'#FFD700', fontWeight:'bold', fontSize:'14px'}}>{ticketCode || "Generating..."}</span>
                        </span>
                    ) : (
                        <>Cost: <span style={{ color: priceColor }}>{priceLabel}</span></>
                    )}
                </div>
            </div>
        </div>
        {isOwned ? <CheckCircle2 color="#4CAF50" size={20} /> : (
            <button onClick={onBuy} disabled={disabled} style={{ background: disabled ? '#555' : priceColor === '#FFD700' ? '#FFD700' : '#00F2FE', border: 'none', borderRadius: '5px', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', cursor: disabled ? 'not-allowed' : 'pointer', color:'#000' }}>
                {disabled ? '...' : 'BUY'}
            </button>
        )}
    </div>
);