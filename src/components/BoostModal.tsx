import React from 'react';
import { X, Server, Lock, ChevronRight, Zap, Battery, Crown, Target } from 'lucide-react';

interface BoostModalProps {
    onClose: () => void;
    levels: { multitap: number; limit: number; speed: number };
    score: number;
    onBuy: (type: 'multitap' | 'limit' | 'speed') => void;
}

// 🔥 CONFIGURACIÓN SINCRONIZADA CON STAKING BANK Y CAPACIDAD 🔥
const RIG_LEVELS = [
    { lvl: 1, name: "Laptop", speed: "3.6k/h", cap: "5k Pts", staking: "24h Flash + 0% Deep", cost: "FREE", benefit: "2 Deposit Slots" },
    { lvl: 2, name: "GPU Home", speed: "7.2k/h", cap: "10k Pts", staking: "24h Flash + 0% Deep", cost: "20k", benefit: "2 Deposit Slots" },
    { lvl: 3, name: "Garage Rig", speed: "10.8k/h", cap: "20k Pts", staking: "24h Flash + 10% Deep", cost: "250k", benefit: "2 Slots | 🔓 DEEP STORAGE" },
    { lvl: 4, name: "Server Room", speed: "14.4k/h", cap: "25k Pts", staking: "24h Flash + 25% Deep", cost: "1M", benefit: "2 Slots | Higher Quota" },
    { lvl: 5, name: "Industrial", speed: "18k/h", cap: "35k Pts", staking: "24h Flash + 40% Deep", cost: "5M", benefit: "4 Slots | Adv. Portfolio" },
    { lvl: 6, name: "Geothermal", speed: "21.6k/h", cap: "40k Pts", staking: "24h Flash + 55% Deep", cost: "15M", benefit: "4 Slots | 🤖 AUTO-MINING" },
    { lvl: 7, name: "Fusion", speed: "28.8k/h", cap: "50k Pts", staking: "24h Flash + 70% Deep", cost: "25M", benefit: "10 Slots | Master Banker" },
    { lvl: 8, name: "Quantum", speed: "36k/h", cap: "60k Pts", staking: "24h Flash + 70% Deep", cost: "30M", benefit: "10 Slots | 🏝️ MAX QUOTA" },
];

export const BoostModal: React.FC<BoostModalProps> = ({ onClose, levels, score, onBuy }) => {
    const currentLvl = levels.limit;
    const costs = [0, 20000, 250000, 1000000, 5000000, 15000000, 25000000, 30000000];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.94)', zIndex: 5000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
            backdropFilter: 'blur(12px)'
        }}>
            <div style={{ flex: 1, width: '100%' }} onClick={onClose}></div>

            <div style={{
                width: '100%', background: '#08080a', borderTop: '1px solid #333',
                borderRadius: '30px 30px 0 0', padding: '20px 0', maxHeight: '92vh', 
                display: 'flex', flexDirection: 'column', boxShadow: '0 -15px 50px rgba(0,0,0,0.8)'
            }}>
                {/* Header */}
                <div style={{ padding: '0 25px 20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '900', letterSpacing: '1px' }}>HARDWARE UPGRADES</h2>
                        <div style={{ fontSize: '10px', color: '#aaa', fontWeight: 'bold' }}>EVOLVE YOUR MINING INFRASTRUCTURE</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px' }}><X size={18} /></button>
                </div>

                {/* Scroll de Rigs (Cuadros más largos/altos) */}
                <div style={{ overflowY: 'auto', padding: '0 20px 40px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                                background: isCurrent ? 'linear-gradient(135deg, #0f1718 0%, #000 100%)' : (isNext ? 'rgba(255,215,0,0.02)' : 'rgba(255,255,255,0.01)'),
                                borderRadius: '18px',
                                padding: '20px 16px', // Aumentado el padding vertical para cuadros más largos
                                minHeight: '110px',   // Altura mínima asegurada
                                border: isCurrent ? '1.5px solid #00F2FE' : (isNext ? '1.5px solid #FFD700' : '1px solid #1a1a1a'),
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: isLocked ? 0.4 : 1,
                                filter: isLocked ? 'grayscale(0.8)' : 'none',
                                boxShadow: isNext ? '0 0 15px rgba(255, 215, 0, 0.1)' : 'none',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                {/* Badge de Estado */}
                                <div style={{ 
                                    position: 'absolute', top: -10, right: 15, 
                                    background: isCurrent ? '#00F2FE' : (isPast ? '#4CAF50' : (isNext ? '#FFD700' : '#222')),
                                    color: '#000', fontSize: '8px', fontWeight: '900', padding: '3px 12px', borderRadius: '20px',
                                    letterSpacing: '0.5px', boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                                }}>
                                    {isCurrent ? 'CURRENT RIG' : (isPast ? 'MASTERED' : (isNext ? 'NEXT TARGET' : 'LOCKED'))}
                                </div>

                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%' }}>
                                    {/* Icono Principal */}
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: isCurrent ? 'rgba(0, 242, 254, 0.1)' : (isNext ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.03)'),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        flexShrink: 0
                                    }}>
                                        {isPast ? <Crown size={22} color="#4CAF50" /> : (isNext ? <Target size={22} color="#FFD700" /> : <Server size={22} color={isCurrent ? "#00F2FE" : "#444"} />)}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '16px', fontWeight: '800', color: isPast ? '#666' : '#fff', marginBottom: '4px' }}>
                                            {rig.name} <span style={{fontSize:'10px', color: '#444', marginLeft:'5px'}}>LVL {rig.lvl}</span>
                                        </div>
                                        
                                        {/* Stats Row */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Zap size={10} color={isCurrent ? "#00F2FE" : "#555"} />
                                                <span style={{ fontSize: '10px', color: '#ccc' }}>{rig.speed}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Battery size={10} color={isCurrent ? "#4CAF50" : "#555"} />
                                                <span style={{ fontSize: '10px', color: '#ccc' }}>Limit: {rig.cap}</span>
                                            </div>
                                        </div>

                                        {/* Staking Row */}
                                        <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Server size={10} color="#E040FB" />
                                            {rig.staking}
                                        </div>

                                        {/* Benefit Row */}
                                        <div style={{ 
                                            fontSize: '9px', color: isNext ? '#FFD700' : (isCurrent ? '#00F2FE' : '#666'), 
                                            display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' 
                                        }}>
                                            <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor'}}></div>
                                            {rig.benefit}
                                        </div>
                                    </div>

                                    {/* Botón */}
                                    {isNext && (
                                        <button 
                                            onClick={() => onBuy('limit')}
                                            disabled={!canAfford}
                                            style={{
                                                padding: '12px 14px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: canAfford ? 'linear-gradient(to bottom, #FFD700, #b8860b)' : '#1a1a1a',
                                                color: '#000',
                                                fontWeight: '900',
                                                fontSize: '11px',
                                                boxShadow: canAfford ? '0 4px 15px rgba(218, 165, 32, 0.4)' : 'none',
                                                cursor: canAfford ? 'pointer' : 'not-allowed',
                                                flexShrink: 0
                                            }}
                                        >
                                            <div style={{fontSize: '10px'}}>UPGRADE</div>
                                            <div style={{ fontSize: '8px', opacity: 0.8 }}>{rig.cost}</div>
                                        </button>
                                    )}
                                    
                                    {isLocked && <Lock size={16} color="#222" style={{flexShrink:0}} />}
                                    {isPast && <ChevronRight size={16} color="#222" style={{flexShrink:0}} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};