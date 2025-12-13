import React, { useState, useEffect } from 'react';

// CORREGIDO 1: Verifica si tu archivo supabaseClient está en la misma carpeta o una atrás.
// Si está en la misma carpeta usa './', si está atrás usa '../'
import { supabase } from '../services/supabase';

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
    bulk: 5,
    ads: 3,
    staking: 3,
    level: 7,
    social: 2,
    referral: 9999
  };

  const TARGET = 20;

  // CORREGIDO 3: Movimos 'fetchTicketStats' DENTRO del useEffect para eliminar el error de dependencias
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
  }, [showModal, userId]); // Ahora el array de dependencias está limpio y correcto

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
      // CORREGIDO 2: Manejo seguro del tipo 'error' sin usar 'any' explícito
      const message = error instanceof Error ? error.message : "Unknown error";
      alert("Error sending request: " + message);
    }
  };

  return (
    <div className="w-full mt-6 mb-20 px-4">
      {/* --- ENTRY BUTTON --- */}
      <div 
        onClick={() => setShowModal(true)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 shadow-lg cursor-pointer transform transition hover:scale-105 border border-blue-400"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            💎 EARN 1 TON
          </h3>
          <span className="bg-black/30 text-white text-xs px-2 py-1 rounded-lg">
            {totalTickets}/{TARGET}
          </span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-2.5">
          <div 
            className="bg-blue-300 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <p className="text-blue-100 text-xs mt-2 text-center">
          Tap to view details & withdraw
        </p>
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1f2e] border border-gray-700 w-full max-w-md rounded-2xl p-6 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            
            <button 
              onClick={() => { setShowModal(false); setWithdrawStep(1); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            {/* STEP 1: DASHBOARD */}
            {withdrawStep === 1 && (
              <>
                <h2 className="text-xl font-bold text-white text-center mb-1">MISSION: 1 FREE TON 💎</h2>
                <p className="text-gray-400 text-xs text-center mb-6">Collect 20 Tickets to claim your reward</p>

                {loading ? (
                  <div className="text-white text-center py-8">Loading data...</div>
                ) : (
                  <div className="space-y-1">
                    <div className="grid grid-cols-12 text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 border-b border-gray-700 pb-2">
                      <div className="col-span-6">Source</div>
                      <div className="col-span-3 text-center">Progress</div>
                      <div className="col-span-3 text-right">Limit</div>
                    </div>

                    <TicketRow 
                      label="🛒 Bulk Store" 
                      condition="1 Ticket / 500k pts spent"
                      count={stats.bulk} 
                      limit={LIMITS.bulk} 
                    />
                    <TicketRow 
                      label="📺 Watch Ads" 
                      condition="1 Ticket / 20 videos watched"
                      count={stats.ads} 
                      limit={LIMITS.ads} 
                    />
                    <TicketRow 
                      label="🏦 Staking" 
                      condition="1 Ticket / 1M pts staked"
                      count={stats.staking} 
                      limit={LIMITS.staking} 
                    />
                    <TicketRow 
                      label="🆙 Level Up" 
                      condition="1 Ticket per Level gained"
                      count={stats.level} 
                      limit={LIMITS.level} 
                    />
                    <TicketRow 
                      label="📢 Social Task" 
                      condition="Create post & verify (72h)"
                      count={stats.social} 
                      limit={LIMITS.social} 
                    />
                    <TicketRow 
                      label="👥 Referrals" 
                      condition="1 Ticket / 5 Refs (Lvl 3)"
                      count={stats.referral} 
                      limit={null} 
                      isUnlimited 
                    />

                    <div className="mt-6 bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 flex justify-between items-center">
                      <span className="text-blue-200 font-bold">TOTAL COLLECTED:</span>
                      <span className="text-2xl font-bold text-white">
                        {totalTickets} <span className="text-gray-500 text-sm">/ {TARGET}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => totalTickets >= TARGET ? setWithdrawStep(2) : null}
                      disabled={totalTickets < TARGET}
                      className={`w-full py-3 rounded-xl font-bold text-lg mt-4 transition-all ${
                        totalTickets >= TARGET 
                          ? 'bg-green-500 hover:bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {totalTickets >= TARGET ? "REQUEST WITHDRAW 💸" : "LOCKED 🔒"}
                    </button>
                    {totalTickets < TARGET && (
                      <p className="text-xs text-center text-gray-500 mt-2">
                        You need {TARGET - totalTickets} more tickets to unlock.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* STEP 2: WITHDRAW INPUT */}
            {withdrawStep === 2 && (
              <>
                <h2 className="text-xl font-bold text-white text-center mb-6">💰 Claim Reward</h2>
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm text-center">
                    Congratulations! You've reached the goal. Please enter your TON Wallet address below.
                  </p>
                  
                  <div className="bg-yellow-900/20 border border-yellow-600/30 p-3 rounded-lg">
                    <p className="text-yellow-200 text-xs flex gap-2">
                      ⚠️ <strong>Important:</strong> Withdrawals are manually reviewed to ensure fair play. Processing time: <strong>24-48 hours</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs ml-1">Your TON Wallet Address</label>
                    <input 
                      type="text" 
                      placeholder="UQBj..." 
                      className="w-full bg-black/50 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono text-sm"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleWithdrawRequest}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold mt-2"
                  >
                    SUBMIT REQUEST
                  </button>
                  <button
                    onClick={() => setWithdrawStep(1)}
                    className="w-full text-gray-400 py-2 text-sm"
                  >
                    Go Back
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: SUCCESS */}
            {withdrawStep === 3 && (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-white mb-2">Request Sent!</h2>
                <p className="text-gray-400 text-sm mb-6">
                  We have received your request. The team will verify your activity and send 1 TON to your wallet within 48 hours.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
                >
                  AWESOME!
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TicketRow: React.FC<TicketRowProps> = ({ label, condition, count, limit, isUnlimited }) => {
  const isMaxed = !isUnlimited && limit !== null && count >= limit;
  
  return (
    <div className="grid grid-cols-12 items-center border-b border-gray-800 py-3 last:border-0 hover:bg-white/5 transition px-1 rounded">
      <div className="col-span-6 flex flex-col justify-center">
        <span className="text-sm text-gray-200 font-medium">{label}</span>
        <span className="text-[10px] text-gray-500 italic leading-tight mt-0.5">{condition}</span>
      </div>

      <div className={`col-span-3 text-center text-sm font-bold ${count > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
        💎 {count}
      </div>

      <div className="col-span-3 text-right text-xs flex items-center justify-end">
        {isUnlimited ? (
          <span className="text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded text-[10px]">UNLIMITED</span>
        ) : (
          <span className={isMaxed ? "text-red-400 font-bold" : "text-gray-500"}>
            Max {limit}
          </span>
        )}
      </div>
    </div>
  );
};

export default EarnTonSection;