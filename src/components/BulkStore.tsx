import React, { useState } from 'react';
import { X, Lock, TrendingUp, Clock, AlertCircle, Coins } from 'lucide-react';

// 1. DEFINICIÓN DE TIPOS
interface StakingPlan {
    id: string;
    title: string;
    days: number;
    apy: number;      
    minEntry: number; 
}

interface StakingModalProps {
    onClose: () => void;
    balance: number;  
    onStake: (amount: number, planId: string) => Promise<void>; 
}

const STAKING_PLANS: StakingPlan[] = [
    { id: 'flexible', title: 'Flexible', days: 7, apy: 12, minEntry: 1000 },
    { id: 'locked_30', title: 'Locked 30d', days: 30, apy: 45, minEntry: 5000 },
    { id: 'locked_90', title: 'Diamond Hands', days: 90, apy: 120, minEntry: 20000 },
];

export const StakingModal: React.FC<StakingModalProps> = ({ onClose, balance, onStake }) => {
    const [selectedPlan, setSelectedPlan] = useState<StakingPlan>(STAKING_PLANS[1]);
    const [amount, setAmount] = useState<string>(''); 
    const [loading, setLoading] = useState(false);

    // Cálculos en tiempo real
    const numAmount = parseFloat(amount) || 0;
    const estimatedProfit = (numAmount * selectedPlan.apy / 100) * (selectedPlan.days / 365);
    
    // SOLUCIÓN: Usaremos esta variable en el JSX para que no dé error
    const totalReturn = numAmount + estimatedProfit;
    
    const isValidAmount = numAmount >= selectedPlan.minEntry && numAmount <= balance;

    const handleStake = async () => {
        if (!isValidAmount || loading) return;
        setLoading(true);
        await onStake(numAmount, selectedPlan.id);
        setLoading(false);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 3000,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }}>
            <div style={{flex: 1}} onClick={onClose} />

            <div className="glass-card" style={{ 
                margin: 0, borderRadius: '24px 24px 0 0', padding: '24px', 
                borderBottom: 'none', maxHeight: '90vh', overflowY: 'auto',
                animation: 'slideUp 0.3s ease-out', background: '#121212', border: '1px solid #333'
            }}>
                
                {/* Header */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <Lock size={24} color="#E040FB" />
                        <h2 style={{margin: 0, fontSize: '20px', color: '#fff'}}>Gem Staking</h2>
                    </div>
                    <button onClick={onClose} style={{background:'none', border:'none', color:'#fff', cursor:'pointer'}}><X /></button>
                </div>

                {/* 1. Selector de Planes */}
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '15px' }}>
                    {STAKING_PLANS.map((plan) => (
                        <button
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan)}
                            style={{
                                flex: '1', minWidth: '100px', padding: '12px', borderRadius: '12px',
                                background: selectedPlan.id === plan.id ? 'rgba(224, 64, 251, 0.2)' : 'rgba(255,255,255,0.05)',
                                border: selectedPlan.id === plan.id ? '1px solid #E040FB' : '1px solid transparent',
                                color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontSize: '12px', color: '#aaa' }}>{plan.days} Days</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#E040FB' }}>{plan.apy}%</div>
                            <div style={{ fontSize: '10px', color: '#666' }}>APY</div>
                        </button>
                    ))}
                </div>

                {/* 2. Input de Cantidad */}
                <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '16px', border: '1px solid #333', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', color: '#aaa' }}>
                        <span>Stake Amount</span>
                        <span>Balance: {balance.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Coins color="#FFD700" size={24} />
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Min ${selectedPlan.minEntry}`}
                            style={{ 
                                background: 'none', border: 'none', color: '#fff', fontSize: '24px', fontWeight: 'bold', width: '100%', outline: 'none' 
                            }}
                        />
                        <button 
                            onClick={() => setAmount(balance.toString())}
                            style={{ fontSize: '10px', padding: '4px 8px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor:'pointer' }}
                        >
                            MAX
                        </button>
                    </div>
                </div>

                {/* 3. Resumen de Retorno (AQUÍ USAMOS totalReturn) */}
                <div style={{ padding: '15px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '12px', marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
                        <span>Estimated Profit</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {selectedPlan.days} days</span>
                    </div>
                    
                    {/* Fila de Profit */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ color: '#4CAF50', fontSize: '20px', fontWeight: 'bold' }}>
                            +{Math.floor(estimatedProfit).toLocaleString()} Gems
                        </div>
                        <TrendingUp size={20} color="#4CAF50" />
                    </div>

                    {/* Fila de Total Return (Nueva, usa la variable para corregir el error) */}
                    {numAmount > 0 && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#ddd' }}>
                            <span>Total Return:</span>
                            <span>{Math.floor(totalReturn).toLocaleString()} Gems</span>
                        </div>
                    )}
                </div>

                {/* Botón de Acción */}
                <button 
                    onClick={handleStake}
                    disabled={!isValidAmount || loading}
                    className="btn-neon"
                    style={{
                        width: '100%', padding: '16px', fontSize: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        opacity: (!isValidAmount || loading) ? 0.5 : 1,
                        cursor: (!isValidAmount || loading) ? 'not-allowed' : 'pointer',
                        background: !isValidAmount ? '#333' : undefined
                    }}
                >
                    {loading ? 'Staking...' : (
                        !isValidAmount ? (numAmount > balance ? 'Insufficient Funds' : `Min Stake: ${selectedPlan.minEntry}`) : '🔒 CONFIRM STAKE'
                    )}
                </button>

                {/* Nota al pie */}
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px', fontSize: '11px', color: '#666', alignItems: 'start' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    Tokens will be locked for the selected duration. Early withdrawal incurs a 20% penalty.
                </div>

            </div>
            
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>
        </div>
    );
};