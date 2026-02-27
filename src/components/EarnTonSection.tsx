import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';

// --- ESTILOS CSS ACTUALIZADOS (INTACTOS) ---
const styles = `
  .ton-wrapper {
    width: 100%; font-family: 'Inter', sans-serif;
    margin-bottom: 80px; margin-top: 20px; padding: 0 16px; box-sizing: border-box;
  }

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

  .mission-desc { font-size: 10px; color: #888; margin-top: 6px; display: flex; justify-content: space-between; align-items: center; }

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

interface EarnTonSectionProps { userId: string; }
interface MissionData { raw: number; tickets: number; }
interface AllStats { 
  ads: MissionData; 
  bulk: MissionData; 
  staking: MissionData; 
  level: MissionData; 
  social: MissionData; 
  referral: MissionData; 
  roulette: MissionData; 
  burn: MissionData; // 🔥 NUEVO ESTATUS PARA QUEMA
}

interface WithdrawResponse {
  success: boolean;
  message?: string;
}

const EarnTonSection: React.FC<EarnTonSectionProps> = ({ userId }) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 🔥 Nuevo estado para saber cuántos tickets tiene el usuario disponibles para quemar
  const [availableLuckyTickets, setAvailableLuckyTickets] = useState(0);

  const [stats, setStats] = useState<AllStats>({
    ads: { raw: 0, tickets: 0 },
    bulk: { raw: 0, tickets: 0 },
    staking: { raw: 0, tickets: 0 },
    level: { raw: 1, tickets: 0 },
    social: { raw: 0, tickets: 0 },
    referral: { raw: 0, tickets: 0 },
    roulette: { raw: 0, tickets: 0 },
    burn: { raw: 0, tickets: 0 } // 🔥 Inicialización
  });

  const [withdrawStep, setWithdrawStep] = useState<number>(1);
  const [walletAddress, setWalletAddress] = useState<string>('');

  // 🔥 TARGETS: El Burn necesita 10 tickets quemados para dar 1 Voucher
  const TARGETS = useMemo(() => ({
    ads: 25, bulk: 500000, staking: 1000000, level: 1, referral: 1, social: 1, roulette: 1, burn: 10
  }), []);

  // 🔥 CAPS: Referidos baja a 5. Burn = 2 (requiere quemar 20 en total)
  const CAPS = useMemo(() => ({
    ads: 3, bulk: 3, staking: 3, level: 8, referral: 5, roulette: 3, burn: 2
  }), []);

  const TOTAL_TICKETS_GOAL = 20;

  const fetchTicketStats = async () => {
    try {
      setLoading(true);
      // 1. Obtener stats normales del RPC
      const { data, error } = await supabase.rpc('get_mission_stats', { target_user_id: userId });
      if (error) throw error;

      // 2. Obtener datos de la ruleta y los tickets quemados
      let goldVouchersCount = 0;
      let burnedTickets = 0;
      let currentLuckyTickets = 0;
      
      const { data: userScoreData } = await supabase
          .from('user_score')
          .select('username, lucky_tickets, burned_lucky_tickets')
          .eq('user_id', userId)
          .single();

      if (userScoreData) {
          currentLuckyTickets = userScoreData.lucky_tickets || 0;
          burnedTickets = userScoreData.burned_lucky_tickets || 0;
          setAvailableLuckyTickets(currentLuckyTickets);

          if (userScoreData.username) {
              const { count, error: wheelError } = await supabase
                  .from('wheel_winners')
                  .select('*', { count: 'exact', head: true })
                  .eq('username', userScoreData.username)
                  .eq('prize', '1 GOLD VOUCHER');
              
              if (!wheelError && count) goldVouchersCount = count;
          }
      }

      // 3. Unir todos los datos
      if (data && data.length > 0) {
        const r = data[0];
        setStats({
          ads: { raw: r.raw_ads, tickets: Math.min(r.tickets_ads, CAPS.ads) },
          bulk: { raw: r.raw_bulk, tickets: Math.min(r.tickets_bulk, CAPS.bulk) },
          staking: { raw: r.raw_staking, tickets: Math.min(r.tickets_staking, CAPS.staking) },
          level: { raw: r.raw_level, tickets: Math.min(r.tickets_level, CAPS.level) },
          referral: { raw: r.raw_referrals, tickets: Math.min(r.tickets_referral, CAPS.referral) },
          social: { raw: r.tickets_social, tickets: r.tickets_social },
          roulette: { raw: goldVouchersCount, tickets: Math.min(goldVouchersCount, CAPS.roulette) },
          burn: { raw: burnedTickets, tickets: Math.min(Math.floor(burnedTickets / 10), CAPS.burn) } // 🔥 Stats de la quema
        });
      }
    } catch (error) {
      console.error('Error stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchTicketStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, showModal, CAPS]);

  // 🔥 Función para Quemar Tickets
  const handleBurnTickets = async () => {
    const maxBurnableTotal = 20; // 2 Vouchers * 10 tickets
    const remainingToBurn = maxBurnableTotal - stats.burn.raw;

    if (remainingToBurn <= 0) {
        alert("You have reached the maximum allowed for the Smelter (2 Vouchers)!");
        return;
    }
    
    if (availableLuckyTickets <= 0) {
        alert("You don't have any Lucky Tickets to burn right now.\n\nTip: Watch Ads or invite friends to get more!");
        return;
    }

    // Calculamos cuánto quemar: Lo que tenga el usuario O lo que le falte para llenar la barra (lo que sea menor)
    const amountToBurn = Math.min(availableLuckyTickets, remainingToBurn);

    const confirmMsg = `🔥 IGNITE SMELTER 🔥\n\nYou are about to burn ${amountToBurn} Lucky Tickets to fuel your Golden Voucher progress.\n\nThis action cannot be undone. Proceed?`;
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
        const { data, error } = await supabase.rpc('burn_lucky_tickets', { 
            p_user_id: userId, 
            p_amount: amountToBurn 
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = data as any;

        if (!error && result.success) {
            alert(`🔥 SUCCESS!\n\n${amountToBurn} Tickets Burned. Smelter progress updated!`);
            await fetchTicketStats(); // Recargamos para que la barrita avance
        } else {
            alert("Error: " + (result?.message || error?.message));
        }
    } catch (e) {
        console.error(e);
        alert("Transaction failed.");
    }
    setLoading(false);
  };

  const totalTickets = Object.values(stats).reduce((acc, curr) => acc + curr.tickets, 0);
  const progressPercent = Math.min((totalTickets / TOTAL_TICKETS_GOAL) * 100, 100);

  const handleWithdrawRequest = async () => {
    if (!walletAddress || walletAddress.length < 20) {
        return alert("Please enter a valid TON wallet address.");
    }
    try {
      const { data, error } = await supabase.rpc('request_ton_withdrawal', {
          p_user_id: userId, 
          p_wallet: walletAddress
      });
      if (error) throw error;
      const res = data as WithdrawResponse;
      if (res.success) setWithdrawStep(3);
      else alert("Error: " + res.message);
    } catch (error) {
        console.error("Withdraw error:", error);
        alert("Error sending request. Please try again.");
    }
  };

  return (
    <div className="ton-wrapper">
      <style>{styles}</style>

      {/* ENTRY BANNER */}
      <div className="entry-banner" onClick={() => setShowModal(true)}>
        <div className="banner-header">
          <h3 className="banner-title">💎 MISSION 1 TON</h3>
          <span className="banner-badge">{totalTickets}/{TOTAL_TICKETS_GOAL}</span>
        </div>
        <div className="progress-bg">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p className="banner-footer">Collect 20 Golden Vouchers to claim ✨</p>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => { setShowModal(false); setWithdrawStep(1); }}>✕</button>

            <div className="modal-header">
              <h2 className="modal-title">MISSION <span>TON</span> 💎</h2>
              <div className="big-progress-container">
                <div className="progress-info">
                  <span>Golden Vouchers</span>
                  <span style={{ color: totalTickets >= TOTAL_TICKETS_GOAL ? '#2ecc71' : '#0088cc' }}>
                    {Math.floor(progressPercent)}%
                  </span>
                </div>
                <div className="big-bar-bg">
                  <div className="big-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '5px' }}>
                  {totalTickets} / {TOTAL_TICKETS_GOAL} Vouchers
                </div>
              </div>
            </div>

            <div className="modal-scroll-area">
              {withdrawStep === 1 && (
                <>
                  {loading ? <div style={{textAlign:'center', color:'#666'}}>Loading...</div> : (
                    <div>
                      <MissionBar label="Referrals" icon="👥" raw={stats.referral.raw} ticketGoal={TARGETS.referral} ticketsEarned={stats.referral.tickets} maxTickets={CAPS.referral} desc="1 Voucher per Friend invited" />
                      
                      {/* 🔥 NUEVO: BARRA DEL QUEMADOR CON BOTÓN INCORPORADO */}
                      <MissionBar 
                        label="Ticket Smelter" icon="🔥" raw={stats.burn.raw} ticketGoal={TARGETS.burn} ticketsEarned={stats.burn.tickets} maxTickets={CAPS.burn} 
                        desc="Burn 10 Lucky Tickets = 1 Voucher"
                        actionBtn={
                            <button 
                                onClick={handleBurnTickets}
                                disabled={stats.burn.raw >= 20 || availableLuckyTickets <= 0}
                                style={{
                                    marginTop: '8px', width: '100%', padding: '6px', fontSize: '10px', fontWeight: 'bold',
                                    borderRadius: '6px', border: '1px solid #FF512F', 
                                    background: (stats.burn.raw >= 20 || availableLuckyTickets <= 0) ? '#333' : 'rgba(255, 81, 47, 0.1)', 
                                    color: (stats.burn.raw >= 20 || availableLuckyTickets <= 0) ? '#666' : '#FF512F',
                                    cursor: (stats.burn.raw >= 20 || availableLuckyTickets <= 0) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {stats.burn.raw >= 20 ? 'SMELTER MAXED' : `BURN TICKETS (You have ${availableLuckyTickets})`}
                            </button>
                        }
                      />

                      <MissionBar label="Lucky Wheel" icon="🎰" raw={stats.roulette.raw} ticketGoal={TARGETS.roulette} ticketsEarned={stats.roulette.tickets} maxTickets={CAPS.roulette} desc="Win Golden Vouchers spinning" />
                      <MissionBar label="Watch Ads" icon="📺" raw={stats.ads.raw} ticketGoal={TARGETS.ads} ticketsEarned={stats.ads.tickets} maxTickets={CAPS.ads} desc="1 Voucher every 25 videos" />
                      <MissionBar label="Staking Volume" icon="🏦" raw={stats.staking.raw} ticketGoal={TARGETS.staking} ticketsEarned={stats.staking.tickets} maxTickets={CAPS.staking} desc="1 Voucher every 1M pts staked" isCurrency />
                      <MissionBar label="Bulk Store" icon="🛒" raw={stats.bulk.raw} ticketGoal={TARGETS.bulk} ticketsEarned={stats.bulk.tickets} maxTickets={CAPS.bulk} desc="1 Voucher every 500k pts spent" isCurrency />
                      <MissionBar label="Mining Rig Level" icon="⚡" raw={stats.level.raw} ticketGoal={TARGETS.level} ticketsEarned={stats.level.tickets} maxTickets={CAPS.level} desc="1 Voucher per Level reached" />

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
                  <input type="text" placeholder="UQBj..." className="input-field" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
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

interface MissionBarProps {
  label: string; 
  icon: string; 
  raw: number; 
  ticketGoal: number; 
  ticketsEarned: number; 
  desc: string; 
  maxTickets: number; 
  isCurrency?: boolean;
  actionBtn?: React.ReactNode; // 🔥 NUEVO: Permite inyectar un botón dentro de la tarjeta
}

const MissionBar: React.FC<MissionBarProps> = ({ label, icon, raw, ticketGoal, ticketsEarned, desc, maxTickets, isCurrency, actionBtn }) => {
  const isCompleted = ticketsEarned >= maxTickets;
  // Modificado para que no reinicie el contador visual a 0 si completó el nivel final (ejemplo 20/20)
  const currentProgressInCycle = isCompleted ? ticketGoal : (raw % ticketGoal);
  const percentage = (currentProgressInCycle / ticketGoal) * 100;
  
  const formatNum = (n: number) => isCurrency ? (n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : `${(n/1000).toFixed(0)}k`) : n;

  return (
    <div className="mission-bar-card">
      <div className="mission-header">
        <div className="mission-title"><span>{icon} {label}</span></div>
        <div className="mission-tickets-earned" style={{ color: isCompleted ? '#2ecc71' : '#00E5FF', borderColor: isCompleted ? '#2ecc71' : '#00E5FF' }}>
          {ticketsEarned} / {maxTickets} 🎫
        </div>
      </div>
      <div className="mission-progress-track">
        <div className="mission-progress-bar" style={{ 
          width: `${percentage}%`,
          background: isCompleted ? 'linear-gradient(90deg, #2ecc71, #27ae60)' : 'linear-gradient(90deg, #2ecc71, #00E5FF)'
        }}></div>
        <div className="mission-text-overlay">
          {isCompleted ? 'MAX REACHED' : `${formatNum(currentProgressInCycle)} / ${formatNum(ticketGoal)}`}
        </div>
      </div>
      
      {/* Contenedor de Descripción y Botón */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="mission-desc">
          <span>{desc}</span>
          <span style={{color:'#fff'}}>Total: {isCurrency ? formatNum(raw) : raw}</span>
        </div>
        {actionBtn}
      </div>
    </div>
  );
};

export default EarnTonSection;