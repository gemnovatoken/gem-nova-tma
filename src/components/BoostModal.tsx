import React from 'react';
import { X, Server, Lock, TrendingUp, ChevronRight, Zap, Battery, Crown } from 'lucide-react';

interface BoostModalProps {
    onClose: () => void;
    levels: { multitap: number; limit: number; speed: number };
    score: number;
    onBuy: (type: 'multitap' | 'limit' | 'speed') => void;
}

const RIG_LEVELS = [
    { lvl: 1, name: "Laptop", speed: "3.6k/h", cap: "5k Pts", staking: "Locked", cost: "FREE", benefit: "" },
    { lvl: 2, name: "GPU Home", speed: "7.2k/h", cap: "10k Pts", staking: "Locked", cost: "20k", benefit: "" },
    { lvl: 3, name: "Garage Rig", speed: "10.8k/h", cap: "20k Pts", staking: "10k Limit", cost: "250k", benefit: "🔓 UNLOCK STAKING" },
    { lvl: 4, name: "Server Room", speed: "14.4k/h", cap: "25k Pts", staking: "10% Cap", cost: "1M", benefit: "" },
    { lvl: 5, name: "Industrial", speed: "18k/h", cap: "35k Pts", staking: "20% Cap", cost: "5M", benefit: "✅ NO MIN WITHDRAW" },
    { lvl: 6, name: "Geothermal", speed: "21.6k/h", cap: "40k Pts", staking: "35% Cap", cost: "15M", benefit: "🤖 24H AUTO-MINING" },
    { lvl: 7, name: "Fusion", speed: "28.8k/h", cap: "50k Pts", staking: "50% Cap", cost: "25M", benefit: "" },
    { lvl: 8, name: "Quantum", speed: "36k/h", cap: "60k Pts", staking: "75% Cap", cost: "30M", benefit: "🏝️ 3-DAY OFFLINE MODE" },
];

export const BoostModal: React.FC<BoostModalProps> = ({ onClose, levels, score, onBuy }) => {
    const currentLvl = levels.limit;
    const costs = [0, 20000, 250000, 1000000, 5000000, 15000000, 25000000, 30000000];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.92)', zIndex: 5000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{ flex: 1, width: '100%' }} onClick={onClose}></div>

            <div style={{
                width: '100%', 
                background: '#0a0a0c', 
                borderTop: '2px solid #333',
                borderRadius: '30px 30px 0 0', 
                padding: '20px 0', 
                maxHeight: '90vh', 
                display: 'flex', 
                flexDirection: 'column',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
            }}>
                {/* Header Fijo */}
                <div style={{ padding: '0 25px 20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '22px', fontWeight: '900', letterSpacing: '1px' }}>MINING ARSENAL</h2>
                        <div style={{ fontSize: '10px', color: '#00F2FE', fontWeight: 'bold' }}>UPGRADE YOUR RIG TO INCREASE PROFITS</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px' }}><X size={20} /></button>
                </div>

                {/* Scroll de Progresión */}
                <div style={{ overflowY: 'auto', padding: '0 20px 40px 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {RIG_LEVELS.map((rig) => {
                        const isCurrent = rig.lvl === currentLvl;
                        const isPast = rig.lvl < currentLvl;
                        const isNext = rig.lvl === currentLvl + 1;
                        const isLocked = rig.lvl > currentLvl + 1;
                        
                        const upgradeCost = costs[currentLvl];
                        const canAfford = score >= upgradeCost;

                        return (
                            <div key={rig.lvl} style={{
                                position: 'relative',
                                background: isCurrent ? 'linear-gradient(135deg, #1a1a1a 0%, #001a1d 100%)' : 'rgba(255,255,255,0.02)',
                                borderRadius: '20px',
                                padding: '15px',
                                border: isCurrent ? '2px solid #00F2FE' : (isNext ? '1px solid #FFD700' : '1px solid #222'),
                                opacity: isLocked ? 0.6 : 1,
                                transition: 'all 0.3s ease',
                                boxShadow: isCurrent ? '0 0 20px rgba(0, 242, 254, 0.2)' : 'none'
                            }}>
                                {/* Badge de Estado */}
                                <div style={{ 
                                    position: 'absolute', top: -8, right: 20, 
                                    background: isCurrent ? '#00F2FE' : (isPast ? '#4CAF50' : (isNext ? '#FFD700' : '#333')),
                                    color: '#000', fontSize: '9px', fontWeight: '900', padding: '2px 10px', borderRadius: '10px'
                                }}>
                                    {isCurrent ? 'ACTIVE RIG' : (isPast ? 'SUPERSEDED' : (isNext ? 'AVAILABLE' : 'LOCKED'))}
                                </div>

                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    {/* Icono de Nivel con Línea de Progresión */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{
                                            width: '45px', height: '45px', borderRadius: '12px',
                                            background: isCurrent ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255,255,255,0.05)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: isCurrent ? '1px solid #00F2FE' : '1px solid #333'
                                        }}>
                                            {isPast ? <Crown size={20} color="#4CAF50" /> : <Server size={20} color={isCurrent ? "#00F2FE" : "#666"} />}
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '900', color: isCurrent ? '#00F2FE' : '#444', marginTop: '5px' }}>L{rig.lvl}</div>
                                    </div>

                                    {/* Información del Rig */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: isPast ? '#666' : '#fff' }}>{rig.name}</div>
                                        
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Zap size={10} color="#00F2FE" />
                                                <span style={{ fontSize: '11px', color: '#aaa' }}>{rig.speed}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Battery size={10} color="#4CAF50" />
                                                <span style={{ fontSize: '11px', color: '#aaa' }}>{rig.cap}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <TrendingUp size={10} color="#E040FB" />
                                                <span style={{ fontSize: '11px', color: '#aaa' }}>{rig.staking}</span>
                                            </div>
                                        </div>

                                        {rig.benefit && (
                                            <div style={{ 
                                                marginTop: '10px', fontSize: '10px', color: isCurrent || isNext ? '#FFD700' : '#444', 
                                                display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' 
                                            }}>
                                                <Zap size={12} fill="currentColor" /> {rig.benefit}
                                            </div>
                                        )}
                                    </div>

                                    {/* Acciones */}
                                    {isNext && (
                                        <button 
                                            onClick={() => onBuy('limit')}
                                            disabled={!canAfford}
                                            style={{
                                                padding: '10px 15px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: canAfford ? '#FFD700' : '#222',
                                                color: '#000',
                                                fontWeight: '900',
                                                fontSize: '11px',
                                                cursor: canAfford ? 'pointer' : 'not-allowed',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <span>UPGRADE</span>
                                            <span style={{ fontSize: '8px', opacity: 0.7 }}>{rig.cost}</span>
                                        </button>
                                    )}
                                    
                                    {isLocked && <Lock size={20} color="#333" />}
                                    {isPast && <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={14} color="#000" /></div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};