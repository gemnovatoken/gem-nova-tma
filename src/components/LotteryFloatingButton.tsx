import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
// CORRECCIÓN 1: Agregado 'Lock' y eliminado 'AlertCircle'
import { Ticket, Users, Zap, X, Loader2, Lock } from 'lucide-react';

const styles = `
  .lottery-fab {
    position: fixed; bottom: 90px; right: 20px; z-index: 50;
    width: 70px; height: 70px; border-radius: 50%;
    background: linear-gradient(135deg, #FFD700 0%, #FF8C00 100%);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    border: 2px solid #fff; cursor: pointer;
    animation: pulse-gold 2s infinite;
  }
  .fab-badge {
    background: #FF0055; color: white; font-size: 10px; font-weight: 900;
    padding: 2px 6px; border-radius: 10px; position: absolute; bottom: -5px;
    border: 1px solid white; white-space: nowrap;
  }
  
  .ticket-slot {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,215,0,0.3);
    border-radius: 12px; padding: 12px; margin-bottom: 10px;
    position: relative; overflow: hidden;
  }
  .ticket-slot.active { background: linear-gradient(90deg, rgba(255,215,0,0.1), transparent); border-color: #FFD700; }
  .ticket-slot.locked { opacity: 0.6; filter: grayscale(1); }

  .price-option {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px; border-radius: 8px; margin-top: 5px; cursor: pointer;
    border: 1px solid #444; background: rgba(0,0,0,0.3);
  }
  .price-option.promo { border-color: #00F2FE; background: rgba(0, 242, 254, 0.1); }
  .price-option.premium { border-color: #FFD700; background: rgba(255, 215, 0, 0.1); }
  
  @keyframes pulse-gold {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
    70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(255, 215, 0, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
  }
`;

interface EventData {
  id: string;
  sold: number;
  max: number;
  price_base: number;
  price_premium: number;
}

