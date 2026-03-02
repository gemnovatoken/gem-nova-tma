import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { X, Trophy, Timer, History, AlertCircle, CheckCircle2, Hash, Wallet, Save, Crown, Frown } from 'lucide-react';

// Si instalaste 'canvas-confetti', descomenta esta línea. 
// Si no, el código abajo tiene un try/catch para que no falle.
import confetti from 'canvas-confetti'; 

// --- INTERFACES ---
interface MyTicket {
    code?: string; // Mantenemos ambas por si tu RPC devuelve 'code'
    ticket_code?: string; // Y agregamos la columna real de la base de datos
}

interface LotteryInfo {
    sold: number;
    max: number;
    status: 'active' | 'completed';
    winnerCodes: string[];
}

interface LotteryModalProps {
    onClose: () => void;
    luckyTickets: number;
    setLuckyTickets: React.Dispatch<React.SetStateAction<number>>;
    onUpdateScore?: (amountToSubtract: number) => void; 
}

// --- COMPONENTE: MODAL DE LOTERÍA ---
export const LotteryModal: React.FC<LotteryModalProps> = ({ onClose, luckyTickets, setLuckyTickets, onUpdateScore }) => {
    const { user } = useAuth();
    
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    
    const [myTickets, setMyTickets] = useState<MyTicket[]>([]); 
    const [soldTotal, setSoldTotal] = useState(0); 
    const [lotteryInfo, setLotteryInfo] = useState<LotteryInfo>({ sold: 0, max: 75, status: 'active', winnerCodes: [] });
    const [loading, setLoading] = useState(false);

    // --- ESTADOS PARA LUCKY WALLET ---
    const [luckyWalletInput, setLuckyWalletInput] = useState('');
    const [savedLuckyWallet, setSavedLuckyWallet] = useState<string | null>(null);
    const [isSavingWallet, setIsSavingWallet] = useState(false);

    // 🔥 NUEVOS LÍMITES Y PREMIOS 🔥
    const MAX_TICKETS_GLOBAL = 75; 
    const PRIZE_POOL = 10; 

    // 🔥 FUNCIÓN DE CARGA DE DATOS (Memorizada para evitar errores de linting)
    const fetchLotteryData = useCallback(async () => {
        if (!user) return;
        
        // 1. Obtener MIS boletos
        const { data: userTickets } = await supabase.rpc('get_my_lottery_tickets', { p_user_id: user.id });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (userTickets && (userTickets as any).tickets) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setMyTickets((userTickets as any).tickets);
        }

        // 2. Obtener el total vendido y estado
        const { data: statusData, error } = await supabase.rpc('get_lottery_status', { p_round: 1 });
        
        if (error) console.error("Error status:", error);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = statusData as any;

        if (status) {
            setSoldTotal(status.sold || 0); // Actualiza la barra
            setLotteryInfo({
                sold: status.sold || 0,
                max: MAX_TICKETS_GLOBAL,
                status: status.status || 'active',
                winnerCodes: status.winners || (status.winner ? [status.winner] : []) // Soporte para múltiples ganadores
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
    }, [user]);

    // Carga inicial y Polling
    useEffect(() => {
        // Envolver en una función asíncrona dentro del useEffect soluciona el error
        const initFetch = async () => {
            await fetchLotteryData();
        };
        
        initFetch();
        
        const interval = setInterval(() => {
            fetchLotteryData();
        }, 5000); 
        
        return () => clearInterval(interval);
    }, [fetchLotteryData]);
    
    // Efecto Confeti
    useEffect(() => {
        // Adaptado para buscar tanto ticket_code como code
        const didIWin = myTickets.some(t => lotteryInfo.winnerCodes.includes(t.ticket_code || t.code || ''));
        if (lotteryInfo.status === 'completed' && didIWin && activeTab === 'active') {
            try { 
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }); 
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
            console.error("Save wallet error:", error); 
            alert("Error saving wallet.");
        }
        setIsSavingWallet(false);
    };

    // 🔥 LÓGICA DE COMPRA ACTUALIZADA A LA NUEVA BD 🔥
    const handleBuyTicket = async (ticketType: number, ticketCost: number, pointsCost: number) => {
        if (!user || loading) return;
        
        if (soldTotal >= MAX_TICKETS_GLOBAL) {
            alert("⛔ SOLD OUT! Waiting for the draw...");
            return;
        }

        if (!savedLuckyWallet) {
            alert("⚠️ Please save your Reward Wallet address below first so we can send your prize!");
            return;
        }

        if (luckyTickets < ticketCost) {
            alert(`❌ You need ${ticketCost} Lucky Tickets for this entry.\nWatch ads or invite friends to get more!`);
            return;
        }

        const confirmPurchase = window.confirm(`💸 CONFIRM ENTRY\n\nBuy Ticket T-0${ticketType}?\n\nCost:\n- ${ticketCost} Lucky Tickets 🎟️\n- ${pointsCost.toLocaleString()} Points 🪙`);
        if (!confirmPurchase) return;

        setLoading(true);

        try {
            // 🔥 LAMAMOS A TU FUNCIÓN SQL ACTUALIZADA 🔥
            const { data, error } = await supabase.rpc('buy_lottery_ticket', { 
                p_user_id: user.id, 
                p_ticket_type: ticketType, // <-- CORREGIDO: Usando comentarios de JS (//)
                p_round_number: 1          // <-- CORREGIDO: Usando comentarios de JS (//)
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = data as any;

            if (!error && result.success) {
                setLuckyTickets(prev => Math.max(0, prev - ticketCost));
                
                if (onUpdateScore) {
                    onUpdateScore(pointsCost);
                }

                await fetchLotteryData(); 
                alert(`🎟️ SUCCESS!\n\nTicket Assigned!\nGood luck!`);
            } else {
                alert("❌ Transaction Failed: " + (result?.message || error?.message || "Insufficient balance or already owned."));
            }

        } catch (e) {
            console.error(e);
            alert("Unexpected error processing ticket.");
        }
        setLoading(false);
    };

    const isCompleted = lotteryInfo.status === 'completed';
    // Buscar si tenemos el ticket ganador
    const winningTicketObj = myTickets.find(t => lotteryInfo.winnerCodes.includes(t.ticket_code || t.code || ''));
    const winningTicket = winningTicketObj?.ticket_code || winningTicketObj?.code;
    const iWon = isCompleted && !!winningTicket;

    // 🔥 FUNCIONES AUXILIARES ACTUALIZADAS (Usando códigos reales de tu BD) 🔥
    const ownsTicket = (code: string) => myTickets.some(t => t.ticket_code === code || t.code === code);

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
                                            <p style={{color:'#fff', marginBottom:'20px'}}>Congratulations! 5 TON sent to your wallet within 48h.</p>
                                            <div style={{background:'rgba(255,215,0,0.2)', padding:'15px', borderRadius:'10px', border:'1px solid #FFD700', display:'inline-block'}}>
                                                Winning Ticket: <span style={{fontWeight:'bold', fontSize:'18px'}}>{winningTicket}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Frown size={50} color="#555" style={{marginBottom:'10px'}}/>
                                            <h2 style={{color:'#fff', fontSize:'22px', margin:'0 0 5px 0'}}>ROUND ENDED</h2>
                                            <p style={{color:'#aaa', fontSize:'12px', marginBottom:'20px'}}>Unfortunately, you didn't win this time.</p>
                                            <p style={{color:'#4CAF50', fontSize:'12px'}}>Better luck in Round #2!</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* PRIZE CARD */}
                                    <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                                        <div style={{ fontSize: '12px', color: '#aaa', letterSpacing: '2px', marginBottom: '5px' }}>ROUND PRIZE POOL</div>
                                        <div style={{ fontSize: '42px', fontWeight: '900', color: '#fff', textShadow: '0 0 20px #FFD700' }}>{PRIZE_POOL} TON</div>
                                        <div style={{ color: '#FFD700', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>2 WINNERS OF 5 TON EACH</div>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#333', padding: '4px 10px', borderRadius: '15px', marginTop: '10px' }}>
                                            <Timer size={12} color="#aaa" />
                                            <span style={{ fontSize: '10px', color: '#fff' }}>Ends when 75 tickets sold</span>
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
                                        {soldTotal >= 65 && <div style={{ fontSize: '10px', color: '#FF512F', marginTop: '5px', display:'flex', alignItems:'center', gap:'4px' }}><AlertCircle size={10}/> ALMOST SOLD OUT!</div>}
                                    </div>

                                    {/* BUY SECTION (Usando los códigos T-01, T-02, T-03) */}
                                    <h4 style={{ color: '#fff', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                        YOUR ENTRIES ({myTickets.length}/3)
                                        <span style={{color: '#00F2FE', fontSize: '12px'}}>🎟️ {luckyTickets} Avail.</span>
                                    </h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <TicketRow number={1} ticketsReq={2} pointsReq={100000} isOwned={ownsTicket('T-01')} ticketCode={'T-01'} onBuy={() => handleBuyTicket(1, 2, 100000)} disabled={loading} />
                                        <TicketRow number={2} ticketsReq={3} pointsReq={150000} isOwned={ownsTicket('T-02')} ticketCode={'T-02'} onBuy={() => handleBuyTicket(2, 3, 150000)} disabled={loading || !ownsTicket('T-01')} />
                                        <TicketRow number={3} ticketsReq={4} pointsReq={200000} isOwned={ownsTicket('T-03')} ticketCode={'T-03'} onBuy={() => handleBuyTicket(3, 4, 200000)} disabled={loading || !ownsTicket('T-02')} />
                                    </div>

                                    {/* LUCKY WALLET REWARD */}
                                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #333' }}>
                                        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px'}}>
                                            <Wallet size={16} color="#E040FB" />
                                            <span style={{fontSize:'12px', fontWeight:'bold', color:'#fff'}}>REWARD WALLET (REQUIRED)</span>
                                        </div>
                                        <div style={{display:'flex', gap:'5px'}}>
                                            <input 
                                                type="text" 
                                                placeholder="Paste your TON wallet address"
                                                value={luckyWalletInput}
                                                onChange={(e) => setLuckyWalletInput(e.target.value)}
                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '11px', outline:'none' }}
                                            />
                                            <button onClick={handleSaveWallet} disabled={isSavingWallet} className="btn-cyber" style={{padding:'0 15px', color:'#E040FB', borderColor:'#E040FB', background: savedLuckyWallet === luckyWalletInput && savedLuckyWallet !== '' ? 'rgba(224, 64, 251, 0.1)' : 'transparent'}}>
                                                {isSavingWallet ? '...' : (savedLuckyWallet === luckyWalletInput && savedLuckyWallet !== '' ? <CheckCircle2 size={16}/> : <Save size={16}/>)}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#555', marginTop: '20px' }}>
                            <History size={40} style={{margin:'0 auto', marginBottom:'10px', opacity:0.5}} />
                            <div>Past rounds will appear here.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente auxiliar rediseñado para la Doble Moneda
const TicketRow = ({ number, ticketsReq, pointsReq, isOwned, ticketCode, onBuy, disabled }: { number: number, ticketsReq: number, pointsReq: number, isOwned: boolean, ticketCode?: string, onBuy: () => void, disabled: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: isOwned ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.05)', borderRadius: '10px', border: isOwned ? '1px solid #4CAF50' : '1px solid #333', opacity: disabled && !isOwned ? 0.5 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isOwned ? '#4CAF50' : '#333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{number}</div>
            <div>
                <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                    {isOwned ? <span style={{color:'#4CAF50'}}>ACTIVE TICKET</span> : `Entry Ticket #${number}`}
                </div>
                <div style={{ color: '#aaa', fontSize: '10px', marginTop: '4px' }}>
                    {isOwned ? (
                        <span style={{display:'flex', alignItems:'center', gap:'4px', color:'#fff'}}>
                            <Hash size={10}/> Code: <span style={{color:'#FFD700', fontWeight:'bold', fontSize:'14px'}}>{ticketCode}</span>
                        </span>
                    ) : (
                        <div style={{display:'flex', gap:'8px'}}>
                            <span style={{ color: '#00F2FE', fontWeight:'bold', background: 'rgba(0, 242, 254, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>🎟️ {ticketsReq}</span>
                            <span style={{ color: '#FFD700', fontWeight:'bold', background: 'rgba(255, 215, 0, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>🪙 {(pointsReq/1000).toFixed(0)}k</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
        {isOwned ? <CheckCircle2 color="#4CAF50" size={20} /> : (
            <button onClick={onBuy} disabled={disabled} style={{ background: disabled ? '#555' : '#00F2FE', border: 'none', borderRadius: '5px', padding: '10px 15px', fontSize: '12px', fontWeight: 'bold', cursor: disabled ? 'not-allowed' : 'pointer', color:'#000' }}>
                {disabled ? 'LOCKED' : 'BUY'}
            </button>
        )}
    </div>
);