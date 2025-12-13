import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, Lock, Calendar, Info, Unlock, ShieldCheck } from 'lucide-react';

interface StakeData {
    id: string;
    amount: number;
    duration_days: number;
    roi_percent: number;
    estimated_return: number;
    end_at: string;
}

interface Props {
    globalScore: number; 
    setGlobalScore: (val: number) => void;
    userLevel?: number; 
}

// Configuración Visual del Botón "LIMITED"
const LOCK_OPTIONS = [
    { days: 1, roi: 0.02, label: '⚡ LIMITED', color: '#FFD700', isPromo: true }, 
    { days: 15, roi: 0.05, label: '15D', color: '#4CAF50' }, 
    { days: 30, roi: 0.15, label: '30D', color: '#00F2FE' }, 
    { days: 60, roi: 0.35, label: '60D', color: '#FF0055' }, 
    { days: 90, roi: 0.60, label: '90D', color: '#FFD700' }  
];

export const StakingBank: React.FC<Props> = ({ globalScore, setGlobalScore, userLevel = 1 }) => {
    const { user } = useAuth();
    const userId = user?.id; 

    const [stakes, setStakes] = useState<StakeData[]>([]);
    const [lifetimePurchased, setLifetimePurchased] = useState(0);
    
    const [loading, setLoading] = useState(false);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [amountToStake, setAmountToStake] = useState('');
    const [selectedOption, setSelectedOption] = useState(LOCK_OPTIONS[0]); 
    const [showSuccess, setShowSuccess] = useState(false);

    // --- LÓGICA DE NIVELES (GAMEPLAY) ---
    const getGameplayAllowance = (earnedPts: number, level: number) => {
        if (level <= 3) return Math.min(earnedPts, 10000);
        
        let pct = 0;
        if (level === 4) pct = 0.10;      
        else if (level === 5) pct = 0.20; 
        else if (level === 6) pct = 0.35; 
        else if (level === 7) pct = 0.50; 
        else if (level >= 8) pct = 0.70;  

        return Math.floor(earnedPts * pct);
    };

    const getDisplayPercent = (level: number) => {
        if (level <= 3) return "Max 10k";
        if (level === 4) return "10%";
        if (level === 5) return "20%";
        if (level === 6) return "35%";
        if (level === 7) return "50%";
        return "70%";
    };
    
    // --- 🔥 MATEMÁTICA CORREGIDA: SEPARACIÓN STRICTA 🔥 ---
    
    // 1. Purchased: Solo lo que se ha comprado históricamente, limitado por lo que tienes en mano.
    // Si lifetimePurchased es 0 (nunca compró), esto será 0.
    const purchasedInWallet = Math.min(globalScore, lifetimePurchased);
    
    // 2. Gameplay: Todo lo que sobra. (Total - Comprado = Ganado en Juego)
    const gameplayInWalletRaw = Math.max(0, globalScore - purchasedInWallet);
    
    // 3. Stakeable de Gameplay: Aplicamos el % o límite según nivel
    const gameplayStakeable = getGameplayAllowance(gameplayInWalletRaw, userLevel);

    // 4. TOTAL DISPONIBLE (Suma de lo comprado + lo permitido del juego)
    const maxStakeable = purchasedInWallet + gameplayStakeable;


    // --- CARGA DE DATOS ---
    const fetchData = useCallback(async () => {
        if(!userId) return;
        
        const { data: stakeData } = await supabase
            .from('stakes') 
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active') 
            .order('end_at', { ascending: true });
        
        if (stakeData) setStakes(stakeData as StakeData[]);

        const { data: userData } = await supabase
            .from('user_score')
            .select('total_bought_points')
            .eq('user_id', userId)
            .single();
        
        if (userData) {
            // Aseguramos que sea un número válido
            setLifetimePurchased(Number(userData.total_bought_points) || 0);
        }
    }, [userId]); 

    useEffect(() => {
        if (!userId) return;
        const timer = setTimeout(() => fetchData(), 0);
        const interval = setInterval(fetchData, 10000); 
        return () => { clearTimeout(timer); clearInterval(interval); };
    }, [userId, fetchData]);

    // UI Helpers
    const calculatedProfit = amountToStake ? Math.floor(parseInt(amountToStake) * selectedOption.roi) : 0;
    
    const setPercentage = (pct: number) => {
        if (maxStakeable <= 0) return;
        setAmountToStake(Math.floor(maxStakeable * pct).toString());
    };

    // --- FUNCIÓN STAKE ---
    const handleStake = async () => {
        if (!userId || !amountToStake) return;
        const amount = parseInt(amountToStake);
        
        if (amount <= 0) { alert("Enter a valid amount"); return; }
        
        // 1. Validar Límite Financiero
        if (amount > maxStakeable) { 
            alert(`Limit Exceeded! You can stake max ${maxStakeable.toLocaleString()} pts right now.`); 
            return; 
        }
        if (amount > globalScore) { alert("Insufficient balance."); return; }

        // --- VALIDACIÓN DE SLOTS (3 MÁXIMO PARA GAMEPLAY) ---
        // Si lo que intentas stakear cabe dentro de tu saldo "Comprado", es VIP (Ilimitado).
        // Si excede tu saldo comprado, estás usando puntos de juego, por lo tanto aplica límite de slots.
        const isVipStake = amount <= purchasedInWallet;

        if (!isVipStake && stakes.length >= 3) {
            alert(`🔒 SLOT LIMIT REACHED (3/3)\n\nYou have 3 active vaults. You cannot stake Gameplay points until one unlocks.\n\n✨ TIP: Purchased points bypass this limit!`);
            return;
        }

        setLoading(true);
        const unlockDate = new Date();
        unlockDate.setDate(unlockDate.getDate() + selectedOption.days);

        const { data, error } = await supabase.rpc('create_stake_transaction', {
            p_user_id: userId, p_amount: amount, p_duration: selectedOption.days,
            p_roi: selectedOption.roi, p_estimated_return: calculatedProfit,
            p_end_at: unlockDate.toISOString()
        });

        if (error) {
            alert(`Error: ${error.message}`);
        } else if (data && data[0].success) {
            setGlobalScore(data[0].new_balance); 
            setAmountToStake('');
            setShowSuccess(true);
            setTimeout(() => fetchData(), 500); 
        } else {
            alert("Transaction Failed");
        }
        setLoading(false);
    };

    const handleClaimStake = async (stakeId: string) => {
        if (!window.confirm("Unlock and Claim?")) return;
        setClaimingId(stakeId);
        const { data, error } = await supabase.rpc('claim_stake', { stake_id_in: stakeId });

        if (error) alert("Error: " + error.message);
        else if (data && data[0].success) {
            alert(data[0].message); 
            setGlobalScore(data[0].new_balance);
            setTimeout(() => fetchData(), 500); 
        }
        setClaimingId(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit' });
    };

    const getPctColor = () => (userLevel <= 3 ? '#FF5252' : '#4CAF50');

    return (
        <div className="glass-card">
            <h3 style={{display:'flex', alignItems:'center', gap:'10px', marginTop:0, color:'#fff'}}>
                <Lock size={20} color="#FFD700"/> Vault Staking
            </h3>
            
            {/* PANEL DE INFORMACIÓN */}
            <div style={{background:'rgba(0,0,0,0.3)', padding:'12px', borderRadius:'8px', marginBottom:'20px', border:'1px solid #333'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#aaa', marginBottom:'8px'}}>
                    <span>Total Balance:</span>
                    <span style={{color:'#fff'}}>{globalScore.toLocaleString()}</span>
                </div>
                
                <div style={{fontSize:'11px', color:'#666', marginBottom:'5px', display:'flex', gap:'5px', alignItems:'center'}}>
                    <Info size={10}/> ALLOWANCE (Lvl {userLevel}):
                </div>
                
                {/* FILA PURCHASED */}
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'2px'}}>
                    <span style={{color:'#00F2FE', display:'flex', alignItems:'center', gap:'4px'}}>
                        Purchased (Unlimited): <ShieldCheck size={10}/>
                    </span>
                    <span>{purchasedInWallet.toLocaleString()}</span>
                </div>
                
                {/* FILA GAMEPLAY */}
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'8px'}}>
                    <span style={{color: getPctColor()}}>
                        Gameplay ({getDisplayPercent(userLevel)}):
                    </span>
                    {/* Muestra cuánto puedes stakear vs cuánto tienes en total de juego */}
                    <span>{gameplayStakeable.toLocaleString()} <span style={{color:'#555', fontSize:'9px'}}>({gameplayInWalletRaw.toLocaleString()} Total)</span></span>
                </div>

                <div style={{borderTop:'1px dashed #444', paddingTop:'8px', display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#fff', fontWeight:'bold'}}>
                    <span>AVAILABLE TO STAKE:</span>
                    <span style={{color:'#FFD700'}}>{maxStakeable.toLocaleString()}</span>
                </div>
            </div>

            {/* BOTONES DE SELECCIÓN */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'4px', marginBottom:'15px'}}>
                {LOCK_OPTIONS.map((opt) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const isPromo = (opt as any).isPromo;
                    const isSelected = selectedOption.label === opt.label;
                    return (
                        <button key={opt.label} onClick={() => setSelectedOption(opt)}
                            style={{
                                padding: '8px 2px', borderRadius: '8px',
                                border: isSelected ? `1px solid ${opt.color}` : (isPromo ? `1px dashed ${opt.color}` : '1px solid rgba(255,255,255,0.1)'),
                                background: isSelected ? `rgba(255,255,255,0.1)` : (isPromo ? 'rgba(255, 215, 0, 0.1)' : 'transparent'),
                                color: '#fff', cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                animation: (isPromo && !isSelected) ? 'pulse-gold 2s infinite' : 'none'
                            }}>
                            <span style={{fontWeight:'bold', fontSize: isPromo ? '9px' : '10px', color: isPromo ? '#FFD700' : 'white'}}>{opt.label}</span>
                            <span style={{fontSize:'9px', color: opt.color}}>+{Math.floor(opt.roi * 100)}%</span>
                        </button>
                    );
                })}
            </div>

            {/* INPUT Y BOTÓN */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{position:'relative', width:'100%'}}>
                    <input type="number" placeholder="Amount" value={amountToStake}
                        onChange={(e) => setAmountToStake(e.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', border: 'none', width: '100%', background:'rgba(255,255,255,0.1)', color:'#fff', fontWeight:'bold', paddingRight:'50px' }}
                    />
                    <span style={{position:'absolute', right:'12px', top:'12px', fontSize:'12px', color:'#aaa'}}>PTS</span>
                </div>
                <button className="btn-neon" onClick={handleStake} disabled={loading} style={{minWidth:'80px'}}>
                    {loading ? '...' : 'LOCK'}
                </button>
            </div>

            {/* SLIDER */}
            <div style={{display:'flex', gap:'5px', marginBottom:'20px'}}>
                {[0.25, 0.50, 0.75, 1].map((pct) => (
                    <button key={pct} onClick={() => setPercentage(pct)} style={{flex:1, padding:'6px', background:'rgba(255,255,255,0.05)', border:'none', borderRadius:'4px', color:'#aaa', fontSize:'10px', cursor:'pointer'}}>
                        {pct * 100}%
                    </button>
                ))}
            </div>

            {/* PREVIEW */}
            {parseInt(amountToStake) > 0 && (
                <div style={{marginBottom:'25px', padding:'10px', background:'rgba(76, 175, 80, 0.1)', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #4CAF50'}}>
                    <div style={{fontSize:'12px', color:'#aaa'}}>Profit in {selectedOption.days} days:</div>
                    <div style={{color:'#4CAF50', fontWeight:'bold'}}>+{calculatedProfit.toLocaleString()} PTS</div>
                </div>
            )}

            {/* LISTA DE ACTIVOS */}
            <h4 style={{margin:'0 0 15px 0', fontSize:'12px', color:'#aaa', textTransform:'uppercase', letterSpacing:'1px', borderTop:'1px dashed #333', paddingTop:'15px', display:'flex', justifyContent:'space-between'}}>
                <span>Active Vaults</span>
                <span style={{color: stakes.length >= 3 ? '#FFD700' : '#666', fontSize:'10px', display:'flex', alignItems:'center', gap:'4px'}}>
                    {stakes.length >= 3 && <Lock size={10}/>} SLOTS: {stakes.length}/3
                </span>
            </h4>
            
            {stakes.length === 0 ? (
                <div style={{ padding:'20px', textAlign:'center', opacity:0.5 }}>
                    <Lock size={30} color="#555" style={{marginBottom:'5px'}}/>
                    <p style={{ color: '#888', fontSize: '12px', margin:0 }}>Your vault is empty.</p>
                </div>
            ) : (
                <div style={{display:'flex', flexDirection:'column', gap:'10px', maxHeight:'200px', overflowY:'auto'}}>
                    {stakes.map((stake) => {
                        const isReady = new Date(stake.end_at) < new Date();
                        return (
                            <div key={stake.id} style={{ padding: '12px', background:'rgba(255,255,255,0.03)', borderRadius:'10px', borderLeft:`3px solid ${isReady ? '#4CAF50' : '#00F2FE'}` }}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                    <span style={{color:'#fff', fontWeight:'bold'}}>💎 {stake.amount.toLocaleString()}</span>
                                    <span style={{color:'#4CAF50', fontSize:'12px', fontWeight:'bold'}}>+{stake.estimated_return.toLocaleString()}</span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'11px', color:'#888'}}>
                                    {isReady ? (
                                        <button onClick={() => handleClaimStake(stake.id)} disabled={claimingId === stake.id}
                                            style={{background: '#4CAF50', color: '#000', border: 'none', borderRadius: '4px', padding: '4px 12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
                                            {claimingId === stake.id ? '...' : <><Unlock size={12}/> CLAIM NOW</>}
                                        </button>
                                    ) : (
                                        <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                                            <Calendar size={10}/> Unlocks: {formatDate(stake.end_at)}
                                        </div>
                                    )}
                                    <div>{stake.duration_days} Days ({stake.roi_percent * 100}%)</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL */}
            {showSuccess && (
                <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
                    <div className="glass-card" style={{width: '100%', maxWidth: '300px', textAlign: 'center', border: '1px solid #4CAF50', boxShadow: '0 0 30px rgba(76, 175, 80, 0.2)'}}>
                        <div style={{margin: '0 auto 15px', width: '60px', height: '60px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <CheckCircle color="#4CAF50" size={32} />
                        </div>
                        <h2 style={{margin: '0 0 10px 0', color:'#fff'}}>Success!</h2>
                        <p style={{color: '#ccc', fontSize: '14px', marginBottom:'20px'}}>You locked <strong>{amountToStake} PTS</strong> for {selectedOption.days} days.</p>
                        <button className="btn-neon" onClick={() => setShowSuccess(false)} style={{width:'100%'}}>CLOSE</button>
                    </div>
                </div>
            )}
            
            <style>{`@keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(255, 215, 0, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); } }`}</style>
        </div>
    );
};