export const LotteryFloatingButton: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<EventData | null>(null);
  const [myTickets, setMyTickets] = useState<number>(0);
  const [myReferrals, setMyReferrals] = useState<number>(0);
  const [ticketsUsingReferral, setTicketsUsingReferral] = useState<number>(0);
  
  // Estado trigger para recargar manualmente sin romper el useEffect
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // CORRECCIÓN 2: Lógica de carga MOVIDA dentro del useEffect
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // 1. Obtener Evento Activo
        const { data: eventData } = await supabase
          .from('lottery_events')
          .select('*')
          .eq('status', 'active')
          .single();

        if (eventData) {
          setEvent({
            id: eventData.id,
            sold: eventData.total_tickets_sold,
            max: eventData.max_tickets_total,
            price_base: eventData.ticket_price_base,
            price_premium: eventData.ticket_price_premium
          });

          // 2. Obtener Tickets del Usuario
          const { count: ticketCount } = await supabase
            .from('lottery_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventData.id)
            .eq('user_id', user.id);
          
          setMyTickets(ticketCount || 0);

          // 3. Contar tickets "baratos" previos
          const { count: cheapTicketsCount } = await supabase
            .from('lottery_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventData.id)
            .eq('user_id', user.id)
            .eq('purchase_method', 'referral');
          
          setTicketsUsingReferral(cheapTicketsCount || 0);
        }

        // 4. Obtener Referidos Totales
        const { count: refCount } = await supabase
          .from('user_score')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by', user.id);
        
        setMyReferrals(refCount || 0);

      } catch (e) {
        console.error("Lottery Load Error:", e);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000); 
    return () => clearInterval(interval);
  }, [user, reloadTrigger]); // Se recarga si cambia el usuario o disparamos el trigger

  const handleBuy = async (method: 'base' | 'referral' | 'premium') => {
    if (!user || !event) return;
    
    // Validaciones Frontend
    if (method === 'referral') {
      if (myReferrals <= ticketsUsingReferral) {
        alert("⚠️ You need a NEW referral or an unused referral to claim this discount!");
        return;
      }
    }

    if (!window.confirm(`💎 Confirm Purchase?\n\nPrice: ${method === 'premium' ? event.price_premium : event.price_base} TON`)) return;

    setLoading(true);
    
    // Llamar al RPC
    const { data, error } = await supabase.rpc('buy_lottery_ticket', {
      p_user_id: user.id,
      p_method: method
    });

    if (error) {
      alert("Error: " + error.message);
    } else if (data && data.success) {
      alert("🎉 TICKET ACQUIRED!\n\nYou are in the draw.");
      setReloadTrigger(prev => prev + 1); // Forzar recarga limpia
    } else {
      alert("Failed: " + (data?.message || "Unknown error"));
    }
    
    setLoading(false);
  };

  if (!event) return null;

  const percentSold = (event.sold / event.max) * 100;

  return (
    <>
      <style>{styles}</style>

      {/* FAB (Botón Flotante) */}
      {!isOpen && (
        <div className="lottery-fab" onClick={() => setIsOpen(true)}>
          <Ticket size={28} color="#fff" strokeWidth={2.5} />
          <div className="fab-badge">
            {event.sold}/{event.max}
          </div>
        </div>
      )}

      {/* MODAL DEL EVENTO */}
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '350px', maxHeight:'90vh', overflowY:'auto', border: '1px solid #FFD700', boxShadow: '0 0 30px rgba(255, 215, 0, 0.2)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🎰</span>
                <div>
                  <h3 style={{ margin: 0, color: '#FFD700', fontSize: '18px', fontWeight: '900' }}>GENESIS DROP</h3>
                  <div style={{ fontSize: '10px', color: '#aaa' }}>WEEKLY JACKPOT: <strong>15 TON</strong></div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '5px', fontWeight:'bold' }}>
                <span style={{color:'#FF0055'}}>🔥 SELLING FAST</span>
                <span>{event.sold} / {event.max} SOLD</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: '#333', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${percentSold}%`, height: '100%', background: 'linear-gradient(90deg, #FFD700, #FF8C00)', transition: 'width 0.5s' }}></div>
              </div>
            </div>

            {/* --- TICKET SLOTS --- */}
            
            {/* SLOT 1 */}
            <div className={`ticket-slot ${myTickets >= 1 ? 'active' : ''}`}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                <span style={{color:'#fff', fontWeight:'bold'}}>Ticket #1</span>
                {myTickets >= 1 && <span style={{color:'#4CAF50', fontSize:'10px', fontWeight:'bold'}}>✅ OWNED</span>}
              </div>
              
              {myTickets >= 1 ? (
                <div style={{fontSize:'10px', color:'#aaa'}}>Entry confirmed. Good luck!</div>
              ) : (
                <button onClick={() => handleBuy('base')} disabled={loading} className="btn-neon" style={{width:'100%', padding:'8px', fontSize:'12px', background:'#FFD700', color:'#000'}}>
                  {loading ? <Loader2 className="spin" size={12}/> : `BUY ENTRY (${event.price_base} TON)`}
                </button>
              )}
            </div>

            {/* SLOT 2 */}
            <div className={`ticket-slot ${myTickets < 1 ? 'locked' : (myTickets >= 2 ? 'active' : '')}`}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                <span style={{color:'#fff', fontWeight:'bold'}}>Ticket #2</span>
                {myTickets >= 2 ? <span style={{color:'#4CAF50', fontSize:'10px', fontWeight:'bold'}}>✅ OWNED</span> : (myTickets < 1 && <Lock size={12} color="#aaa"/>)}
              </div>

              {myTickets >= 2 ? (
                <div style={{fontSize:'10px', color:'#aaa'}}>Maximized chances!</div>
              ) : (
                <>
                  <div style={{fontSize:'10px', color:'#ccc', marginBottom:'8px'}}>Increase your odds. Choose your path:</div>
                  
                  <div className="price-option promo" onClick={() => handleBuy('referral')}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                      <span style={{fontSize:'12px', fontWeight:'bold', color:'#00F2FE', display:'flex', alignItems:'center', gap:'4px'}}>
                        <Users size={12}/> REFERRAL DEAL
                      </span>
                      <span style={{fontSize:'9px', color:'#aaa'}}>Requires 1 Friend Invite</span>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'14px', fontWeight:'bold', color:'#fff'}}>{event.price_base} TON</div>
                      {myReferrals <= ticketsUsingReferral && <div style={{fontSize:'8px', color:'#FF5252'}}>NEED INVITE</div>}
                    </div>
                  </div>

                  <div className="price-option premium" onClick={() => handleBuy('premium')}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                      <span style={{fontSize:'12px', fontWeight:'bold', color:'#FFD700', display:'flex', alignItems:'center', gap:'4px'}}>
                        <Zap size={12}/> INSTANT BUY
                      </span>
                      <span style={{fontSize:'9px', color:'#aaa'}}>No requirements</span>
                    </div>
                    <div style={{fontSize:'14px', fontWeight:'bold', color:'#fff'}}>{event.price_premium} TON</div>
                  </div>
                </>
              )}
            </div>

            {/* SLOT 3 */}
            <div className={`ticket-slot ${myTickets < 2 ? 'locked' : (myTickets >= 3 ? 'active' : '')}`}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                <span style={{color:'#fff', fontWeight:'bold'}}>Ticket #3</span>
                {myTickets >= 3 ? <span style={{color:'#4CAF50', fontSize:'10px', fontWeight:'bold'}}>✅ OWNED</span> : (myTickets < 2 && <Lock size={12} color="#aaa"/>)}
              </div>

              {myTickets >= 3 ? (
                <div style={{fontSize:'10px', color:'#aaa'}}>MAX ENTRIES REACHED! 🚀</div>
              ) : (
                <>
                  <div className="price-option promo" onClick={() => handleBuy('referral')}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                      <span style={{fontSize:'12px', fontWeight:'bold', color:'#00F2FE'}}><Users size={12}/> REFERRAL DEAL</span>
                    </div>
                    <div style={{fontSize:'14px', fontWeight:'bold', color:'#fff'}}>{event.price_base} TON</div>
                  </div>

                  <div className="price-option premium" onClick={() => handleBuy('premium')}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                      <span style={{fontSize:'12px', fontWeight:'bold', color:'#FFD700'}}><Zap size={12}/> INSTANT BUY</span>
                    </div>
                    <div style={{fontSize:'14px', fontWeight:'bold', color:'#fff'}}>{event.price_premium} TON</div>
                  </div>
                </>
              )}
            </div>

            <div style={{textAlign:'center', fontSize:'9px', color:'#666', marginTop:'15px'}}>
              Draw ends in 72 hours. Winner takes all (15 TON).<br/>
              Verified on Blockchain via Smart Contract.
            </div>

          </div>
        </div>
      )}
    </>
  );
};