import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, Lock, Calendar, Zap, Shield, TrendingUp } from 'lucide-react';

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

// Configuración de Opciones
const FLASH_OPTION = { days: 1, roi: 0.02, label: '⚡ FLASH 24H', minLevel: 1 };

const DEEP_OPTIONS = [
    { days: 15, roi: 0.05, label: '15 DAYS', minLevel: 3 }, 
    { days: 30, roi: 0.15, label: '30 DAYS', minLevel: 3 }, 
    { days: 60, roi: 0.35, label: '60 DAYS', minLevel: 3 }, 
    { days: 90, roi: 0.60, label: '90 DAYS', minLevel: 3 }  
];

export const StakingBank: React.FC<Props> = ({ globalScore, setGlobalScore, userLevel = 1 }) => {
    const { user } = useAuth();
    const userId = user?.id; 

    const [stakes, setStakes] = useState<StakeData[]>([]);
    const [loading, setLoading] = useState(false);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [amountToStake, setAmountToStake] = useState('');
    const [selectedOption, setSelectedOption] = useState(FLASH_OPTION); 
    const [showSuccess, setShowSuccess] = useState(false);
    
    // 🔥 SOLUCIÓN AL ERROR: Trigger para recargar datos manualmente sin ciclos
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Ref para evitar fugas de memoria si el componente se desmonta
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // --- 1. LÓGICA DE SLOTS ---
    const getMaxSlots = (level: number) => {
        if (level >= 7) return 10;
        if (level >= 5) return 4;
        return 2; // Nivel 1-4
    };
    const maxSlots = getMaxSlots(userLevel);
    const usedSlots = stakes.length;

    // --- 2. LÓGICA DE CAPACIDAD ---
    const getDeepVaultCapPercent = (level: number) => {
        if (level <= 2) return 0;
        if (level === 3) return 0.10;
        if (level === 4) return 0.25;
        if (level === 5) return 0.40;
        if (level === 6) return 0.55;
        return 0.70; // Nivel 7+
    };

    const totalLocked = stakes.reduce((sum, s) => sum + s.amount, 0);

    let maxStakeable = 0;
    let capLabel = "";

    if (selectedOption.days === 1) {
        maxStakeable = globalScore;
        capLabel = "100% Balance";
    } else {
        const capPercent = getDeepVaultCapPercent(userLevel);
        const totalWealth = globalScore + totalLocked; 
        const totalAllowedInVault = Math.floor(totalWealth * capPercent);
        const remainingQuota = Math.max(0, totalAllowedInVault - totalLocked);
        maxStakeable = Math.min(globalScore, remainingQuota);
        capLabel = `${(capPercent * 100).toFixed(0)}% Quota`;
    }

    // --- CARGA DE DATOS (REFACTORIZADA) ---
    // Movemos la lógica dentro del useEffect para eliminar la dependencia externa que causaba el error
    useEffect(() => {
        if (!userId) return;

        const loadStakes = async () => {
            const { data: stakeData } = await supabase
                .from('stakes') 
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'active') 
                .order('end_at', { ascending: true });
            
            if (stakeData && isMounted.current) {
                setStakes(stakeData as StakeData[]);
            }
        };

        loadStakes(); // Carga inicial
        const interval = setInterval(loadStakes, 10000); // Polling cada 10s

        return () => clearInterval(interval);
    }, [userId, refreshTrigger]); // Se recarga si cambia el usuario o disparamos el trigger

    // Helper para forzar recarga
    const triggerReload = () => setRefreshTrigger(prev => prev + 1);

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
        
        if (amount > maxStakeable) { 
            alert(`Limit Exceeded! Based on your Level ${userLevel}, you can only stake ${maxStakeable.toLocaleString()} pts in this vault.`); 
            return; 
        }
        if (amount > globalScore) { alert("Insufficient balance."); return; }
        
        if (usedSlots >= maxSlots) {
            alert(`🔒 SLOT LIMIT REACHED (${usedSlots}/${maxSlots})\n\nLevel up to unlock more simultaneous deposits!`);
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
            setTimeout(triggerReload, 500); // Usamos el trigger seguro
        } else {
            alert("Transaction Failed");
        }
        if (isMounted.current) setLoading(false);
    };

    const handleClaimStake = async (stakeId: string) => {
        if (!window.confirm("Unlock and Claim?")) return;
        setClaimingId(stakeId);
        const { data, error } = await supabase.rpc('claim_stake', { stake_id_in: stakeId });

        if (error) alert("Error: " + error.message);
        else if (data && data[0].success) {
            alert(data[0].message); 
            setGlobalScore(data[0].new_balance);
            setTimeout(triggerReload, 500); // Usamos el trigger seguro
        }
        if (isMounted.current) setClaimingId(null);
    };

    return (
        <div className="glass-card" style={{position:'relative', overflow:'hidden'}}>
            {/* Header Futurista */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'10px'}}>
                <h3 style={{display:'flex', alignItems:'center', gap:'10px', margin:0, color:'#fff', letterSpacing:'1px'}}>
                    <Shield size={18} color="#00F2FE"/> CYBER VAULT
                </h3>
                <div style={{fontSize:'10px', color: usedSlots >= maxSlots ? '#FF5252' : '#4CAF50', border:'1px solid rgba(255,255,255,0.2)', padding:'2px 8px', borderRadius:'12px'}}>
                    SLOTS: {usedSlots} / {maxSlots}
                </div>
            </div>
            
            {/* 1. FLASH VAULT (Siempre disponible) */}
            <div 
                onClick={() => setSelectedOption(FLASH_OPTION)}
                style={{
                    background: selectedOption.days === 1 ? 'linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, rgba(0,0,0,0) 100%)' : 'rgba(255,255,255,0.03)',
                    border: selectedOption.days === 1 ? '1px solid #FFD700' : '1px solid #333',
                    borderRadius: '12px', padding: '12px', marginBottom: '15px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s'
                }}
            >
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{background:'rgba(255, 215, 0, 0.2)', padding:'8px', borderRadius:'50%'}}>
                        <Zap size={18} color="#FFD700"/>
                    </div>
                    <div>
                        <div style={{color:'#FFD700', fontWeight:'bold', fontSize:'13px'}}>FLASH STAKING</div>
                        <div style={{color:'#aaa', fontSize:'10px'}}>Duration: 24 Hours • No Limits</div>
                    </div>
                </div>
                <div style={{textAlign:'right'}}>
                    <div style={{color:'#fff', fontWeight:'bold', fontSize:'16px'}}>2%</div>
                    <div style={{color:'#666', fontSize:'9px'}}>ROI</div>
                </div>
            </div>

            {/* 2. DEEP VAULT SELECTOR (Grid) */}
            <div style={{marginBottom:'15px'}}>
                <div style={{fontSize:'10px', color:'#aaa', marginBottom:'8px', display:'flex', alignItems:'center', gap:'5px'}}>
                    <Lock size={10}/> DEEP STORAGE (Level Restricted)
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                    {DEEP_OPTIONS.map((opt) => {
                        const isLocked = userLevel < opt.minLevel;
                        const isSelected = selectedOption.label === opt.label;
                        
                        return (
                            <button key={opt.days} 
                                onClick={() => !isLocked && setSelectedOption(opt)}
                                disabled={isLocked}
                                style={{
                                    background: isSelected ? 'rgba(0, 242, 254, 0.15)' : (isLocked ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.03)'),
                                    border: isSelected ? '1px solid #00F2FE' : (isLocked ? '1px solid #333' : '1px solid rgba(255,255,255,0.1)'),
                                    borderRadius: '10px', padding: '10px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    opacity: isLocked ? 0.6 : 1, cursor: isLocked ? 'not-allowed' : 'pointer',
                                    position: 'relative', overflow: 'hidden'
                                }}
                            >
                                <div style={{textAlign:'left'}}>
                                    <div style={{color: isLocked ? '#666' : '#fff', fontWeight:'bold', fontSize:'12px'}}>{opt.days} DAYS</div>
                                    {isLocked && <div style={{color:'#FF5252', fontSize:'9px', display:'flex', alignItems:'center', gap:'2px'}}><Lock size={8}/> Lvl {opt.minLevel}</div>}
                                </div>
                                <div style={{color: isLocked ? '#666' : (isSelected ? '#00F2FE' : '#aaa'), fontWeight:'bold', fontSize:'14px'}}>
                                    {Math.floor(opt.roi * 100)}%
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. INPUT AREA */}
            <div style={{background:'rgba(0,0,0,0.2)', padding:'15px', borderRadius:'12px', border:'1px solid #333', marginBottom:'20px'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', fontSize:'11px'}}>
                    <span style={{color:'#aaa'}}>Available Quota:</span>
                    <span style={{color: selectedOption.days === 1 ? '#FFD700' : '#00F2FE'}}>{maxStakeable.toLocaleString()} <span style={{fontSize:'9px', color:'#666'}}>({capLabel})</span></span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <div style={{position:'relative', width:'100%'}}>
                        <input type="number" placeholder="0" value={amountToStake}
                            onChange={(e) => setAmountToStake(e.target.value)}
                            style={{ padding: '12px', borderRadius: '8px', border: 'none', width: '100%', background:'rgba(255,255,255,0.05)', color:'#fff', fontWeight:'bold', paddingRight:'50px', fontSize:'16px' }}
                        />
                        <span style={{position:'absolute', right:'12px', top:'14px', fontSize:'12px', color:'#aaa'}}>PTS</span>
                    </div>
                </div>

                <div style={{display:'flex', gap:'5px', marginBottom:'15px'}}>
                    {[0.25, 0.50, 0.75, 1].map((pct) => (
                        <button key={pct} onClick={() => setPercentage(pct)} style={{flex:1, padding:'6px', background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'4px', color:'#ccc', fontSize:'10px', cursor:'pointer'}}>
                            {pct * 100}%
                        </button>
                    ))}
                </div>

                <button className="btn-neon" onClick={handleStake} disabled={loading} style={{width:'100%', background: selectedOption.days === 1 ? '#FFD700' : '#00F2FE', color:'#000', border:'none'}}>
                    {loading ? 'PROCESSING...' : `LOCK FOR ${selectedOption.days} DAYS`}
                </button>

                {parseInt(amountToStake) > 0 && (
                    <div style={{marginTop:'10px', textAlign:'center', fontSize:'11px', color:'#aaa'}}>
                        Profit: <span style={{color:'#fff', fontWeight:'bold'}}>+{calculatedProfit.toLocaleString()} PTS</span>
                    </div>
                )}
            </div>

            {/* 4. ACTIVE LIST */}
            <h4 style={{margin:'0 0 10px 0', fontSize:'11px', color:'#aaa', display:'flex', alignItems:'center', gap:'5px', borderTop:'1px dashed #333', paddingTop:'15px'}}>
                <TrendingUp size={12}/> ACTIVE DEPOSITS
            </h4>
            
            {stakes.length === 0 ? (
                <div style={{ padding:'20px', textAlign:'center', opacity:0.5 }}>
                    <p style={{ color: '#666', fontSize: '12px', margin:0 }}>No active deposits.</p>
                </div>
            ) : (
                <div style={{display:'flex', flexDirection:'column', gap:'8px', maxHeight:'200px', overflowY:'auto'}}>
                    {stakes.map((stake) => {
                        const isReady = new Date(stake.end_at) < new Date();
                        const progressColor = isReady ? '#4CAF50' : (stake.duration_days === 1 ? '#FFD700' : '#00F2FE');
                        
                        return (
                            <div key={stake.id} style={{ padding: '10px', background:'rgba(255,255,255,0.02)', borderRadius:'8px', borderLeft:`3px solid ${progressColor}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <div>
                                    <div style={{color:'#fff', fontWeight:'bold', fontSize:'13px'}}>{stake.amount.toLocaleString()} PTS</div>
                                    <div style={{color:'#aaa', fontSize:'10px', display:'flex', alignItems:'center', gap:'4px'}}>
                                        <Calendar size={10}/> {stake.duration_days} Days ({stake.roi_percent * 100}%)
                                    </div>
                                </div>
                                {isReady ? (
                                    <button onClick={() => handleClaimStake(stake.id)} disabled={claimingId === stake.id}
                                        style={{background: '#4CAF50', color: '#000', border: 'none', borderRadius: '4px', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize:'10px'}}>
                                        {claimingId === stake.id ? '...' : 'CLAIM'}
                                    </button>
                                ) : (
                                    <div style={{textAlign:'right'}}>
                                        <div style={{color: progressColor, fontWeight:'bold', fontSize:'12px'}}>+{stake.estimated_return.toLocaleString()}</div>
                                        <div style={{color:'#666', fontSize:'9px'}}>LOCKED</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* SUCCESS MODAL */}
            {showSuccess && (
                <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
                    <div className="glass-card" style={{width: '100%', maxWidth: '300px', textAlign: 'center', border: '1px solid #4CAF50', boxShadow: '0 0 30px rgba(76, 175, 80, 0.2)'}}>
                        <div style={{margin: '0 auto 15px', width: '60px', height: '60px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <CheckCircle color="#4CAF50" size={32} />
                        </div>
                        <h2 style={{margin: '0 0 10px 0', color:'#fff'}}>DEPOSIT LOCKED</h2>
                        <p style={{color: '#ccc', fontSize: '12px', marginBottom:'20px'}}>
                            Your funds are generating interest.<br/>
                            Come back in {selectedOption.days} days!
                        </p>
                        <button className="btn-neon" onClick={() => setShowSuccess(false)} style={{width:'100%'}}>CONTINUE</button>
                    </div>
                </div>
            )}
        </div>
    );
};