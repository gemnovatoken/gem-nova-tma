import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, Lock } from 'lucide-react';

interface StakeData {
    id: string;
    amount: number;
    estimated_profit: number;
}

export const StakingBank = () => {
    const { user } = useAuth();
    
    const [stakes, setStakes] = useState<StakeData[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [amountToStake, setAmountToStake] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    // 👇 1. DEFINIMOS LA FUNCIÓN PRIMERO (Movida aquí arriba)
    const fetchData = async () => {
        if(!user) return;
        
        // A. Cargar historial de stakes
        const { data: stakeData } = await supabase
            .from('stakes') 
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active');
        
        if (stakeData) setStakes(stakeData as StakeData[]);

        // B. Cargar saldo actual del usuario
        const { data: userData } = await supabase
            .from('user_score')
            .select('score')
            .eq('user_id', user.id)
            .single();
        
        if (userData) setBalance(userData.score);
    };

    // 👇 2. USAMOS EL EFECTO DESPUÉS (Ahora ya conoce fetchData)
    useEffect(() => {
        if (!user) return;
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Función para calcular porcentaje
    const setPercentage = (pct: number) => {
        if (balance <= 0) return;
        const val = Math.floor(balance * pct);
        setAmountToStake(val.toString());
    };

    const handleStake = async () => {
        if (!user || !amountToStake) return;
        const amount = parseInt(amountToStake);
        
        if (amount <= 0 || amount > balance) {
            alert("Invalid amount");
            return;
        }

        setLoading(true);

        // Simulación de Staking
        console.log(`Staking ${amount} GNOVA...`);
        
        await new Promise(r => setTimeout(r, 1000));
        
        setLoading(false);
        setAmountToStake('');
        setShowSuccess(true); 
        
        // Recargamos datos para actualizar el saldo visualmente
        fetchData(); 
    };

    return (
        <div className="glass-card">
            <h3 style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <Lock size={20} color="#FFD700"/> Vault Staking
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#aaa', marginBottom:'5px'}}>
                    <span>Amount to lock</span>
                    <span>Balance: {balance.toLocaleString()}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="number" 
                        placeholder="0"
                        value={amountToStake}
                        onChange={(e) => setAmountToStake(e.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', border: 'none', width: '100%', background:'rgba(255,255,255,0.1)', color:'#fff', fontWeight:'bold' }}
                    />
                    <button className="btn-neon" onClick={handleStake} disabled={loading} style={{minWidth:'80px'}}>
                        {loading ? '...' : 'LOCK'}
                    </button>
                </div>

                {/* BOTONES DE PORCENTAJE */}
                <div style={{display:'flex', gap:'8px', marginTop:'10px'}}>
                    {[0.25, 0.50, 0.75, 1].map((pct) => (
                        <button 
                            key={pct}
                            onClick={() => setPercentage(pct)}
                            style={{
                                flex: 1, 
                                padding: '6px', 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '6px', 
                                color: '#00F2FE', 
                                fontSize: '11px', 
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            {pct * 100}%
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de Stakes */}
            <div>
                {stakes.length === 0 ? (
                    <p style={{ color: '#777', fontSize: '12px', textAlign:'center', marginTop:'20px' }}>No active stakes yet.</p>
                ) : (
                    stakes.map((stake) => (
                        <div key={stake.id} style={{ borderBottom: '1px solid #333', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                            <span>💎 {stake.amount}</span>
                            <span style={{ color: '#00F2FE' }}>Earn: +{stake.estimated_profit}</span>
                        </div>
                    ))
                )}
            </div>

            {/* --- MODAL DE FELICITACIÓN (SUCCESS) --- */}
            {showSuccess && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 6000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass-card" style={{
                        width: '100%', maxWidth: '300px', textAlign: 'center', 
                        border: '1px solid #4CAF50', boxShadow: '0 0 40px rgba(76, 175, 80, 0.3)'
                    }}>
                        <div style={{margin: '0 auto 15px', width: '70px', height: '70px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <CheckCircle color="#4CAF50" size={40} />
                        </div>
                        <h2 className="text-gradient" style={{margin: '0 0 10px 0'}}>CONGRATULATIONS!</h2>
                        <p style={{color: '#fff', fontWeight:'bold', fontSize:'16px'}}>Well Done, Miner.</p>
                        <p style={{color: '#aaa', fontSize: '13px', marginBottom:'25px'}}>
                            Your assets are now locked and generating yield. Smart move for the future!
                        </p>
                        <button className="btn-neon" onClick={() => setShowSuccess(false)} style={{width:'100%'}}>
                            CONTINUE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};