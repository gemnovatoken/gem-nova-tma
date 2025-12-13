import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, Lock, Calendar, Info, Unlock } from 'lucide-react';

interface StakeData {
    id: string;
    amount: number;
    duration_days: number;
    roi_percent: number;
    estimated_return: number;
    end_at: string;
}

// Interfaz actualizada para recibir el Nivel desde el Padre
interface Props {
    globalScore: number; 
    setGlobalScore: (val: number) => void;
    userLevel?: number; // 🔥 Nuevo: Recibimos el nivel real aquí
}

const LOCK_OPTIONS = [
    { days: 1, roi: 0.02, label: 'TEST 1D', color: '#FFFFFF' }, 
    { days: 15, roi: 0.05, label: '15D', color: '#4CAF50' }, 
    { days: 30, roi: 0.15, label: '30D', color: '#00F2FE' }, 
    { days: 60, roi: 0.35, label: '60D', color: '#FF0055' }, 
    { days: 90, roi: 0.60, label: '90D', color: '#FFD700' }  
];

// Asignamos userLevel = 1 por defecto si no llega la prop
export const StakingBank: React.FC<Props> = ({ globalScore, setGlobalScore, userLevel = 1 }) => {
    const { user } = useAuth();
    const userId = user?.id; 

    const [stakes, setStakes] = useState<StakeData[]>([]);
    
    // Estados sincronizados con Base de Datos
    const [lifetimePurchased, setLifetimePurchased] = useState(0);
    // NOTA: Eliminamos 'realLevel' local. Usamos 'userLevel' directo de los props.

    const [loading, setLoading] = useState(false);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [amountToStake, setAmountToStake] = useState('');
    const [selectedOption, setSelectedOption] = useState(LOCK_OPTIONS[0]); 
    const [showSuccess, setShowSuccess] = useState(false);

    // 🔥 LÓGICA DE NIVELES CORREGIDA (Reglas Solicitadas)
    const getGameplayAllowance = (earnedPts: number, level: number) => {
        // Nivel 1 al 3: Tope fijo de 10,000 puntos
        if (level <= 3) {
            return Math.min(earnedPts, 10000);
        }
        
        // Niveles superiores: Porcentajes
        let pct = 0;
        if (level === 4) pct = 0.10;      // 10%
        else if (level === 5) pct = 0.20; // 20%
        else if (level === 6) pct = 0.35; // 35%
        else if (level === 7) pct = 0.50; // 50%
        else if (level >= 8) pct = 0.70;  // 70%

        return Math.floor(earnedPts * pct);
    };

    // Texto para la UI
    const getDisplayPercent = (level: number) => {
        if (level <= 3) return "Max 10k";
        if (level === 4) return "10%";
        if (level === 5) return "20%";
        if (level === 6) return "35%";
        if (level === 7) return "50%";
        return "70%";
    };
    
    // 🔥 MATEMÁTICA FINANCIERA
    // 1. Purchased: Mínimo entre lo que tienes hoy y lo que has comprado en total.
    const effectivePurchased = Math.min(globalScore, lifetimePurchased);
    
    // 2. Gameplay: Lo que sobra (Saldo total - Purchased).
    const earnedPoints = Math.max(0, globalScore - effectivePurchased);
    
    // 3. Staking Permitido
    const allowancePurchased = effectivePurchased; // 100% de lo comprado
    // Usamos 'userLevel' que viene de los props (App -> BulkStore -> Aquí)
    const stakeableEarned = getGameplayAllowance(earnedPoints, userLevel); 
    const maxStakeable = allowancePurchased + stakeableEarned;

    // --- CARGA DE DATOS ---
    const fetchData = useCallback(async () => {
        if(!userId) return;
        
        // 1. Cargar Stakes Activos
        const { data: stakeData } = await supabase
            .from('stakes') 
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active') 
            .order('end_at', { ascending: true });
        
        if (stakeData) setStakes(stakeData as StakeData[]);

        // 2. Carga Inteligente (Función SQL)
        // Solo necesitamos el lifetime_purchased. El nivel ya lo tenemos por props.
        const { data: smartData, error } = await supabase
            .rpc('get_staking_calculations', { user_id_input: userId });
        
        if (!error && smartData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const d = smartData as any;
            setLifetimePurchased(Number(d.lifetime_purchased));
            // Ya no sobreescribimos el nivel con la BD, confiamos en la App.
        }

    }, [userId]); // ⚠️ IMPORTANTE: globalScore NO está aquí para evitar el bucle

    useEffect(() => {
        if (!userId) return;
        
        // Ejecución inicial segura
        const timer = setTimeout(() => {
            fetchData();
        }, 0);

        const interval = setInterval(fetchData, 10000); 
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [userId, fetchData]);

    // Calcular ganancia estimada
    const calculatedProfit = amountToStake 
        ? Math.floor(parseInt(amountToStake) * selectedOption.roi) 
        : 0;

    const setPercentage = (pct: number) => {
        if (maxStakeable <= 0) return;
        const val = Math.floor(maxStakeable * pct);
        setAmountToStake(val.toString());
    };

    // --- STAKE ---
    const handleStake = async () => {
        if (!userId || !amountToStake) return;
        const amount = parseInt(amountToStake);
        
        if (amount <= 0) { alert("Enter a valid amount"); return; }
        if (amount > maxStakeable) { 
            alert(`Limit Exceeded! Your max stakeable allowance is ${maxStakeable.toLocaleString()}`); 
            return; 
        }
        if (amount > globalScore) { 
            alert("Insufficient balance."); 
            return; 
        }

        setLoading(true);

        const unlockDate = new Date();
        unlockDate.setDate(unlockDate.getDate() + selectedOption.days);

        const { data, error } = await supabase.rpc('create_stake_transaction', {
            p_user_id: userId,
            p_amount: amount,
            p_duration: selectedOption.days,
            p_roi: selectedOption.roi,
            p_estimated_return: calculatedProfit,
            p_end_at: unlockDate.toISOString()
        });

        if (error) {
            console.error("Stake Error:", error);
            alert(`System Error: ${error.message}`);
        } 
        else if (data && data[0].success) {
            setGlobalScore(data[0].new_balance); 
            setAmountToStake('');
            setShowSuccess(true);
            setTimeout(() => fetchData(), 500); 
        } 
        else {
            alert(data?.[0]?.message || "Transaction Failed");
        }
        
        setLoading(false);
    };

    // --- CLAIM ---
    const handleClaimStake = async (stakeId: string) => {
        if (!window.confirm("Unlock and Claim this Vault?")) return;
        setClaimingId(stakeId);
        
        const { data, error } = await supabase.rpc('claim_stake', { stake_id_in: stakeId });

        if (error) {
            alert("Error: " + error.message);
        } else if (data && data[0].success) {
            alert(data[0].message); 
            setGlobalScore(data[0].new_balance);
            setTimeout(() => fetchData(), 500); 
        } else {
            alert(data?.[0]?.message || "Cannot claim yet");
        }
        setClaimingId(null);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
    };

    const getPctColor = () => {
        if (userLevel <= 3) return '#FF5252'; 
        if (userLevel < 8) return '#FFD700'; 
        return '#4CAF50'; 
    };

    return (
        <div className="glass-card">
            <h3 style={{display:'flex', alignItems:'center', gap:'10px', marginTop:0, color:'#fff'}}>
                <Lock size={20} color="#FFD700"/> Vault Staking
            </h3>
            
            <div style={{background:'rgba(0,0,0,0.3)', padding:'12px', borderRadius:'8px', marginBottom:'20px', border:'1px solid #333'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#aaa', marginBottom:'8px'}}>
                    <span>Total Balance:</span>
                    <span style={{color:'#fff'}}>{globalScore.toLocaleString()}</span>
                </div>
                
                {/* Usamos userLevel directo de props */}
                <div style={{fontSize:'11px', color:'#666', marginBottom:'5px', display:'flex', gap:'5px', alignItems:'center'}}>
                    <Info size={10}/> ALLOWANCE (Lvl {userLevel}):
                </div>
                
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'2px'}}>
                    <span style={{color:'#00F2FE'}}>Purchased (100%):</span>
                    <span>{effectivePurchased.toLocaleString()}</span>
                </div>
                
                {/* Visualización dinámica */}
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'8px'}}>
                    <span style={{color: getPctColor()}}>
                        Gameplay ({getDisplayPercent(userLevel)}):
                    </span>
                    <span>
                        {stakeableEarned.toLocaleString()} 
                        <span style={{color:'#555', fontSize:'9px'}}> ({earnedPoints.toLocaleString()} Total)</span>
                    </span>
                </div>

                <div style={{borderTop:'1px dashed #444', paddingTop:'8px', display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#fff', fontWeight:'bold'}}>
                    <span>MAX STAKEABLE:</span>
                    <span style={{color:'#FFD700'}}>{maxStakeable.toLocaleString()}</span>
                </div>
            </div>

            {/* BOTONES DE SELECCIÓN */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'4px', marginBottom:'15px'}}>
                {LOCK_OPTIONS.map((opt) => (
                    <button key={opt.label} onClick={() => setSelectedOption(opt)}
                        style={{
                            padding: '8px 2px', borderRadius: '8px',
                            border: selectedOption.label === opt.label ? `1px solid ${opt.color}` : '1px solid rgba(255,255,255,0.1)',
                            background: selectedOption.label === opt.label ? `rgba(255,255,255,0.1)` : 'transparent',
                            color: '#fff', cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                        }}>
                        <span style={{fontWeight:'bold', fontSize:'10px'}}>{opt.label}</span>
                        <span style={{fontSize:'9px', color: opt.color}}>+{Math.floor(opt.roi * 100)}%</span>
                    </button>
                ))}
            </div>

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

            <div style={{display:'flex', gap:'5px', marginBottom:'20px'}}>
                {[0.25, 0.50, 0.75, 1].map((pct) => (
                    <button key={pct} onClick={() => setPercentage(pct)} style={{flex:1, padding:'6px', background:'rgba(255,255,255,0.05)', border:'none', borderRadius:'4px', color:'#aaa', fontSize:'10px', cursor:'pointer'}}>
                        {pct * 100}%
                    </button>
                ))}
            </div>

            {parseInt(amountToStake) > 0 && (
                <div style={{marginBottom:'25px', padding:'10px', background:'rgba(76, 175, 80, 0.1)', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #4CAF50'}}>
                    <div style={{fontSize:'12px', color:'#aaa'}}>Profit in {selectedOption.days} days:</div>
                    <div style={{color:'#4CAF50', fontWeight:'bold'}}>+{calculatedProfit.toLocaleString()} PTS</div>
                </div>
            )}

            <h4 style={{margin:'0 0 15px 0', fontSize:'12px', color:'#aaa', textTransform:'uppercase', letterSpacing:'1px', borderTop:'1px dashed #333', paddingTop:'15px'}}>
                Active Vaults ({stakes.length})
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
                                        <button 
                                            onClick={() => handleClaimStake(stake.id)}
                                            disabled={claimingId === stake.id}
                                            style={{
                                                background: '#4CAF50', color: '#000', border: 'none', 
                                                borderRadius: '4px', padding: '4px 12px', fontWeight: 'bold', 
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                                            }}
                                        >
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

            {showSuccess && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 6000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass-card" style={{width: '100%', maxWidth: '300px', textAlign: 'center', border: '1px solid #4CAF50', boxShadow: '0 0 30px rgba(76, 175, 80, 0.2)'}}>
                        <div style={{margin: '0 auto 15px', width: '60px', height: '60px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <CheckCircle color="#4CAF50" size={32} />
                        </div>
                        <h2 style={{margin: '0 0 10px 0', color:'#fff'}}>Success!</h2>
                        <p style={{color: '#ccc', fontSize: '14px', marginBottom:'20px'}}>
                            You locked <strong>{amountToStake} PTS</strong> for {selectedOption.days} days.
                        </p>
                        <button className="btn-neon" onClick={() => setShowSuccess(false)} style={{width:'100%'}}>CLOSE</button>
                    </div>
                </div>
            )}
        </div>
    );
};