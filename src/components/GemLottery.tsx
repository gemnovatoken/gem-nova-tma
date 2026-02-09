import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
// Agregamos Wallet y Save a los iconos
import { X, Trophy, Timer, History, AlertCircle, CheckCircle2, Hash, Ticket, Wallet, Save } from 'lucide-react';

// --- INTERFACES ---
interface MyTicket {
    code: string;
    date: string;
}

interface LotteryModalProps {
    onClose: () => void;
    luckyTickets: number;
    setLuckyTickets: React.Dispatch<React.SetStateAction<number>>;
}

// --- COMPONENTE: MODAL DE LOTERÍA ---
export const LotteryModal: React.FC<LotteryModalProps> = ({ onClose, luckyTickets, setLuckyTickets }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    
    // Array de tickets reales
    const [myTickets, setMyTickets] = useState<MyTicket[]>([]); 
    const [soldTotal, setSoldTotal] = useState(0); 
    const [loading, setLoading] = useState(false);

    // --- NUEVOS ESTADOS PARA LUCKY WALLET ---
    const [luckyWalletInput, setLuckyWalletInput] = useState('');
    const [savedLuckyWallet, setSavedLuckyWallet] = useState<string | null>(null);
    const [isSavingWallet, setIsSavingWallet] = useState(false);

    const MAX_TICKETS_GLOBAL = 50;
    const PRIZE_POOL = 15; 

    // 🔥 FUNCIÓN DE CARGA DE DATOS
    const fetchLotteryData = async () => {
        if (!user) return;
        
        // 1. Obtener mis boletos comprados desde la DB
        const { data } = await supabase.rpc('get_my_lottery_tickets', { p_user_id: user.id });
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (data && (data as any).tickets) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setMyTickets((data as any).tickets);
        }

        // 2. Obtener total vendidos
        const { count } = await supabase.from('lottery_entries').select('*', { count: 'exact', head: true }).eq('round_number', 1);
        if (count !== null) setSoldTotal(count);

        // 3. 🔥 OBTENER LUCKY WALLET GUARDADA 🔥
        const { data: userData } = await supabase
            .from('user_score')
            .select('lucky_wallet')
            .eq('user_id', user.id)
            .single();
        
        if (userData && userData.lucky_wallet) {
            setSavedLuckyWallet(userData.lucky_wallet);
            setLuckyWalletInput(userData.lucky_wallet); // Pre-llenar input
        }
    };

    // Carga inicial
    useEffect(() => {
        fetchLotteryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // --- NUEVA FUNCIÓN: GUARDAR WALLET ---
    const handleSaveWallet = async () => {
        if (!user || isSavingWallet) return;
        
        // Validación básica de longitud de wallet TON
        if (luckyWalletInput.length < 20) {
            alert("⚠️ Please enter a valid TON wallet address.");
            return;
        }

        setIsSavingWallet(true);
        
        // Llamamos al RPC que creamos en el paso anterior
        const { error } = await supabase.rpc('set_lucky_wallet', { 
            p_user_id: user.id, 
            p_wallet: luckyWalletInput 
        });

        if (!error) {
            setSavedLuckyWallet(luckyWalletInput);
            alert("✅ Reward Wallet Saved Successfully!");
        } else {
            console.error(error);
            alert("Error saving wallet.");
        }
        setIsSavingWallet(false);
    };

    const handleBuyTicket = async (ticketSlot: number) => {
        if (!user || loading) return;
        setLoading(true);

        try {
            // Si no ha guardado wallet, advertimos (opcional, pero recomendado)
            if (!savedLuckyWallet && luckyWalletInput.length < 20) {
                const proceed = window.confirm("⚠️ You haven't saved a Reward Wallet yet.\n\nWe need it to send you the prize if you win.\n\nDo you want to proceed anyway?");
                if (!proceed) {
                    setLoading(false);
                    return;
                }
            }

            let costType = 'ton';
            let costAmount = 0;
            let burnAmount = 0; // Tickets extra a quemar por descuento

            if (ticketSlot === 1) {
                // TICKET 1: Cuesta 1 Lucky Ticket
                costType = 'lucky_ticket';
                costAmount = 1;
                
                if (luckyTickets < 1) {
                    alert("❌ Insufficient Lucky Tickets! Watch ads to earn more.");
                    setLoading(false);
                    return;
                }
            } else {
                // TICKET 2 y 3: Cuesta TON (Con Descuento Opcional)
                const basePrice = 0.50;
                const discountPrice = 0.25;
                const ticketsNeededForDiscount = 2;

                let finalPrice = basePrice;
                let userWantsDiscount = false;

                // Si tiene tickets suficientes, ofrecer descuento
                if (luckyTickets >= ticketsNeededForDiscount) {
                    userWantsDiscount = window.confirm(
                        `🔥 DISCOUNT AVAILABLE!\n\nPay only ${discountPrice} TON instead of ${basePrice} TON?\n\nCost: Burn ${ticketsNeededForDiscount} Lucky Tickets.`
                    );
                    if (userWantsDiscount) {
                        finalPrice = discountPrice;
                        burnAmount = ticketsNeededForDiscount; // Aquí definimos que se restarán 2 tickets
                    }
                }

                const confirmPurchase = window.confirm(`💸 CONFIRM PURCHASE\n\nBuy Ticket #${ticketSlot} for ${finalPrice} TON?`);
                if (!confirmPurchase) {
                    setLoading(false);
                    return;
                }
                
                // Simulación de transacción blockchain
                await new Promise(r => setTimeout(r, 1000)); 
            }

            // Usamos la wallet guardada o el input actual o 'not_provided'
            const walletToSend = savedLuckyWallet || luckyWalletInput || 'not_provided';

            // LLAMADA A SUPABASE
            const { data, error } = await supabase.rpc('buy_lottery_ticket', { 
                p_user_id: user.id, 
                p_cost_type: costType, 
                p_cost_amount: costAmount,
                p_burn_amount: burnAmount,
                p_wallet_address: walletToSend // Enviamos la wallet
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = data as any;

            if (!error && result.success) {
                // Actualizar visualmente los tickets gastados
                const totalTicketsSpent = costAmount + burnAmount;
                if (totalTicketsSpent > 0) {
                    setLuckyTickets((prev: number) => Math.max(0, prev - totalTicketsSpent));
                }
                
                await fetchLotteryData(); // Recargar para ver el código
                alert(`🎟️ SUCCESS!\n\nTicket Assigned: ${result.ticket_code}\nGood luck!`);
            } else {
                alert("❌ Error: " + (result?.message || error?.message || "Transaction failed"));
            }

        } catch (e) {
            console.error(e);
            alert("Unexpected error");
        }
        setLoading(false);
    };

    const myEntriesCount = myTickets.length;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 6000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth:'400px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #FFD700', position: 'relative', padding:'0', background: '#111' }}>
                
                {/* Header */}
                <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(255,215,0,0.1), transparent)' }}>
                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                        <Trophy size={20} color="#FFD700" />
                        <span style={{ fontWeight: 'bold', color: '#FFD700' }}>GEM LOTTERY</span>
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

                            {/* 🔥 NUEVA SECCIÓN: LUCKY WALLET REWARD 🔥 */}
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
                    ) : (
                        <div style={{ textAlign: 'center', color: '#555', marginTop: '20px' }}>
                            {/* EJEMPLO DE CÓMO SE VERÍA UN TICKET EXPIRADO */}
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
                BUY
            </button>
        )}
    </div>
);