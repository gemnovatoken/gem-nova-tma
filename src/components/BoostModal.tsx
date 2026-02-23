import React from 'react';
import { X, Server, Lock, TrendingUp } from 'lucide-react';

interface BoostModalProps {
    onClose: () => void;
    levels: { multitap: number; limit: number; speed: number };
    score: number;
    onBuy: (type: 'multitap' | 'limit' | 'speed') => void;
}

// 🔥 PRECIOS Y BENEFICIOS ACTUALIZADOS 🔥
// 🔥 PRECIOS, BENEFICIOS Y ESTADÍSTICAS SINCRONIZADAS 🔥
// 🔥 PRECIOS, BENEFICIOS Y ESTADÍSTICAS EXACTAS 🔥
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
    const nextLvl = Math.min(8, currentLvl + 1);
    const nextRig = RIG_LEVELS[nextLvl - 1];
    const currentRig = RIG_LEVELS[currentLvl - 1];
    const isMax = currentLvl >= 8;

    // 🔥 MATRIZ DE COSTOS EXACTA SINCRONIZADA CON BACKEND 🔥
    const costs = [0, 20000, 250000, 1000000, 5000000, 15000000, 25000000, 30000000];
    const upgradeCost = costs[currentLvl]; 
    const canAfford = score >= upgradeCost;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 5000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end'
        }}>
            <div style={{flex:1, width:'100%'}} onClick={onClose}></div>

            <div className="glass-card" style={{
                width: '100%', border: '1px solid #00F2FE', borderBottom: 'none', 
                borderRadius: '20px 20px 0 0', padding: '20px', maxHeight: '85vh', overflowY: 'auto'
            }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                    <h2 style={{margin:0, color:'#fff', fontSize:'20px'}}>UPGRADE RIG</h2>
                    <button onClick={onClose} style={{background:'none', border:'none', color:'#aaa'}}><X /></button>
                </div>

                {/* Estado Actual */}
                <div style={{marginBottom:'30px', textAlign:'center'}}>
                    <div style={{fontSize:'12px', color:'#aaa'}}>CURRENT RIG (Level {currentLvl})</div>
                    <div style={{fontSize:'24px', fontWeight:'bold', color:'#00F2FE', margin:'5px 0'}}>
                        {currentRig.name}
                    </div>
                    
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'5px', marginTop:'10px'}}>
                        <div style={{background:'rgba(255,255,255,0.05)', padding:'5px', borderRadius:'8px'}}>
                            <div style={{fontSize:'9px', color:'#aaa'}}>SPEED</div>
                            <div style={{color:'#fff', fontSize:'11px', fontWeight:'bold'}}>{currentRig.speed}</div>
                        </div>
                        <div style={{background:'rgba(255,255,255,0.05)', padding:'5px', borderRadius:'8px'}}>
                            <div style={{fontSize:'9px', color:'#aaa'}}>CAPACITY</div>
                            <div style={{color:'#fff', fontSize:'11px', fontWeight:'bold'}}>{currentRig.cap}</div>
                        </div>
                        <div style={{background:'rgba(224, 64, 251, 0.1)', padding:'5px', borderRadius:'8px', border:'1px solid rgba(224, 64, 251, 0.3)'}}>
                            <div style={{fontSize:'9px', color:'#E040FB'}}>STAKING</div>
                            <div style={{color:'#fff', fontSize:'11px', fontWeight:'bold'}}>{currentRig.staking}</div>
                        </div>
                    </div>

                    {currentRig.benefit && (
                        <div style={{marginTop:'10px', fontSize:'10px', color:'#4CAF50', fontWeight:'bold', background:'rgba(76, 175, 80, 0.1)', padding:'5px', borderRadius:'5px'}}>
                            ACTIVE: {currentRig.benefit}
                        </div>
                    )}
                </div>

                {/* Siguiente Nivel */}
                {!isMax ? (
                    <div className="cyber-card" style={{padding:'20px', border:'1px solid #FFD700'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                            <div style={{color:'#FFD700', fontWeight:'bold'}}>NEXT: LEVEL {nextLvl}</div>
                            <Server color="#FFD700"/>
                        </div>

                        <div style={{fontSize:'20px', fontWeight:'900', color:'#fff', marginBottom:'5px'}}>
                            {nextRig.name}
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'15px'}}>
                            <div style={{background:'rgba(255,255,255,0.1)', padding:'8px', borderRadius:'8px'}}>
                                <div style={{fontSize:'10px', color:'#aaa'}}>SPEED</div>
                                <div style={{color:'#fff', fontWeight:'bold'}}>{nextRig.speed}</div>
                            </div>
                            <div style={{background:'rgba(255,255,255,0.1)', padding:'8px', borderRadius:'8px'}}>
                                <div style={{fontSize:'10px', color:'#aaa'}}>CAPACITY</div>
                                <div style={{color:'#fff', fontWeight:'bold'}}>{nextRig.cap}</div>
                            </div>
                        </div>
                        
                        <div style={{marginBottom:'15px', background:'rgba(224, 64, 251, 0.1)', padding:'8px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'10px'}}>
                            <TrendingUp size={16} color="#E040FB"/>
                            <div>
                                <div style={{fontSize:'10px', color:'#E040FB'}}>STAKING UPGRADE</div>
                                <div style={{color:'#fff', fontWeight:'bold', fontSize:'12px'}}>{nextRig.staking}</div>
                            </div>
                        </div>

                        {nextRig.benefit && (
                            <div style={{marginBottom:'15px', background:'rgba(76, 175, 80, 0.2)', padding:'10px', borderRadius:'8px', border:'1px solid #4CAF50'}}>
                                <div style={{fontSize:'10px', color:'#4CAF50', fontWeight:'bold'}}>NEW UNLOCK:</div>
                                <div style={{color:'#fff', fontSize:'12px', fontWeight:'bold'}}>{nextRig.benefit}</div>
                            </div>
                        )}

                        <button 
                            className="btn-neon"
                            disabled={!canAfford}
                            onClick={() => onBuy('limit')}
                            style={{width:'100%', background: canAfford ? '#FFD700' : '#333', color: canAfford ? '#000' : '#aaa', border:'none'}}
                        >
                            {canAfford ? `UPGRADE FOR ${upgradeCost.toLocaleString()} PTS` : `NEED ${upgradeCost.toLocaleString()} PTS`}
                        </button>
                    </div>
                ) : (
                    <div style={{textAlign:'center', color:'#FFD700', padding:'20px'}}>
                        MAX LEVEL REACHED! YOU ARE A GOD.
                    </div>
                )}

                <div style={{marginTop:'30px'}}>
                    <h3 style={{fontSize:'14px', marginBottom:'10px'}}>Rig Catalog</h3>
                    {RIG_LEVELS.map((r) => (
                        <div key={r.lvl} style={{
                            display:'flex', justifyContent:'space-between', padding:'10px', 
                            borderBottom:'1px solid rgba(255,255,255,0.05)',
                            opacity: r.lvl < currentLvl ? 0.5 : 1
                        }}>
                            <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                <div style={{width:'20px', height:'20px', background: r.lvl===currentLvl ? '#00F2FE' : '#333', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#fff', fontWeight:'bold'}}>{r.lvl}</div>
                                <div>
                                    <div style={{fontSize:'12px', fontWeight:'bold', color: r.lvl===nextLvl ? '#FFD700' : '#fff'}}>{r.name}</div>
                                    <div style={{fontSize:'9px', color:'#aaa'}}>{r.cap} | {r.staking}</div>
                                </div>
                            </div>
                            {r.benefit && <Lock size={12} color="#4CAF50"/>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};