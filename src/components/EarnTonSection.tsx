import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

// --- ESTILOS CSS INCRUSTADOS (Para asegurar el diseño) ---
const styles = `
  .ton-wrapper {
    width: 100%;
    font-family: 'Inter', sans-serif;
    margin-bottom: 80px;
    margin-top: 20px;
    padding: 0 16px;
    box-sizing: border-box;
  }

  /* BOTÓN DE ENTRADA */
  .entry-banner {
    background: linear-gradient(135deg, #0088cc 0%, #005577 100%);
    border-radius: 20px;
    padding: 20px;
    color: white;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 136, 204, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.2s;
  }
  .entry-banner:active { transform: scale(0.98); }
  
  .banner-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; position: relative; z-index: 2; }
  .banner-title { font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
  .banner-badge { background: rgba(0,0,0,0.4); padding: 5px 12px; border-radius: 8px; font-size: 12px; font-family: monospace; border: 1px solid rgba(255,255,255,0.2); }
  
  .progress-bg { background: rgba(0,0,0,0.3); height: 10px; border-radius: 5px; overflow: hidden; position: relative; z-index: 2; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #7FDBFF, #fff); transition: width 0.5s ease; box-shadow: 0 0 10px #7FDBFF; }
  .banner-footer { font-size: 12px; color: rgba(255,255,255,0.8); text-align: center; margin-top: 10px; position: relative; z-index: 2; }

  /* MODAL (VENTANA EMERGENTE) */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    animation: fadeIn 0.3s ease;
  }
  
  .modal-content {
    background: #121214;
    width: 100%;
    max-width: 400px;
    border-radius: 24px;
    border: 1px solid #333;
    display: flex;
    flex-direction: column;
    max-height: 85vh;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    overflow: hidden;
    position: relative;
    animation: slideUp 0.3s ease;
  }

  .close-btn {
    position: absolute;
    top: 15px; right: 15px;
    background: #2c2c2e; border: none; color: #888;
    width: 32px; height: 32px; border-radius: 50%;
    font-size: 18px; cursor: pointer; z-index: 10;
    display: flex; align-items: center; justify-content: center;
  }

  .modal-header { padding: 25px 20px 10px; text-align: center; background: #121214; }
  .modal-title { font-size: 22px; font-weight: 900; color: white; margin: 0; letter-spacing: -0.5px; }
  .modal-title span { color: #0088cc; }
  
  .big-progress-container { margin-top: 20px; }
  .progress-info { display: flex; justify-content: space-between; font-size: 12px; color: #888; margin-bottom: 5px; font-weight: bold; }
  .big-bar-bg { height: 16px; background: #222; border-radius: 8px; overflow: hidden; border: 1px solid #333; }
  .big-bar-fill { height: 100%; background: linear-gradient(90deg, #0088cc, #00E5FF); position: relative; }
  
  .modal-scroll-area { padding: 20px; overflow-y: auto; }

  /* TARJETAS DE MISIONES */
  .task-card {
    background: #1E1E20;
    border: 1px solid #333;
    border-radius: 16px;
    padding: 14px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s;
  }
  .task-card.completed { background: #1a221a; border-color: #2e4a2e; }
  
  .task-left { display: flex; flex-direction: column; gap: 4px; }
  .task-name { font-weight: 700; font-size: 14px; color: white; display: flex; align-items: center; gap: 6px; }
  .task-desc { font-size: 11px; color: #888; }
  .tag { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }
  .tag.blue { background: rgba(0, 136, 204, 0.2); color: #0088cc; }
  .tag.green { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
  .tag.purple { background: rgba(155, 89, 182, 0.2); color: #9b59b6; }

  .task-right { text-align: right; }
  .task-count { font-size: 16px; font-weight: 800; color: white; }
  .task-limit { font-size: 10px; color: #666; font-weight: 600; display: block; }
  
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

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;

interface EarnTonSectionProps {
  userId: string;
}

interface TicketStats {
  bulk: number;
  ads: number;
  staking: number;
  level: number;
  social: number;
  referral: number;
}

interface TicketRowProps {
  label: string;
  condition: string;
  count: number;
  limit: number | null;
  isUnlimited?: boolean;
}

const EarnTonSection: React.FC<EarnTonSectionProps> = ({ userId }) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [stats, setStats] = useState<TicketStats>({
    bulk: 0, ads: 0, staking: 0, level: 0, social: 0, referral: 0
  });

  const [withdrawStep, setWithdrawStep] = useState<number>(1);
  const [walletAddress, setWalletAddress] = useState<string>('');

  const LIMITS = {
    bulk: 5, ads: 3, staking: 3, level: 7, social: 2, referral: 9999
  };

  const TARGET = 20;

  useEffect(() => {
    const fetchTicketStats = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('tickets_bulk, tickets_ads, tickets_staking, tickets_level, tickets_social, tickets_referral')
          .eq('id', userId)
          .single();

        if (error) throw error;
        if (data) {
          setStats({
            bulk: data.tickets_bulk || 0,
            ads: data.tickets_ads || 0,
            staking: data.tickets_staking || 0,
            level: data.tickets_level || 0,
            social: data.tickets_social || 0,
            referral: data.tickets_referral || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (showModal && userId) {
      fetchTicketStats();
    }
  }, [showModal, userId]);

  const totalTickets = Object.values(stats).reduce((a, b) => a + b, 0);
  const progressPercent = Math.min((totalTickets / TARGET) * 100, 100);

  const handleWithdrawRequest = async () => {
    if (!walletAddress) return alert("Please enter your TON wallet address");

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert([{ 
          user_id: userId, 
          wallet_address: walletAddress,
          status: 'pending'
        }]);

      if (error) throw error;
      setWithdrawStep(3);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert("Error sending request: " + message);
    }
  };

  return (
    <div className="ton-wrapper">
      {/* INYECTAMOS LOS ESTILOS */}
      <style>{styles}</style>

      {/* --- ENTRY BUTTON --- */}
      <div className="entry-banner" onClick={() => setShowModal(true)}>
        <div className="banner-header">
          <h3 className="banner-title">💎 1 FREE TON</h3>
          <span className="banner-badge">{totalTickets}/{TARGET}</span>
        </div>
        <div className="progress-bg">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p className="banner-footer">Tap to view missions & claim reward ✨</p>
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => { setShowModal(false); setWithdrawStep(1); }}>✕</button>

            {/* Header Fijo */}
            <div className="modal-header">
              <h2 className="modal-title">MISSION <span>TON</span> 💎</h2>
              
              <div className="big-progress-container">
                <div className="progress-info">
                  <span>Your Progress</span>
                  <span style={{ color: totalTickets >= TARGET ? '#2ecc71' : '#0088cc' }}>
                    {Math.floor(progressPercent)}%
                  </span>
                </div>
                <div className="big-bar-bg">
                  <div className="big-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#666', marginTop: '5px' }}>
                  {totalTickets} of {TARGET} Tickets Collected
                </div>
              </div>
            </div>

            {/* Scroll Area */}
            <div className="modal-scroll-area">
              
              {/* VISTA 1: LISTA DE MISIONES */}
              {withdrawStep === 1 && (
                <>
                  {loading ? (
                    <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Loading...</div>
                  ) : (
                    <div>
                      <TicketCard 
                        label="Bulk Store" condition="Spend 500k pts"
                        count={stats.bulk} limit={LIMITS.bulk} 
                      />
                      <TicketCard 
                        label="Watch Ads" condition="20 videos watched"
                        count={stats.ads} limit={LIMITS.ads} 
                      />
                      <TicketCard 
                        label="Staking" condition="Stake 1M pts"
                        count={stats.staking} limit={LIMITS.staking} 
                      />
                      <TicketCard 
                        label="Level Up" condition="1 Ticket per Level"
                        count={stats.level} limit={LIMITS.level} 
                      />
                      <TicketCard 
                        label="Social Task" condition="Post & Verify"
                        count={stats.social} limit={LIMITS.social} 
                      />
                      <TicketCard 
                        label="Referrals" condition="5 Refs (Lvl 3)"
                        count={stats.referral} limit={null} isUnlimited 
                      />

                      <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                        <button
                          onClick={() => totalTickets >= TARGET ? setWithdrawStep(2) : null}
                          disabled={totalTickets < TARGET}
                          className={`action-btn ${totalTickets >= TARGET ? 'btn-green' : 'btn-disabled'}`}
                        >
                          {totalTickets >= TARGET ? "CLAIM 1 TON 💸" : "LOCKED 🔒"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* VISTA 2: RETIRO */}
              {withdrawStep === 2 && (
                <div>
                  <div style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', padding: '12px', borderRadius: '12px', marginBottom: '20px' }}>
                    <p style={{ color: '#ffecb3', fontSize: '12px', margin: 0 }}>
                      ⚠️ <strong>Review Required:</strong> We verify all withdrawals manually. Processing takes 24-48 hours.
                    </p>
                  </div>

                  <label style={{ color: '#aaa', fontSize: '12px', fontWeight: 'bold' }}>TON WALLET ADDRESS</label>
                  <input 
                    type="text" 
                    placeholder="UQBj..." 
                    className="input-field"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                  />

                  <button onClick={handleWithdrawRequest} className="action-btn btn-blue" style={{ marginTop: '20px' }}>
                    SUBMIT REQUEST 🚀
                  </button>
                  <button onClick={() => setWithdrawStep(1)} className="action-btn btn-text">
                    Cancel
                  </button>
                </div>
              )}

              {/* VISTA 3: ÉXITO */}
              {withdrawStep === 3 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div>
                  <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>Request Sent!</h3>
                  <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.5' }}>
                    Your request has been received. You will receive <strong>1 TON</strong> after verification.
                  </p>
                  <button onClick={() => setShowModal(false)} className="action-btn" style={{ background: '#333', marginTop: '20px' }}>
                    CLOSE
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE DE TARJETA REDISEÑADO ---
const TicketCard: React.FC<TicketRowProps> = ({ label, condition, count, limit, isUnlimited }) => {
  const isMaxed = !isUnlimited && limit !== null && count >= limit;
  
  return (
    <div className={`task-card ${isMaxed ? 'completed' : ''}`}>
      <div className="task-left">
        <div className="task-name">
          {label}
          {isMaxed && <span className="tag green">DONE</span>}
          {isUnlimited && <span className="tag purple">∞</span>}
        </div>
        <span className="task-desc">{condition}</span>
      </div>
      <div className="task-right">
        <div className="task-count" style={{ color: count > 0 ? (isMaxed ? '#2ecc71' : '#00E5FF') : '#555' }}>
          {count}
        </div>
        <span className="task-limit">
          / {isUnlimited ? '∞' : limit}
        </span>
      </div>
    </div>
  );
};

export default EarnTonSection;