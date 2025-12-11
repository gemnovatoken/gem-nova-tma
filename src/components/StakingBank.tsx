import { useState, useEffect, useCallback } from 'react';
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

const LOCK_OPTIONS = [
    // 👇 OPCIÓN DE PRUEBA
    { days: 1, roi: 0.02, label: 'TEST 1D', color: '#FFFFFF' }, 
    { days: 15, roi: 0.05, label: '15D', color: '#4CAF50' }, 
    { days: 30, roi: 0.15, label: '30D', color: '#00F2FE' }, 
    { days: 60, roi: 0.35, label: '60D', color: '#FF0055' }, 
    { days: 90, roi: 0.60, label: '90D', color: '#FFD700' }  
];

export const StakingBank = () => {
    const { user } = useAuth();
    const userId = user?.id; 

    const [stakes, setStakes] = useState<StakeData[]>([]);
    
    // Estados de Saldo
    const [totalScore, setTotalScore] = useState(0);
    const [purchasedPoints, setPurchasedPoints] = useState(0);
    const [userLevel, setUserLevel] = useState(1);
    
    const [loading, setLoading] = useState(false);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [amountToStake, setAmountToStake] = useState('');
    const [selectedOption, setSelectedOption] = useState(LOCK_OPTIONS[0]); 
    const [showSuccess, setShowSuccess] = useState(false);

    // LÓGICA DE NIVELES
    const getUnlockPercentage = (level: number) => {
        if (level >= 8) return 0.70; 
        if (level === 7) return 0.50; 
        if (level === 6) return 0.35; 
        if (level === 5) return 0.20; 
        return 0; 
    };

    const unlockPct = getUnlockPercentage(userLevel);
    
    // Matemática
    const effectivePurchased = Math.min(totalScore, purchasedPoints);
    const earnedPoints = Math.max(0, totalScore - purchasedPoints);
    const stakeableEarned = Math.floor(earnedPoints * unlockPct);
    const maxStakeable = effectivePurchased + stakeableEarned;

    // Cargar datos
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
            .select('score, total_bought_points, limit_level') 
            .eq('user_id', userId)
            .single();
        
        if (userData) {
            setTotalScore(userData.score);
            setPurchasedPoints(userData.total_bought_points || 0); 
            setUserLevel(userData.limit_level || 1);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        const initialLoad = setTimeout(() => fetchData(), 0);
        const interval = setInterval(fetchData, 5000); 
        return () => { clearTimeout(initialLoad); clearInterval(interval); };
    }, [userId, fetchData]);

    const calculatedProfit = amountToStake 
        ? Math.floor(parseInt(amountToStake) * selectedOption.roi) 
        : 0;

    const setPercentage = (pct: number) => {
        if (maxStakeable <= 0) return;
        const val = Math.floor(maxStakeable * pct);
        setAmountToStake(val.toString());
    };

    // --- FUNCIÓN DE STAKING SEGURA (TRANSACTION) ---
    const handleStake = async () => {
        if (!userId || !amountToStake) return;
        const amount = parseInt(amountToStake);
        
        if (amount <= 0) { alert("Enter a valid amount"); return; }
        if (amount > maxStakeable) { alert("Limit Exceeded!"); return; }
        if (amount > totalScore) { alert("Insufficient balance."); return; }

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
            // ✅ PASO 1: Actualizar visualmente DE INMEDIATO con el dato real
            const realNewBalance = data[0].new_balance;
            setTotalScore(realNewBalance); 
            
            // Limpiar formulario
            setAmountToStake('');
            setShowSuccess(true);

            // ✅ PASO 2: Esperar 2 segundos antes de refrescar la lista
            // Esto evita que leamos datos viejos mientras la DB termina de escribir
            setTimeout(() => {
                fetchData();
            }, 2000); 
        } 
        else {
            alert(data?.[0]?.message || "Transaction Failed");
        }
        
        setLoading(false);
    };

    // --- FUNCIÓN DE CLAIM (COBRAR) ---
    const handleClaimStake = async (stakeId: string) => {
        if (!window.confirm("Unlock and Claim this Vault?")) return;
        
        setClaimingId(stakeId);
        
        const { data, error } = await supabase.rpc('claim_stake', { stake_id_in: stakeId });

        if (error) {
            alert("Error: " + error.message);
        } else if (data && data[0].success) {
            alert(data[0].message); 
            
            // ✅ Actualizar saldo inmediatamente
            setTotalScore(data[0].new_balance);
            
            // ✅ Esperar un poco antes de recargar la lista
            setTimeout(() => {
                fetchData(); 
            }, 2000);
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
        if (unlockPct === 0) return '#FF5252';
        if (unlockPct < 0.5) return '#FFD700';
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
                    <span style={{color:'#fff'}}>{totalScore.toLocaleString()}</span>
                </div>
                
                <div style={{fontSize:'11px', color:'#666', marginBottom:'5px', display:'flex', gap:'5px', alignItems:'center'}}>
                    <Info size={10}/> ALLOWANCE (Lvl {userLevel}):
                </div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'2px'}}>
                    <span style={{color:'#00F2FE'}}>Purchased (100%):</span>
                    <span>{effectivePurchased.toLocaleString()}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'8px'}}>
                    <span style={{color: getPctColor()}}>Gameplay ({unlockPct * 100}%):</span>
                    <span>{stakeableEarned.toLocaleString()}</span>
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
                        // Verificamos si ya pasó el tiempo
                        const isReady = new Date(stake.end_at) < new Date();
                        
                        return (
                            <div key={stake.id} style={{ padding: '12px', background:'rgba(255,255,255,0.03)', borderRadius:'10px', borderLeft:`3px solid ${isReady ? '#4CAF50' : '#00F2FE'}` }}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                    <span style={{color:'#fff', fontWeight:'bold'}}>💎 {stake.amount.toLocaleString()}</span>
                                    <span style={{color:'#4CAF50', fontSize:'12px', fontWeight:'bold'}}>+{stake.estimated_return.toLocaleString()}</span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'11px', color:'#888'}}>
                                    
                                    {isReady ? (
                                        // BOTÓN DE COBRO
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
                                        // RELOJ DE CUENTA REGRESIVA
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
                            You locked <strong>{amountToStake} PTS</strong> for {selectedOption.days} days.<br/>
                            Estimated Return: <span style={{color:'#4CAF50'}}>+{calculatedProfit} PTS</span>
                        </p>
                        <button className="btn-neon" onClick={() => setShowSuccess(false)} style={{width:'100%'}}>CLOSE</button>
                    </div>
                </div>
            )}
        </div>
    );
};