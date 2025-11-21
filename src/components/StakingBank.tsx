import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, Lock, Calendar, Info } from 'lucide-react';

interface StakeData {
    id: string;
    amount: number;
    duration_days: number;
    roi_percent: number;
    estimated_return: number;
    end_at: string;
}

const LOCK_OPTIONS = [
    { days: 15, roi: 0.05, label: '15D', color: '#4CAF50' }, // 5%
    { days: 30, roi: 0.15, label: '30D', color: '#00F2FE' }, // 15%
    { days: 60, roi: 0.35, label: '60D', color: '#FF0055' }, // 35%
    { days: 90, roi: 0.60, label: '90D', color: '#FFD700' }  // 60%
];

export const StakingBank = () => {
    const { user } = useAuth();
    
    const [stakes, setStakes] = useState<StakeData[]>([]);
    
    // Estados de Saldo
    const [totalScore, setTotalScore] = useState(0);
    const [purchasedPoints, setPurchasedPoints] = useState(0);
    const [userLevel, setUserLevel] = useState(1); // Usamos limit_level como referencia
    
    const [loading, setLoading] = useState(false);
    const [amountToStake, setAmountToStake] = useState('');
    const [selectedOption, setSelectedOption] = useState(LOCK_OPTIONS[1]); 
    const [showSuccess, setShowSuccess] = useState(false);

    // 💰 LÓGICA PROGRESIVA DE NIVELES
    const getUnlockPercentage = (level: number) => {
        if (level >= 8) return 0.70; // 70%
        if (level === 7) return 0.50; // 50%
        if (level === 6) return 0.35; // 35%
        if (level === 5) return 0.20; // 20%
        return 0; // Nivel 1-4: 0%
    };

    const unlockPct = getUnlockPercentage(userLevel);
    
    // 1. Calculamos puntos jugados
    const earnedPoints = Math.max(0, totalScore - purchasedPoints);
    
    // 2. Aplicamos el porcentaje según nivel
    const stakeableEarned = Math.floor(earnedPoints * unlockPct);
    
    // 3. Total disponible para Staking
    const maxStakeable = purchasedPoints + stakeableEarned;

    const fetchData = async () => {
        if(!user) return;
        
        const { data: stakeData } = await supabase
            .from('stakes') 
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('end_at', { ascending: true });
        
        if (stakeData) setStakes(stakeData as StakeData[]);

        const { data: userData } = await supabase
            .from('user_score')
            .select('score, purchased_points, limit_level')
            .eq('user_id', user.id)
            .single();
        
        if (userData) {
            setTotalScore(userData.score);
            setPurchasedPoints(userData.purchased_points || 0);
            setUserLevel(userData.limit_level || 1);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const calculatedProfit = amountToStake 
        ? Math.floor(parseInt(amountToStake) * selectedOption.roi) 
        : 0;

    const setPercentage = (pct: number) => {
        if (maxStakeable <= 0) return;
        const val = Math.floor(maxStakeable * pct);
        setAmountToStake(val.toString());
    };

    const handleStake = async () => {
        if (!user || !amountToStake) return;
        const amount = parseInt(amountToStake);
        
        if (amount <= 0) {
            alert("Enter a valid amount");
            return;
        }
        if (amount > maxStakeable) {
            alert(`⚠️ Limit Exceeded!\n\nMax Stakeable: ${maxStakeable.toLocaleString()}\n\nReason:\n- Purchased: 100% Unlocked\n- Gameplay: ${unlockPct * 100}% Unlocked (Lvl ${userLevel})`);
            return;
        }
        if (amount > totalScore) {
            alert("Insufficient balance.");
            return;
        }

        setLoading(true);

        const unlockDate = new Date();
        unlockDate.setDate(unlockDate.getDate() + selectedOption.days);

        const { error: stakeError } = await supabase.from('stakes').insert({
            user_id: user.id,
            amount: amount,
            duration_days: selectedOption.days,
            roi_percent: selectedOption.roi,
            estimated_return: calculatedProfit,
            end_at: unlockDate.toISOString()
        });

        if (!stakeError) {
            await supabase.rpc('deduct_points', { 
                user_id_in: user.id, 
                amount_in: amount 
            });
            
            await new Promise(r => setTimeout(r, 800));
            setLoading(false);
            setAmountToStake('');
            setShowSuccess(true); 
            fetchData();
        } else {
            alert("Error creating stake");
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Color dinámico para el texto de porcentaje
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
            
            {/* --- PANEL DE REGLAS DE LIQUIDEZ --- */}
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
                    <span>{purchasedPoints.toLocaleString()}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'8px'}}>
                    <span style={{color: getPctColor()}}>
                        Gameplay ({unlockPct * 100}%):
                    </span>
                    <span>{stakeableEarned.toLocaleString()}</span>
                </div>

                <div style={{borderTop:'1px dashed #444', paddingTop:'8px', display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#fff', fontWeight:'bold'}}>
                    <span>MAX STAKEABLE:</span>
                    <span style={{color:'#FFD700'}}>{maxStakeable.toLocaleString()}</span>
                </div>
            </div>

            {/* --- SELECTOR DE DÍAS --- */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'8px', marginBottom:'15px'}}>
                {LOCK_OPTIONS.map((opt) => (
                    <button 
                        key={opt.days}
                        onClick={() => setSelectedOption(opt)}
                        style={{
                            padding: '8px 4px',
                            borderRadius: '8px',
                            border: selectedOption.days === opt.days ? `1px solid ${opt.color}` : '1px solid rgba(255,255,255,0.1)',
                            background: selectedOption.days === opt.days ? `rgba(255,255,255,0.1)` : 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                        }}
                    >
                        <span style={{fontWeight:'bold', fontSize:'14px'}}>{opt.label}</span>
                        <span style={{fontSize:'10px', color: opt.color}}>+{opt.roi * 100}%</span>
                    </button>
                ))}
            </div>

            {/* --- INPUT --- */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{position:'relative', width:'100%'}}>
                    <input 
                        type="number" 
                        placeholder="Amount"
                        value={amountToStake}
                        onChange={(e) => setAmountToStake(e.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', border: 'none', width: '100%', background:'rgba(255,255,255,0.1)', color:'#fff', fontWeight:'bold', paddingRight:'50px' }}
                    />
                    <span style={{position:'absolute', right:'12px', top:'12px', fontSize:'12px', color:'#aaa'}}>PTS</span>
                </div>
                <button className="btn-neon" onClick={handleStake} disabled={loading} style={{minWidth:'80px'}}>
                    {loading ? '...' : 'LOCK'}
                </button>
            </div>

            {/* --- PORCENTAJES --- */}
            <div style={{display:'flex', gap:'5px', marginBottom:'20px'}}>
                {[0.25, 0.50, 0.75, 1].map((pct) => (
                    <button key={pct} onClick={() => setPercentage(pct)} style={{flex:1, padding:'6px', background:'rgba(255,255,255,0.05)', border:'none', borderRadius:'4px', color:'#aaa', fontSize:'10px', cursor:'pointer'}}>
                        {pct * 100}%
                    </button>
                ))}
            </div>

            {/* Previsualización */}
            {parseInt(amountToStake) > 0 && (
                <div style={{marginBottom:'25px', padding:'10px', background:'rgba(76, 175, 80, 0.1)', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #4CAF50'}}>
                    <div style={{fontSize:'12px', color:'#aaa'}}>Profit in {selectedOption.days} days:</div>
                    <div style={{color:'#4CAF50', fontWeight:'bold'}}>+{calculatedProfit.toLocaleString()} PTS</div>
                </div>
            )}

            {/* --- HISTORIAL --- */}
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
                    {stakes.map((stake) => (
                        <div key={stake.id} style={{ padding: '12px', background:'rgba(255,255,255,0.03)', borderRadius:'10px', borderLeft:`3px solid ${stake.duration_days >= 90 ? '#FFD700' : '#00F2FE'}` }}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                <span style={{color:'#fff', fontWeight:'bold'}}>💎 {stake.amount.toLocaleString()}</span>
                                <span style={{color:'#4CAF50', fontSize:'12px', fontWeight:'bold'}}>+{stake.estimated_return.toLocaleString()}</span>
                            </div>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#888'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                                    <Calendar size={10}/> Unlocks: {formatDate(stake.end_at)}
                                </div>
                                <div>{stake.duration_days} Days ({stake.roi_percent * 100}%)</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- MODAL ÉXITO --- */}
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