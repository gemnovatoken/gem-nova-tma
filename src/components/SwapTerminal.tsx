import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { RefreshCcw, AlertTriangle, Lock, Unlock, ArrowRightLeft, X } from 'lucide-react';

// MOVIDO AFUERA: Evita re-renders en cascada
const isThisWeek = (dateString: string | null) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    
    // Ajustar para encontrar el lunes de esta semana
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    return date >= monday;
};

export const SwapTerminal = ({ onClose }: { onClose: () => void }) => {
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(false);
    const [canBuy, setCanBuy] = useState(false);
    const [canSell, setCanSell] = useState(false);
    
    // 1. EXTRAEMOS LA CONSULTA (Para que el linter no se enoje)
    const fetchUserData = async (userId: string) => {
        const { data } = await supabase
            .from('user_score')
            .select('last_ticket_buy_date, last_ticket_sell_date')
            .eq('user_id', userId)
            .single();
        return data;
    };

    // 2. FUNCIÓN DE REFRESCO SEGURA (Usando promesas para evitar el setState sincrónico)
    const refreshLocks = () => {
        if (!user) return;
        fetchUserData(user.id).then(data => {
            if (data) {
                setCanBuy(!isThisWeek(data.last_ticket_buy_date));
                setCanSell(!isThisWeek(data.last_ticket_sell_date));
            }
        }).catch(err => console.error(err));
    };

    // 3. EFFECT LIMPIO (Se ejecuta al cargar o cambiar de usuario)
    useEffect(() => {
        refreshLocks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleSwap = async (type: 'buy' | 'sell') => {
        if (!user || loading) return;
        
        const confirmMsg = type === 'buy' 
            ? "💸 Confirm Buy: 75,000 Points for 3 Lucky Tickets?"
            : "⚠️ Confirm Sell: 5 Lucky Tickets for 71,250 Points? (5% Burn Fee applied)";
            
        if (!window.confirm(confirmMsg)) return;

        setLoading(true);
        try {
            const rpcFunction = type === 'buy' ? 'swap_buy_tickets' : 'swap_sell_tickets';
            const { data, error } = await supabase.rpc(rpcFunction, { p_user_id: user.id });
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = data as any;

            if (!error && result.success) {
                alert(`✅ ${result.message}`);
                refreshLocks(); // Recargamos los candados limpiamente
            } else {
                alert(`❌ Failed: ${result?.message || error?.message}`);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        /* FONDO OSCURO FLOTANTE */
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 6000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
            
            {/* LA TARJETA DEL MERCADO NEGRO */}
            <div className="glass-card" style={{ position: 'relative', padding: '20px', background: '#0a0a0a', border: '1px solid #E040FB', borderRadius: '15px', width: '100%', maxWidth: '400px' }}>
                
                {/* BOTÓN DE CERRAR 'X' */}
                <button 
                    onClick={onClose} 
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>

                {/* ENCABEZADO */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
                    <RefreshCcw color="#E040FB" size={24} />
                    <div>
                        <h3 style={{ margin: 0, color: '#E040FB', fontSize: '18px', fontWeight: 'bold' }}>BLACK MARKET</h3>
                        <div style={{ fontSize: '11px', color: '#888' }}>Weekly Swap Terminal</div>
                    </div>
                </div>
            
                {/* SECCIÓN DE COMPRA */}
                <div style={{ background: 'rgba(0, 242, 254, 0.05)', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#aaa', fontWeight: 'bold' }}>BUY TICKETS</div>
                        {canBuy ? <Unlock size={14} color="#4CAF50" /> : <Lock size={14} color="#F44336" />}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '16px' }}>75k 🪙</div>
                        <ArrowRightLeft size={16} color="#555" />
                        <div style={{ color: '#00F2FE', fontWeight: 'bold', fontSize: '16px' }}>3 🎟️</div>
                    </div>

                    <button 
                        onClick={() => handleSwap('buy')} 
                        disabled={!canBuy || loading}
                        style={{ width: '100%', padding: '10px', background: canBuy ? '#00F2FE' : '#333', color: canBuy ? '#000' : '#888', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: canBuy ? 'pointer' : 'not-allowed' }}
                    >
                        {canBuy ? 'PAY 75,000 POINTS' : 'RESETS NEXT MONDAY'}
                    </button>
                </div>

                {/* SECCIÓN DE VENTA */}
                <div style={{ background: 'rgba(255, 81, 47, 0.05)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255, 81, 47, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#aaa', fontWeight: 'bold' }}>LIQUIDATE TICKETS</div>
                        {canSell ? <Unlock size={14} color="#4CAF50" /> : <Lock size={14} color="#F44336" />}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <div style={{ color: '#00F2FE', fontWeight: 'bold', fontSize: '16px' }}>5 🎟️</div>
                        <ArrowRightLeft size={16} color="#555" />
                        <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '16px' }}>71.25k 🪙</div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#FF512F', marginBottom: '15px' }}>
                        <AlertTriangle size={10} /> Includes 5% Burn Fee
                    </div>

                    <button 
                        onClick={() => handleSwap('sell')} 
                        disabled={!canSell || loading}
                        style={{ width: '100%', padding: '10px', background: canSell ? '#FF512F' : '#333', color: canSell ? '#fff' : '#888', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: canSell ? 'pointer' : 'not-allowed' }}
                    >
                        {canSell ? 'SELL 5 TICKETS' : 'RESETS NEXT MONDAY'}
                    </button>
                </div>
            </div>
        </div>
    );
};