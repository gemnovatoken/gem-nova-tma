import React from 'react';
import { X, Server, Lock, Zap, Battery, Crown, Target, Check } from 'lucide-react';

interface BoostModalProps {
    onClose: () => void;
    levels: { multitap: number; limit: number; speed: number };
    score: number;
    onBuy: (type: 'multitap' | 'limit' | 'speed') => void;
}

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
                <div style={{ padding: '0 25px 20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '900', letterSpacing: '1px' }}>HARDWARE UPGRADES</h2>
                        <div style={{ fontSize: '10px', color: '#aaa', fontWeight: 'bold' }}>EVOLVE YOUR MINING INFRASTRUCTURE</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px' }}><X size={18} /></button>
                </div>

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
                                padding: '20px 16px',
                                minHeight: '110px',
                                border: isCurrent ? '1.5px solid #00F2FE' : (isNext ? '1.5px solid #FFD700' : '1px solid #1a1a1a'),
                                transition: 'all 0.4s ease',
                                opacity: isLocked ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <div style={{ 
                                    position: 'absolute', top: -10, right: 15, 
                                    background: isCurrent ? '#00F2FE' : (isPast ? '#4CAF50' : (isNext ? '#FFD700' : '#222')),
                                    color: '#000', fontSize: '8px', fontWeight: '900', padding: '3px 12px', borderRadius: '20px',
                                    letterSpacing: '0.5px', boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                                }}>
                                    {isCurrent ? 'CURRENT GEAR' : (isPast ? 'MASTERED' : (isNext ? 'NEXT TARGET' : 'LOCKED'))}
                                </div>

                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%' }}>
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
                                        
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Zap size={10} color={isCurrent ? "#00F2FE" : "#555"} />
                                                <span style={{ fontSize: '10px', color: '#ccc' }}>{rig.speed}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Battery size={10} color={isCurrent ? "#4CAF50" : "#555"} />
                                                <span style={{ fontSize: '10px', color: '#ccc' }}>Cap: {rig.cap}</span>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Server size={10} color="#E040FB" />
                                            {rig.staking}
                                        </div>

                                        <div style={{ 
                                            fontSize: '9px', color: isNext ? '#FFD700' : (isCurrent ? '#00F2FE' : '#666'), 
                                            display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' 
                                        }}>
                                            <div style={{width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor'}}></div>
                                            {rig.benefit}
                                        </div>
                                    </div>

                                    {/* 🔥 SECCIÓN DE BOTÓN DINÁMICO (COSTOS SIEMPRE VISIBLES) 🔥 */}
                                    <div style={{ flexShrink: 0, minWidth: '90px', display: 'flex', justifyContent: 'center' }}>
                                        {isPast ? (
                                            <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4CAF50', color: '#4CAF50', fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Check size={12} /> OWNED
                                            </div>
                                        ) : isCurrent ? (
                                            <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid #00F2FE', color: '#00F2FE', fontSize: '10px', fontWeight: '900' }}>
                                                ACTIVE
                                            </div>
                                        ) : isNext ? (
                                            <button 
                                                onClick={() => onBuy('limit')}
                                                disabled={!canAfford}
                                                style={{
                                                    padding: '10px 12px', borderRadius: '10px',
                                                    border: canAfford ? '1px solid #FFF' : '1px solid #333',
                                                    background: canAfford ? 'linear-gradient(180deg, #FFE873 0%, #FFD700 50%, #B8860B 100%)' : '#1a1a1a',
                                                    color: '#000', fontWeight: '900', fontSize: '10px',
                                                    boxShadow: canAfford ? '0 0 20px rgba(255, 215, 0, 0.4)' : 'none',
                                                    cursor: canAfford ? 'pointer' : 'not-allowed',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                                                }}
                                            >
                                                <span>UPGRADE</span>
                                                <span style={{ fontSize: '9px', marginTop: '2px', background: 'rgba(0,0,0,0.1)', padding: '1px 4px', borderRadius: '4px' }}>{rig.cost}</span>
                                            </button>
                                        ) : (
                                            <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#111', border: '1px solid #222', color: '#444', fontSize: '10px', fontWeight: '900', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.8 }}>
                                                <Lock size={12} style={{marginBottom: '2px'}} />
                                                <span>{rig.cost}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};