import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { TrendingUp, Info, Lock, X } from 'lucide-react';

interface StakingModalProps {
    onClose: () => void;
}

interface Deposit {
    id: string;
    amount: number;
    roi_percent: number;
    unlock_date: string;
}

// 1. Nueva Interfaz para el StakeCard (Adiós 'any')
interface StakeCardProps {
    days: number;
    roi: number;
    isHot?: boolean;     // Opcional
    onClick: () => void;
    disabled?: boolean;  // Opcional
}

export const StakingModal: React.FC<StakingModalProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [purchased, setPurchased] = useState(0);
    const [level, setLevel] = useState(1);
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [loading, setLoading] = useState(false);

    // Lógica de Capacidad por Nivel
    const getCapPercent = (l: number) => {
        if(l>=8) return 75; if(l===7) return 50; if(l===6) return 35; if(l===5) return 20; if(l===4) return 10; return 0;
    };
    
    const capPercent = getCapPercent(level);
    const freePoints = Math.max(0, balance - purchased);
    // Si es nivel bajo (<4), damos un teaser de 10k. Si es alto, aplicamos %.
    const stakableFree = level < 4 ? 10000 : Math.floor(freePoints * (capPercent / 100));
    const totalStakable = Math.min(balance, purchased + stakableFree);

    useEffect(() => {
        if(!user) return;
        const fetchData = async () => {
            // 1. Cargar perfil
            const { data: u } = await supabase.from('user_score').select('*').eq('user_id', user.id).single();
            if(u) {
                setBalance(u.score);
                setPurchased(u.purchased_points);
                setLevel(Math.min(u.multitap_level, u.limit_level, u.speed_level));
            }
            // 2. Cargar depósitos
            const { data: d } = await supabase.from('staking_deposits').select('*').eq('user_id', user.id).order('unlock_date', {ascending: true});
            if(d) setDeposits(d as Deposit[]);
        };
        fetchData();
    }, [user, loading]);

    const handleStake = async (days: number) => {
        if(totalStakable <= 0) {
            alert("Saldo insuficiente. Sube de nivel o compra puntos.");
            return;
        }
        if(!window.confirm(`¿Bloquear ${totalStakable.toLocaleString()} pts por ${days} días?`)) return;

        setLoading(true);
        const { data, error } = await supabase.rpc('create_stake', { user_id_in: user!.id, duration: days });
        
        if(!error && data && data[0].success) alert(data[0].message);
        else alert(data?.[0]?.message || "Error");
        setLoading(false);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 3000,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }}>
            {/* Área transparente para cerrar al tocar fuera */}
            <div style={{flex: 1}} onClick={onClose} />

            <div className="glass-card" style={{ 
                margin: 0, borderRadius: '20px 20px 0 0', padding: '20px', 
                border: '1px solid #E040FB', borderBottom: 'none', 
                maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp 0.3s ease-out'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#E040FB', display:'flex', alignItems:'center', gap:'10px', margin:0, fontSize:'22px' }}>
                        <TrendingUp /> NOVA BANK
                    </h2>
                    <button onClick={onClose} style={{background:'none', border:'none', color:'#fff', cursor:'pointer'}}><X /></button>
                </div>
                
                {/* Tarjeta de Capacidad */}
                <div style={{ background: 'rgba(224, 64, 251, 0.1)', padding:'15px', borderRadius:'12px', marginBottom:'20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#aaa', marginBottom:'5px' }}>
                        <span>LEVEL {level} CAP</span>
                        <span>{level < 4 ? "TEASER (10k)" : `${capPercent}% FREE PTS`}</span>
                    </div>
                    <div style={{ fontSize:'28px', fontWeight:'bold', color:'#fff' }}>
                        {totalStakable.toLocaleString()}
                    </div>
                    <div style={{fontSize:'10px', color:'#E040FB', fontWeight:'bold'}}>AVAILABLE TO STAKE</div>
                    
                    {purchased > 0 && (
                        <div style={{ fontSize:'10px', color:'#fff', marginTop:'5px', display:'flex', alignItems:'center', gap:'5px' }}>
                            <Info size={12}/> Includes 100% of Purchased Points
                        </div>
                    )}
                </div>

                <h3 style={{fontSize:'14px', marginLeft:'5px', marginBottom:'10px'}}>Investment Plans</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px' }}>
                    <StakeCard days={15} roi={5} onClick={() => handleStake(15)} disabled={totalStakable<=0} />
                    <StakeCard days={30} roi={15} onClick={() => handleStake(30)} disabled={totalStakable<=0} />
                    <StakeCard days={60} roi={40} onClick={() => handleStake(60)} disabled={totalStakable<=0} />
                    <StakeCard days={90} roi={100} onClick={() => handleStake(90)} disabled={totalStakable<=0} isHot />
                </div>

                {/* Historial */}
                {deposits.length > 0 && (
                    <div>
                        <h4 style={{marginBottom:'10px', fontSize:'14px'}}>Active Deposits</h4>
                        <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                            {deposits.map(d => (
                                <div key={d.id} style={{ padding:'10px', background:'rgba(255,255,255,0.05)', borderRadius:'8px', display:'flex', justifyContent:'space-between', fontSize:'11px' }}>
                                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                        <Lock size={12} color="#aaa"/> 
                                        <span style={{fontWeight:'bold'}}>{d.amount.toLocaleString()}</span>
                                    </div>
                                    <div style={{textAlign:'right'}}>
                                        <div style={{color:'#4CAF50', fontWeight:'bold'}}>+{d.roi_percent}%</div>
                                        <div style={{color:'#aaa'}}>{new Date(d.unlock_date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>
    );
};

// 2. Componente StakeCard Corregido (Usando la nueva interfaz)
const StakeCard: React.FC<StakeCardProps> = ({ days, roi, isHot, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}
        className="glass-card" 
        style={{ 
            margin:0, padding:'15px 10px', cursor: disabled?'not-allowed':'pointer',
            border: isHot ? '1px solid #FFD700' : '1px solid rgba(255,255,255,0.1)',
            background: isHot ? 'rgba(255, 215, 0, 0.1)' : undefined,
            opacity: disabled ? 0.5 : 1, textAlign:'left', width:'100%', position:'relative'
        }}>
        {isHot && <div style={{position:'absolute', top:-8, right:-5, background:'#FFD700', color:'black', fontSize:'8px', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold'}}>BEST</div>}
        <div style={{ fontSize:'11px', color:'#aaa' }}>{days} Days</div>
        <div style={{ fontSize:'20px', fontWeight:'bold', color: isHot ? '#FFD700' : '#4CAF50' }}>+{roi}%</div>
    </button>
);