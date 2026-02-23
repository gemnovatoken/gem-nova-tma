import React from 'react';
import { X, Server, Lock, Zap, Battery, Check } from 'lucide-react';

interface BoostModalProps {
    onClose: () => void;
    levels: { multitap: number; limit: number; speed: number };
    score: number;
    onBuy: (type: 'multitap' | 'limit' | 'speed') => void;
}

const RIG_LEVELS = [
    { lvl: 1, name: "Laptop", speed: "3.6k/h", cap: "5k Pts", staking: "24h Flash + 0% Deep", cost: "FREE", benefit: "2 Deposit Slots" },
    { lvl: 2, name: "GPU Home", speed: "7.2k/h", cap: "10k Pts", staking: "24h Flash + 0% Deep", cost: "20,000", benefit: "2 Deposit Slots" },
    { lvl: 3, name: "Garage Rig", speed: "10.8k/h", cap: "20k Pts", staking: "24h Flash + 10% Deep", cost: "250,000", benefit: "2 Slots | 🔓 DEEP STORAGE" },
    { lvl: 4, name: "Server Room", speed: "14.4k/h", cap: "25k Pts", staking: "24h Flash + 25% Deep", cost: "1,000,000", benefit: "2 Slots | Higher Quota" },
    { lvl: 5, name: "Industrial", speed: "18k/h", cap: "35k Pts", staking: "24h Flash + 40% Deep", cost: "5,000,000", benefit: "4 Slots | Adv. Portfolio" },
    { lvl: 6, name: "Geothermal", speed: "21.6k/h", cap: "40k Pts", staking: "24h Flash + 55% Deep", cost: "15,000,000", benefit: "4 Slots | 🤖 AUTO-MINING" },
    { lvl: 7, name: "Fusion", speed: "28.8k/h", cap: "50k Pts", staking: "24h Flash + 70% Deep", cost: "25,000,000", benefit: "10 Slots | Master Banker" },
    { lvl: 8, name: "Quantum", speed: "36k/h", cap: "60k Pts", staking: "24h Flash + 70% Deep", cost: "30,000,000", benefit: "10 Slots | 🏝️ MAX QUOTA" },
];

export const BoostModal: React.FC<BoostModalProps> = ({ onClose, levels, score, onBuy }) => {
    const currentLvl = levels.limit;
    const costsArray = [0, 20000, 250000, 1000000, 5000000, 15000000, 25000000, 30000000];

    const handleActionClick = (rigLvl: number, rigCost: string) => {
        // Solo permitimos interactuar con niveles futuros
        if (rigLvl <= currentLvl) return;
        
        // Error si intenta saltarse niveles
        if (rigLvl > currentLvl + 1) {
            alert(`⚠️ SEQUENCE ERROR\nYou must unlock Level ${currentLvl + 1} first!`);
            return;
        }

        const numericCost = costsArray[currentLvl]; 
        if (score < numericCost) {
            const missing = numericCost - score;
            // 🔥 AQUÍ USAMOS rigCost PARA QUITAR EL ERROR DE TS
            alert(`🚫 INSUFFICIENT BALANCE\n\nYou need ${missing.toLocaleString()} more points to buy ${RIG_LEVELS[rigLvl-1].name} (${rigCost} PTS).\n\nKeep tapping or visit the shop! 🚀`);
            return;
        }

        onBuy('limit');
    };

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
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: '900', letterSpacing: '1px' }}>HARDWARE STORE</h2>
                        <div style={{ fontSize: '10px', color: '#FFD700', fontWeight: 'bold' }}>ALL UPGRADE COSTS VISIBLE</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px' }}><X size={18} /></button>
                </div>

                <div style={{ overflowY: 'auto', padding: '0 20px 40px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {RIG_LEVELS.map((rig) => {
                        const isCurrent = rig.lvl === currentLvl;
                        const isPast = rig.lvl < currentLvl;
                        const isNext = rig.lvl === currentLvl + 1;
                        const isFuture = rig.lvl > currentLvl;
                        const canAfford = score >= costsArray[currentLvl];

                        return (
                            <div key={rig.lvl} style={{
                                position: 'relative',
                                background: isCurrent ? 'rgba(0, 242, 254, 0.05)' : (isFuture ? 'rgba(255, 215, 0, 0.02)' : 'rgba(255,255,255,0.01)'),
                                borderRadius: '18px',
                                padding: '20px 16px',
                                minHeight: '110px',
                                border: isCurrent ? '1.5px solid #00F2FE' : (isFuture ? '1.5px solid #FFD700' : '1px solid #1a1a1a'),
                                transition: 'all 0.4s ease',
                                opacity: (isFuture && !isNext) ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <div style={{ 
                                    position: 'absolute', top: -10, right: 15, 
                                    background: isCurrent ? '#00F2FE' : (isPast ? '#4CAF50' : '#FFD700'),
                                    color: '#000', fontSize: '8px', fontWeight: '900', padding: '3px 12px', borderRadius: '20px',
                                    letterSpacing: '0.5px', boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                                }}>
                                    {isCurrent ? 'CURRENT GEAR' : (isPast ? 'MASTERED' : 'UPGRADE')}
                                </div>

                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', width: '100%' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: isFuture ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.03)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        flexShrink: 0
                                    }}>
                                        {isPast ? <Check size={22} color="#4CAF50" /> : <Server size={22} color={isCurrent ? "#00F2FE" : "#FFD700"} />}
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
                                                <span style={{ fontSize: '10px', color: '#ccc' }}>Limit: {rig.cap}</span>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px' }}>{rig.staking}</div>
                                        <div style={{ fontSize: '9px', color: isFuture ? '#FFD700' : (isCurrent ? '#00F2FE' : '#666'), fontWeight: 'bold' }}>{rig.benefit}</div>
                                    </div>

                                    <div style={{ flexShrink: 0, minWidth: '95px', display: 'flex', justifyContent: 'center' }}>
                                        {isPast ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
                                                <span style={{ fontSize: '7px', color: '#4CAF50', fontWeight: 'bold' }}>INVESTED</span>
                                                <span style={{ fontSize: '10px', color: '#666', textDecoration: 'line-through' }}>{rig.cost}</span>
                                            </div>
                                        ) : isCurrent ? (
                                            <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid #00F2FE', color: '#00F2FE', fontSize: '10px', fontWeight: '900', textAlign: 'center' }}>
                                                <div style={{fontSize: '7px'}}>ACTIVE</div>
                                                {rig.cost}
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleActionClick(rig.lvl, rig.cost)}
                                                style={{
                                                    padding: '10px 12px', borderRadius: '10px',
                                                    border: (isNext && canAfford) ? '1px solid #FFF' : '1px solid #333',
                                                    background: (isNext && canAfford) 
                                                        ? 'linear-gradient(180deg, #FFE873 0%, #FFD700 50%, #B8860B 100%)' 
                                                        : 'rgba(255, 215, 0, 0.05)',
                                                    color: (isNext && canAfford) ? '#000' : '#FFD700', 
                                                    fontWeight: '900', fontSize: '10px',
                                                    boxShadow: (isNext && canAfford) ? '0 0 15px rgba(255, 215, 0, 0.3)' : 'none',
                                                    cursor: 'pointer',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    width: '100%'
                                                }}
                                            >
                                                {isNext ? (
                                                    <>
                                                        <span>UPGRADE</span>
                                                        <span style={{ fontSize: '9px', marginTop: '2px' }}>{rig.cost}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock size={10} style={{marginBottom: '2px'}} />
                                                        <span>{rig.cost}</span>
                                                    </>
                                                )}
                                            </button>
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