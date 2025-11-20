import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { TrendingUp, Info, Lock } from 'lucide-react';

// Definimos la forma de los datos para evitar errores de TypeScript
interface Deposit {
    id: string;
    amount: number;
    roi_percent: number;
    unlock_date: string;
}

export const StakingBank: React.FC = () => {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [purchased, setPurchased] = useState(0);
    const [level, setLevel] = useState(1);
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [loading, setLoading] = useState(false);

    // Lógica de Capacidad según Nivel (Frontend visual)
    const getCapPercent = (l: number) => {
        if(l>=8) return 75; if(l===7) return 50; if(l===6) return 35; if(l===5) return 20; if(l===4) return 10; return 0;
    };
    
    const capPercent = getCapPercent(level);
    // Cálculo: Puntos libres = Total - Comprados
    const freePoints = Math.max(0, balance - purchased);
    // Puntos gratis permitidos para staking
    const stakableFree = Math.floor(freePoints * (capPercent / 100));
    // Total disponible (Comprados siempre entran + % de gratis)
    const totalStakable = Math.min(balance, purchased + stakableFree);

    useEffect(() => {
        if(!user) return;
        const fetchData = async () => {
            // 1. Obtener datos del usuario
            const { data: u } = await supabase.from('user_score').select('*').eq('user_id', user.id).single();
            if(u) {
                setBalance(u.score);
                setPurchased(u.purchased_points);
                // El nivel es el mínimo de los tres atributos
                setLevel(Math.min(u.multitap_level, u.limit_level, u.speed_level));
            }
            
            // 2. Obtener depósitos activos desde la tabla correcta
            const { data: d } = await supabase
                .from('staking_deposits')
                .select('*')
                .eq('user_id', user.id)
                .order('unlock_date', {ascending: true});
                
            if(d) setDeposits(d as Deposit[]);
        };
        fetchData();
    }, [user, loading]); // Se recarga cuando 'loading' cambia (después de apostar)

    const handleStake = async (days: number) => {
        if(totalStakable <= 0) {
            alert("Saldo insuficiente para staking. Sube al Nivel 4 o compra puntos en la Tesorería.");
            return;
        }
        
        if(!window.confirm(`¿Bloquear ${totalStakable.toLocaleString()} pts por ${days} días?`)) return;

        setLoading(true);
        // Llamada a la función SQL real
        const { data, error } = await supabase.rpc('create_stake', { user_id_in: user!.id, duration: days });
        
        if(!error && data && data[0].success) {
            alert(data[0].message);
        } else {
            alert(data?.[0]?.message || error?.message || "Error desconocido");
        }
        setLoading(false);
    };

    return (
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ color: '#E040FB', display:'flex', alignItems:'center', gap:'10px', fontSize:'22px', margin:'0 0 15px 0' }}>
                <TrendingUp /> NOVA BANK
            </h2>
            
            {/* Tarjeta de Estado */}
            <div className="glass-card" style={{ background: 'rgba(224, 64, 251, 0.05)', borderColor: '#E040FB' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#aaa', marginBottom:'5px' }}>
                    <span>LEVEL {level} CAP</span>
                    <span>{capPercent}% FREE PTS</span>
                </div>
                <div style={{ fontSize:'24px', fontWeight:'bold', color:'#fff' }}>
                    {totalStakable.toLocaleString()} <span style={{fontSize:'12px', color:'#aaa'}}>STAKABLE</span>
                </div>
                
                {level < 8 && (
                    <div style={{ fontSize:'10px', color:'#E040FB', marginTop:'5px', display:'flex', alignItems:'center', gap:'5px' }}>
                        <Info size={12}/> 
                        {purchased > 0 ? "Includes 100% of Purchased Points" : "Buy points or Level Up to stake more!"}
                    </div>
                )}
            </div>

            <h3 style={{fontSize:'16px', marginLeft:'5px', marginTop:'20px'}}>Investment Plans</h3>
            
            {/* Grilla de Planes */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <StakeCard days={15} roi={5} onClick={() => handleStake(15)} disabled={totalStakable<=0} />
                <StakeCard days={30} roi={15} onClick={() => handleStake(30)} disabled={totalStakable<=0} />
                <StakeCard days={60} roi={40} onClick={() => handleStake(60)} disabled={totalStakable<=0} />
                <StakeCard days={90} roi={100} onClick={() => handleStake(90)} disabled={totalStakable<=0} isHot />
            </div>

            {/* Historial de Depósitos */}
            {deposits.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                    <h4 style={{marginBottom:'10px', fontSize:'14px'}}>My Active Deposits</h4>
                    <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                        {deposits.map(d => (
                            <div key={d.id} className="glass-card" style={{ padding:'10px', display:'flex', justifyContent:'space-between', fontSize:'11px', margin:0 }}>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <Lock size={14} color="#aaa"/> 
                                    <div>
                                        <div style={{fontWeight:'bold', fontSize:'12px'}}>{d.amount.toLocaleString()}</div>
                                        <div style={{color:'#aaa'}}>Unlock: {new Date(d.unlock_date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div style={{textAlign:'right'}}>
                                    <div style={{color:'#4CAF50', fontWeight:'bold', fontSize:'12px'}}>+{d.roi_percent}%</div>
                                    <div style={{color:'#4CAF50'}}>Profit: +{Math.floor(d.amount * d.roi_percent / 100).toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente Auxiliar para las Tarjetas
interface StakeCardProps {
    days: number;
    roi: number;
    isHot?: boolean;
    onClick: () => void;
    disabled: boolean;
}

const StakeCard: React.FC<StakeCardProps> = ({ days, roi, isHot, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}
        className="glass-card" 
        style={{ 
            margin:0, padding:'15px 10px', cursor: disabled?'not-allowed':'pointer',
            border: isHot ? '1px solid #FFD700' : '1px solid rgba(255,255,255,0.1)',
            background: isHot ? 'rgba(255, 215, 0, 0.1)' : undefined,
            opacity: disabled ? 0.5 : 1, textAlign:'left', width:'100%',
            position: 'relative'
        }}>
        {isHot && <div style={{position:'absolute', top:-8, right:-5, background:'#FFD700', color:'black', fontSize:'8px', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold'}}>BEST</div>}
        <div style={{ fontSize:'12px', color:'#aaa' }}>{days} Days</div>
        <div style={{ fontSize:'20px', fontWeight:'bold', color: isHot ? '#FFD700' : '#4CAF50' }}>+{roi}%</div>
    </button>
);