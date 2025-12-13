import React, { useState, useEffect } from 'react';
// Asegúrate que la ruta sea correcta según tu estructura de carpetas
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
  // Calculamos porcentaje para la barra visual (max 100%)
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
    <div className="w-full mt-6 mb-24 px-4">
      {/* --- ENTRY BUTTON (Diseño Mejorado) --- */}
      <div 
        onClick={() => setShowModal(true)}
        className="relative overflow-hidden bg-gradient-to-br from-[#0088cc] to-[#005577] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,136,204,0.3)] cursor-pointer transform transition active:scale-95 border border-blue-400/30"
      >
        {/* Decorative background circle */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

        <div className="flex justify-between items-center mb-3 relative z-10">
          <h3 className="text-white font-extrabold text-xl flex items-center gap-2 drop-shadow-md">
            💎 1 FREE TON
          </h3>
          <span className="bg-black/40 backdrop-blur-md text-white font-mono text-xs px-3 py-1.5 rounded-lg border border-white/10">
            {totalTickets}/{TARGET}
          </span>
        </div>

        {/* Barra de progreso mini en el botón */}
        <div className="w-full bg-black/30 rounded-full h-3 relative z-10 backdrop-blur-sm overflow-hidden border border-white/5">
          <div 
            className="bg-gradient-to-r from-blue-200 to-white h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        
        <p className="text-blue-100/80 text-xs mt-3 text-center font-medium relative z-10">
          Tap to view missions & claim reward ✨
        </p>
      </div>

      {/* --- MODAL (Diseño Nuevo) --- */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#151517] rounded-[32px] border border-[#333] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header del Modal */}
            <div className="px-6 pt-6 pb-4 bg-[#151517] z-10">
                <button 
                  onClick={() => { setShowModal(false); setWithdrawStep(1); }}
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#2c2c2e] text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>

                <h2 className="text-2xl font-black text-white text-center tracking-tight">
                    MISSION <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">TON</span> 💎
                </h2>
                
                {/* Barra de Progreso Grande */}
                <div className="mt-5 mb-1">
                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                        <span>Progress</span>
                        <span className={totalTickets >= TARGET ? "text-green-400" : "text-blue-400"}>
                            {Math.floor(progressPercent)}%
                        </span>
                    </div>
                    <div className="h-4 w-full bg-[#2c2c2e] rounded-full overflow-hidden border border-white/5 relative">
                        {/* Efecto de brillo de fondo */}
                        <div className="absolute top-0 bottom-0 left-0 w-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 transition-all duration-700 ease-out relative"
                            style={{ width: `${progressPercent}%` }}
                        >
                             <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 blur-[2px]"></div>
                        </div>
                    </div>
                    <div className="text-center mt-2 text-xs text-gray-500 font-mono">
                        {totalTickets} / {TARGET} Tickets Collected
                    </div>
                </div>
            </div>

            {/* Cuerpo Scrollable */}
            <div className="overflow-y-auto px-5 pb-6 custom-scrollbar">
                
                {/* STEP 1: DASHBOARD */}
                {withdrawStep === 1 && (
                  <>
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3">
                         <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                         <p className="text-gray-500 text-sm">Syncing blockchain...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 mt-2">
                        
                        <TicketRow 
                          label="Bulk Store" 
                          condition="Spend 500k pts"
                          count={stats.bulk} 
                          limit={LIMITS.bulk} 
                        />
                        <TicketRow 
                          label="Watch Ads" 
                          condition="20 videos watched"
                          count={stats.ads} 
                          limit={LIMITS.ads} 
                        />
                        <TicketRow 
                          label="Staking" 
                          condition="Stake 1M pts"
                          count={stats.staking} 
                          limit={LIMITS.staking} 
                        />
                        <TicketRow 
                          label="Level Up" 
                          condition="1 Ticket per Level"
                          count={stats.level} 
                          limit={LIMITS.level} 
                        />
                        <TicketRow 
                          label="Social Task" 
                          condition="Post & Verify"
                          count={stats.social} 
                          limit={LIMITS.social} 
                        />
                        <TicketRow 
                          label="Referrals" 
                          condition="5 Refs (Lvl 3)"
                          count={stats.referral} 
                          limit={null} 
                          isUnlimited 
                        />

                        {/* Botón de Acción Principal */}
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <button
                              onClick={() => totalTickets >= TARGET ? setWithdrawStep(2) : null}
                              disabled={totalTickets < TARGET}
                              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                                totalTickets >= TARGET 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-[1.02]' 
                                  : 'bg-[#2c2c2e] text-gray-500 cursor-not-allowed border border-white/5'
                              }`}
                            >
                              {totalTickets >= TARGET ? (
                                <><span>CLAIM 1 TON</span> 💸</>
                              ) : (
                                <><span>LOCKED</span> 🔒</>
                              )}
                            </button>
                            
                            {totalTickets < TARGET && (
                              <p className="text-[10px] text-center text-gray-600 mt-3 font-medium uppercase tracking-wide">
                                Need {TARGET - totalTickets} more tickets
                              </p>
                            )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* STEP 2: WITHDRAW INPUT */}
                {withdrawStep === 2 && (
                  <div className="animate-fadeIn">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl mb-6">
                      <h4 className="text-yellow-200 font-bold text-sm mb-1">⚠️ Verification Required</h4>
                      <p className="text-yellow-200/70 text-xs leading-relaxed">
                        Withdrawals are manually reviewed for fair play. Processing takes <strong>24-48 hours</strong>.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-gray-400 text-xs font-bold ml-1 uppercase tracking-wide">Your TON Wallet Address</label>
                        <input 
                          type="text" 
                          placeholder="UQBj..." 
                          className="w-full bg-[#000] border border-[#333] rounded-xl p-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm shadow-inner mt-2 transition-all"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                        />
                      </div>

                      <button
                        onClick={handleWithdrawRequest}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-[1.02] transition-transform"
                      >
                        SUBMIT REQUEST 🚀
                      </button>
                      
                      <button
                        onClick={() => setWithdrawStep(1)}
                        className="w-full text-gray-500 py-3 text-sm font-medium hover:text-gray-300 transition"
                      >
                        Cancel & Go Back
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: SUCCESS */}
                {withdrawStep === 3 && (
                  <div className="text-center py-10 animate-fadeIn flex flex-col items-center">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                        <span className="text-5xl">🎉</span>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3">Request Sent!</h2>
                    <p className="text-gray-400 text-sm mb-8 px-4 leading-relaxed">
                      We've received your request. The team will verify your activity and send <strong>1 TON</strong> to your wallet soon.
                    </p>
                    <button
                      onClick={() => setShowModal(false)}
                      className="w-full bg-[#2c2c2e] border border-white/10 text-white py-4 rounded-xl font-bold hover:bg-[#3a3a3d] transition"
                    >
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

// --- COMPONENTE TICKET ROW REDISEÑADO (Estilo Card) ---
const TicketRow: React.FC<TicketRowProps> = ({ label, condition, count, limit, isUnlimited }) => {
  const isMaxed = !isUnlimited && limit !== null && count >= limit;
  const progress = isUnlimited ? 100 : limit ? Math.min((count / limit) * 100, 100) : 0;
  
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 border transition-all duration-200 group ${
        isMaxed 
        ? 'bg-[#1a1a1c] border-green-500/20 opacity-80' // Estilo completado
        : 'bg-[#1e1e22] border-white/5 hover:border-blue-500/30 hover:bg-[#25252a]' // Estilo normal
    }`}>
      
      {/* Barra de progreso de fondo sutil */}
      {!isUnlimited && !isMaxed && (
          <div className="absolute bottom-0 left-0 h-1 bg-blue-500/20 z-0" style={{ width: `${progress}%` }}></div>
      )}

      <div className="flex justify-between items-center relative z-10">
        {/* Info Izquierda */}
        <div className="flex flex-col">
           <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isMaxed ? 'text-green-400' : 'text-gray-200'}`}>
                    {label}
                </span>
                {isMaxed && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 rounded font-bold">DONE</span>}
                {isUnlimited && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 rounded font-bold">∞</span>}
           </div>
           <span className="text-[11px] text-gray-500 mt-0.5">{condition}</span>
        </div>

        {/* Status Derecha */}
        <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
                <span className={`text-base font-bold ${count > 0 ? 'text-white' : 'text-gray-600'}`}>
                    {count}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                    / {isUnlimited ? '∞' : limit}
                </span>
            </div>
            <div className="text-[10px] text-blue-400 font-bold mt-0.5">TICKETS</div>
        </div>
      </div>
    </div>
  );
};

export default EarnTonSection;