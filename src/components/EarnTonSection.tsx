import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

// --- ESTILOS CSS ACTUALIZADOS ---
const styles = `
  .ton-wrapper {
    width: 100%; font-family: 'Inter', sans-serif;
    margin-bottom: 80px; margin-top: 20px; padding: 0 16px; box-sizing: border-box;
  }

  /* ENTRY BANNER (Intacto) */
  .entry-banner {
    background: linear-gradient(135deg, #0088cc 0%, #005577 100%);
    border-radius: 20px; padding: 20px; color: white; cursor: pointer;
    position: relative; overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 136, 204, 0.3); border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.2s;
  }
  .entry-banner:active { transform: scale(0.98); }
  
  .banner-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; position: relative; z-index: 2; }
  .banner-title { font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
  .banner-badge { background: rgba(0,0,0,0.4); padding: 5px 12px; border-radius: 8px; font-size: 12px; font-family: monospace; border: 1px solid rgba(255,255,255,0.2); }
  
  .progress-bg { background: rgba(0,0,0,0.3); height: 10px; border-radius: 5px; overflow: hidden; position: relative; z-index: 2; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #7FDBFF, #fff); transition: width 0.5s ease; box-shadow: 0 0 10px #7FDBFF; }
  .banner-footer { font-size: 12px; color: rgba(255,255,255,0.8); text-align: center; margin-top: 10px; position: relative; z-index: 2; }

  /* MODAL */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px); z-index: 9999;
    display: flex; justify-content: center; align-items: center; padding: 20px;
    animation: fadeIn 0.3s ease;
  }
  .modal-content {
    background: #121214; width: 100%; max-width: 400px; border-radius: 24px;
    border: 1px solid #333; display: flex; flex-direction: column; max-height: 85vh;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5); overflow: hidden; position: relative;
    animation: slideUp 0.3s ease;
  }
  .close-btn {
    position: absolute; top: 15px; right: 15px; background: #2c2c2e; border: none; color: #888;
    width: 32px; height: 32px; border-radius: 50%; font-size: 18px; cursor: pointer; z-index: 10;
    display: flex; align-items: center; justify-content: center;
  }
  .modal-header { padding: 25px 20px 10px; text-align: center; background: #121214; }
  .modal-title { font-size: 22px; font-weight: 900; color: white; margin: 0; letter-spacing: -0.5px; }
  .modal-title span { color: #0088cc; }
  
  .big-progress-container { margin-top: 20px; }
  .progress-info { display: flex; justify-content: space-between; font-size: 12px; color: #888; margin-bottom: 5px; font-weight: bold; }
  .big-bar-bg { height: 16px; background: #222; border-radius: 8px; overflow: hidden; border: 1px solid #333; }
  .big-bar-fill { height: 100%; background: linear-gradient(90deg, #0088cc, #00E5FF); position: relative; transition: width 0.5s ease; }
  .modal-scroll-area { padding: 20px; overflow-y: auto; }

  /* --- NUEVAS BARRAS DE MISIONES (CYBERPUNK) --- */
  .mission-bar-card {
    background: #1E1E20; border: 1px solid #333; border-radius: 16px;
    padding: 12px; margin-bottom: 12px; position: relative; overflow: hidden;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  }
  .mission-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; position: relative; z-index: 2; }
  .mission-title { font-weight: 700; font-size: 13px; color: #fff; display: flex; align-items: center; gap: 6px; }
  .mission-tickets-earned { 
    font-size: 10px; color: #00E5FF; background: rgba(0, 229, 255, 0.15); 
    padding: 3px 8px; border-radius: 6px; font-weight: bold; border: 1px solid rgba(0, 229, 255, 0.3);
  }
  
  .mission-progress-track {
    height: 18px; background: rgba(0,0,0,0.5); border-radius: 9px; 
    overflow: hidden; position: relative; z-index: 2; border: 1px solid #444;
  }
  .mission-progress-bar {
    height: 100%; background: linear-gradient(90deg, #2ecc71, #00E5FF);
    border-radius: 9px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }
  /* Efecto de brillo en la barra */
  .mission-progress-bar::after {
    content: ''; position: absolute; top: 0; left: 0; bottom: 0; right: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    transform: translateX(-100%); animation: shimmer 2s infinite;
  }

  .mission-text-overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 800; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.9);
    z-index: 3; pointer-events: none; letter-spacing: 0.5px;
  }

  .mission-desc { font-size: 10px; color: #888; margin-top: 6px; display: flex; justify-content: space-between; }

  /* BOTONES */
  .action-btn {
    width: 100%; padding: 16px; border-radius: 14px; border: none;
    font-size: 16px; font-weight: 800; color: white; cursor: pointer;
    margin-top: 10px; transition: 0.2s;
    display: flex; justify-content: center; align-items: center; gap: 8px;
  }
  .btn-green { background: linear-gradient(to right, #2ecc71, #27ae60); box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3); }
  .btn-disabled { background: #333; color: #666; cursor: not-allowed; }
  .btn-blue { background: #0088cc; }
  .btn-text { background: transparent; color: #888; font-size: 13px; margin-top: 10px; }
  
  /* INPUT */
  .input-field {
    width: 100%; background: #000; border: 1px solid #444; color: white;
    padding: 14px; border-radius: 12px; font-family: monospace; margin-top: 5px;
    box-sizing: border-box; font-size: 14px;
  }
  .input-field:focus { border-color: #0088cc; outline: none; }

  @keyframes shimmer { 100% { transform: translateX(100%); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;

interface EarnTonSectionProps {
  userId: string;
}

// Estructura de Datos para Barras Cíclicas
interface MissionData {
  raw: number;    // Dato Crudo (ej: 34 videos vistos)
  tickets: number; // Tickets Ganados (ej: 2 tickets)
}

interface AllStats {
  ads: MissionData;
  bulk: MissionData;
  staking: MissionData;
  level: MissionData;
  social: MissionData;
  referral: MissionData;
}

const EarnTonSection: React.FC<EarnTonSectionProps> = ({ userId }) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [stats, setStats] = useState<AllStats>({
    ads: { raw: 0, tickets: 0 },
    bulk: { raw: 0, tickets: 0 },
    staking: { raw: 0, tickets: 0 },
    level: { raw: 1, tickets: 0 },
    social: { raw: 0, tickets: 0 },
    referral: { raw: 0, tickets: 0 },
  });

  const [withdrawStep, setWithdrawStep] = useState<number>(1);
  const [walletAddress, setWalletAddress] = useState<string>('');

  // --- CONFIGURACIÓN DE METAS (CICLOS) ---
  // Aquí definimos "cuánto cuesta" ganar 1 ticket en cada categoría
  const TARGETS = {
    ads: 15,          // 15 videos = 1 ticket
    bulk: 500000,     // 500k puntos = 1 ticket
    staking: 1000000, // 1M staking = 1 ticket
    level: 1,         // 1 nivel = 1 ticket
    referral: 1,      // 1 amigo = 1 ticket
    social: 1         // 1 tarea = 1 ticket
  };

  const TOTAL_TICKETS_GOAL = 20;

  useEffect(() => {
    const fetchTicketStats = async () => {
      try {
        setLoading(true);
        // Llamamos a la función SQL que devuelve datos crudos y tickets calculados
        const { data, error } = await supabase.rpc('get_mission_stats', { target_user_id: userId });

        if (error) throw error;

        if (data && data.length > 0) {
          const r = data[0];
          setStats({
            ads: { raw: r.raw_ads, tickets: r.tickets_ads },
            bulk: { raw: r.raw_bulk, tickets: r.tickets_bulk },
            staking: { raw: r.raw_staking, tickets: r.tickets_staking },
            level: { raw: r.raw_level, tickets: r.tickets_level },
            referral: { raw: r.raw_referrals, tickets: r.tickets_referral },
            social: { raw: r.tickets_social, tickets: r.tickets_social },
          });
        }
      } catch (error) {
        console.error('Error stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchTicketStats();
    if (showModal && userId) fetchTicketStats();
  }, [showModal, userId]);

  const totalTickets = Object.values(stats).reduce((acc, curr) => acc + curr.tickets, 0);
  const progressPercent = Math.min((totalTickets / TOTAL_TICKETS_GOAL) * 100, 100);

  const handleWithdrawRequest = async () => {
    if (!walletAddress) return alert("Enter address");
    try {
      await supabase.from('withdrawals').insert([{ user_id: userId, wallet_address: walletAddress, status: 'pending' }]);
      setWithdrawStep(3);
    } catch (error) {
        console.error("Withdraw error:", error); // 🔥 CORREGIDO: Usamos 'error' aquí
        alert("Error sending request");
    }
  };

  return (
    <div className="ton-wrapper">
      <style>{styles}</style>

      {/* ENTRY BANNER */}
      <div className="entry-banner" onClick={() => setShowModal(true)}>
        <div className="banner-header">
          <h3 className="banner-title">💎 1 FREE TON</h3>
          <span className="banner-badge">{totalTickets}/{TOTAL_TICKETS_GOAL}</span>
        </div>
        <div className="progress-bg">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p className="banner-footer">Tap to view missions & claim reward ✨</p>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => { setShowModal(false); setWithdrawStep(1); }}>✕</button>

            <div className="modal-header">
              <h2 className="modal-title">MISSION <span>TON</span> 💎</h2>
              <div className="big-progress-container">
                <div className="progress-info">
                  <span>Goal Progress</span>
                  <span style={{ color: totalTickets >= TOTAL_TICKETS_GOAL ? '#2ecc71' : '#0088cc' }}>
                    {Math.floor(progressPercent)}%
                  </span>
                </div>
                <div className="big-bar-bg">
                  <div className="big-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '5px' }}>
                  {totalTickets} / {TOTAL_TICKETS_GOAL} Golden Tickets
                </div>
              </div>
            </div>

            <div className="modal-scroll-area">
              {withdrawStep === 1 && (
                <>
                  {loading ? <div style={{textAlign:'center', color:'#666'}}>Loading...</div> : (
                    <div>
                      {/* BARRA DE VIDEOS (CÍCLICA: 15 por Ticket) */}
                      <MissionBar 
                        label="Watch Ads" 
                        icon="📺"
                        raw={stats.ads.raw} 
                        ticketGoal={TARGETS.ads} 
                        ticketsEarned={stats.ads.tickets}
                        desc="1 Ticket every 15 videos watched"
                      />

                      {/* BARRA DE TIENDA (CÍCLICA: 500k por Ticket) */}
                      <MissionBar 
                        label="Bulk Store" 
                        icon="🛒"
                        raw={stats.bulk.raw} 
                        ticketGoal={TARGETS.bulk} 
                        ticketsEarned={stats.bulk.tickets}
                        desc="1 Ticket every 500k pts spent"
                        isCurrency
                      />

                      {/* BARRA DE STAKING (CÍCLICA: 1M por Ticket) */}
                      <MissionBar 
                        label="Staking Volume" 
                        icon="🏦"
                        raw={stats.staking.raw} 
                        ticketGoal={TARGETS.staking} 
                        ticketsEarned={stats.staking.tickets}
                        desc="1 Ticket every 1M pts staked"
                        isCurrency
                      />

                      {/* NIVEL (NO CÍCLICO VISUALMENTE, SIEMPRE LLENO) */}
                      <MissionBar 
                        label="Mining Rig Level" 
                        icon="⚡"
                        raw={stats.level.raw} 
                        ticketGoal={TARGETS.level} 
                        ticketsEarned={stats.level.tickets}
                        desc="1 Ticket per Level reached"
                        forceFull={true} 
                      />

                      {/* REFERIDOS (SIEMPRE LLENO VISUALMENTE PARA MOTIVAR) */}
                      <MissionBar 
                        label="Referrals" 
                        icon="👥"
                        raw={stats.referral.raw} 
                        ticketGoal={TARGETS.referral} 
                        ticketsEarned={stats.referral.tickets}
                        desc="1 Ticket per Friend invited"
                        forceFull={true}
                      />

                      <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                        <button
                          onClick={() => totalTickets >= TOTAL_TICKETS_GOAL ? setWithdrawStep(2) : null}
                          disabled={totalTickets < TOTAL_TICKETS_GOAL}
                          className="action-btn"
                          style={{
                            background: totalTickets >= TOTAL_TICKETS_GOAL ? 'linear-gradient(to right, #2ecc71, #27ae60)' : '#333',
                            color: totalTickets >= TOTAL_TICKETS_GOAL ? '#fff' : '#666',
                            cursor: totalTickets >= TOTAL_TICKETS_GOAL ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {totalTickets >= TOTAL_TICKETS_GOAL ? "CLAIM 1 TON 💸" : `LOCKED (Need ${TOTAL_TICKETS_GOAL}) 🔒`}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {withdrawStep === 2 && (
                <div>
                  <div style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', padding: '12px', borderRadius: '12px', marginBottom: '20px' }}>
                    <p style={{ color: '#ffecb3', fontSize: '12px', margin: 0 }}>
                      ⚠️ <strong>Review Required:</strong> We verify all withdrawals manually. Processing takes 24-48 hours.
                    </p>
                  </div>

                  <label style={{ color: '#aaa', fontSize: '12px', fontWeight: 'bold' }}>TON WALLET ADDRESS</label>
                  <input type="text" placeholder="UQBj..." className="input-field"
                    value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)}
                  />
                  <button onClick={handleWithdrawRequest} className="action-btn btn-blue" style={{ marginTop: '20px' }}>SUBMIT REQUEST 🚀</button>
                  <button onClick={() => setWithdrawStep(1)} className="action-btn btn-text">Cancel</button>
                </div>
              )}

              {withdrawStep === 3 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '50px' }}>🎉</div>
                  <h3 style={{ color: 'white' }}>Request Sent!</h3>
                  <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.5' }}>
                    Your request has been received. You will receive <strong>1 TON</strong> after verification.
                  </p>
                  <button onClick={() => setShowModal(false)} className="action-btn" style={{ background: '#333', marginTop: '20px' }}>CLOSE</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- NUEVO COMPONENTE: BARRA DE MISIÓN ---
const MissionBar: React.FC<{
  label: string; icon: string; raw: number; ticketGoal: number; ticketsEarned: number; desc: string; isCurrency?: boolean; forceFull?: boolean;
}> = ({ label, icon, raw, ticketGoal, ticketsEarned, desc, isCurrency, forceFull }) => {
  
  // Cálculo del progreso cíclico (Ej: si raw=17 y goal=15, el progreso es 2)
  const currentProgress = raw % ticketGoal; 
  // Porcentaje visual: Si forceFull es true (ej: niveles), se ve siempre llena. Si no, calcula el % del ciclo actual.
  const percentage = forceFull ? 100 : (currentProgress / ticketGoal) * 100;
  
  // Formateador de números (k, M)
  const formatNum = (n: number) => isCurrency ? (n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : `${(n/1000).toFixed(0)}k`) : n;

  return (
    <div className="mission-bar-card">
      <div className="mission-header">
        <div className="mission-title">
          <span>{icon} {label}</span>
        </div>
        <div className="mission-tickets-earned">
          {ticketsEarned} 🎟️ EARNED
        </div>
      </div>

      {/* Track de la Barra */}
      <div className="mission-progress-track">
        <div className="mission-progress-bar" style={{ width: `${percentage}%` }}></div>
        
        {/* Texto Overlay (Ej: 2 / 15) */}
        <div className="mission-text-overlay">
          {forceFull ? 'ONGOING REWARD' : `${formatNum(currentProgress)} / ${formatNum(ticketGoal)}`}
        </div>
      </div>

      <div className="mission-desc">
        <span>{desc}</span>
        <span style={{color:'#fff'}}>Total: {isCurrency ? raw.toLocaleString() : raw}</span>
      </div>
    </div>
  );
};

export default EarnTonSection;