import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { X, Trophy, Timer, History, AlertCircle, CheckCircle2, Hash } from 'lucide-react';

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
    
    const [myTickets, setMyTickets] = useState<MyTicket[]>([]); 
    const [soldTotal, setSoldTotal] = useState(0); 
    const [loading, setLoading] = useState(false);

    const MAX_TICKETS_GLOBAL = 50;
    const PRIZE_POOL = 15; 

    // Función para recargar datos desde la DB
    const fetchLotteryData = async () => {
        if (!user) return;
        
        const { data } = await supabase.rpc('get_my_lottery_tickets', { p_user_id: user.id });
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (data && (data as any).tickets) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setMyTickets((data as any).tickets);
        }

        const { count } = await supabase.from('lottery_entries').select('*', { count: 'exact', head: true }).eq('round_number', 1);
        if (count !== null) setSoldTotal(count);
    };

    // Carga inicial
    useEffect(() => {
        fetchLotteryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleBuyTicket = async (ticketSlot: number) => {
        if (!user || loading) return;
        setLoading(true);

        try {
            let costType = 'ton';
            let costAmount = 0;

            if (ticketSlot === 1) {
                costType = 'lucky_ticket';
                costAmount = 1;
                
                if (luckyTickets < 1) {
                    alert("❌ Insufficient Lucky Tickets! Watch ads to earn more.");
                    setLoading(false);
                    return;
                }
            } else {
                const confirm = window.confirm(`💸 Confirm purchase for Ticket #${ticketSlot}?`);
                if (!confirm) {
                    setLoading(false);
                    return;
                }
                await new Promise(r => setTimeout(r, 1000)); 
            }

            const { data, error } = await supabase.rpc('buy_lottery_ticket', { 
                p_user_id: user.id, 
                p_cost_type: costType, 
                p_cost_amount: costAmount 
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = data as any;

            if (!error && result.success) {
                if (costType === 'lucky_ticket') {
                    setLuckyTickets((prev: number) => Math.max(0, prev - costAmount));
                }
                await fetchLotteryData();
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
                
                <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(255,215,0,0.1), transparent)' }}>
                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                        <Trophy size={20} color="#FFD700" />
                        <span style={{ fontWeight: 'bold', color: '#FFD700' }}>GEM LOTTERY</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa' }}><X /></button>
                </div>

                <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                    <button onClick={() => setActiveTab('active')} style={{ flex: 1, padding: '12px', background: activeTab === 'active' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'active' ? '#fff' : '#555', fontWeight: 'bold', borderBottom: activeTab === 'active' ? '2px solid #FFD700' : 'none' }}>ACTIVE ROUND</button>
                    <button onClick={() => setActiveTab('history')} style={{ flex: 1, padding: '12px', background: activeTab === 'history' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'history' ? '#fff' : '#555', fontWeight: 'bold', borderBottom: activeTab === 'history' ? '2px solid #FFD700' : 'none' }}>HISTORY</button>
                </div>

                <div style={{ padding: '20px' }}>
                    {activeTab === 'active' ? (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                                <div style={{ fontSize: '12px', color: '#aaa', letterSpacing: '2px', marginBottom: '5px' }}>ROUND #1 PRIZE POOL</div>
                                <div style={{ fontSize: '42px', fontWeight: '900', color: '#fff', textShadow: '0 0 20px #FFD700' }}>{PRIZE_POOL} TON</div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#333', padding: '4px 10px', borderRadius: '15px', marginTop: '10px' }}>
                                    <Timer size={12} color="#aaa" />
                                    <span style={{ fontSize: '10px', color: '#fff' }}>Ends when 50 tickets sold</span>
                                </div>
                            </div>

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

                            <h4 style={{ color: '#fff', marginBottom: '15px' }}>YOUR ENTRIES ({myEntriesCount}/3)</h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <TicketRow 
                                    number={1} 
                                    priceLabel="1 Lucky Ticket" 
                                    priceColor="#00F2FE" 
                                    isOwned={myEntriesCount >= 1} 
                                    ticketCode={myTickets[0]?.code}
                                    onBuy={() => handleBuyTicket(1)}
                                    disabled={loading}
                                />
                                <TicketRow 
                                    number={2} 
                                    priceLabel="0.50 TON" 
                                    priceColor="#FFD700" 
                                    isOwned={myEntriesCount >= 2} 
                                    ticketCode={myTickets[1]?.code}
                                    onBuy={() => handleBuyTicket(2)}
                                    disabled={loading || myEntriesCount < 1}
                                />
                                <TicketRow 
                                    number={3} 
                                    priceLabel="0.50 TON" 
                                    priceColor="#FFD700" 
                                    isOwned={myEntriesCount >= 3} 
                                    ticketCode={myTickets[2]?.code}
                                    onBuy={() => handleBuyTicket(3)}
                                    disabled={loading || myEntriesCount < 2}
                                />
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#555', marginTop: '50px' }}>
                            <History size={40} />
                            <p>No past lotteries yet.</p>
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
                    {isOwned ? <span style={{color:'#4CAF50'}}>ENTRY CONFIRMED</span> : `Entry Ticket #${number}`}
                </div>
                <div style={{ color: '#aaa', fontSize: '10px' }}>
                    {isOwned ? (
                        <span style={{display:'flex', alignItems:'center', gap:'4px', color:'#fff'}}>
                            <Hash size={10}/> Code: <span style={{color:'#FFD700', fontWeight:'bold'}}>{ticketCode}</span>
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