import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { X, Trophy, Medal, ChevronLeft, ChevronRight, Zap, Database, Lock } from 'lucide-react'; // 🛡️ Eliminado 'Server'

interface RankingEntry {
    display_name: string;
    score: number;
    is_current_user: boolean;
}

// Configuración de visualización de Niveles (Stats)
const LEVEL_CONFIG = [
    { lvl: 1, name: "Laptop Mining", speed: "100/h", cap: "2h", benefit: "Entry Level" },
    { lvl: 2, name: "GPU Rig", speed: "500/h", cap: "3h", benefit: "Basic Yield" },
    { lvl: 3, name: "Garage Farm", speed: "1,000/h", cap: "4h", benefit: "Stability" },
    { lvl: 4, name: "Server Room", speed: "2,500/h", cap: "6h", benefit: "Staking Access" },
    { lvl: 5, name: "Industrial", speed: "3,500/h", cap: "8h", benefit: "No Withdraw Limit" },
    { lvl: 6, name: "Geothermal", speed: "5,000/h", cap: "24h", benefit: "Auto-Mining Bot" },
    { lvl: 7, name: "Fusion Reactor", speed: "10,000/h", cap: "24h", benefit: "VIP Lottery" },
    { lvl: 8, name: "Quantum Rig", speed: "20,000/h", cap: "120h", benefit: "2.5% Refs & Governance" },
];

export const RankingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [rankings, setRankings] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentLevel, setCurrentLevel] = useState(1); // Empezamos viendo nivel 1

    // 1. Al cargar, intentamos detectar el nivel real del usuario para mostrárselo primero
    useEffect(() => {
        const detectUserLevel = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('user_score').select('limit_level').eq('user_id', user.id).single();
                if (data) {
                    setCurrentLevel(data.limit_level || 1);
                }
            }
        };
        detectUserLevel();
    }, []);

    // 2. Cargar el ranking cada vez que cambiamos de nivel en el visor
    useEffect(() => {
        const fetchRankings = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_ranking_by_level', { 
                target_level: currentLevel, 
                limit_num: 25 
            });
            if (!error && data) {
                setRankings(data);
            } else {
                setRankings([]); // Lista vacía si no hay nadie
            }
            setLoading(false);
        };
        fetchRankings();
    }, [currentLevel]);

    const handlePrev = () => setCurrentLevel(p => Math.max(1, p - 1));
    const handleNext = () => setCurrentLevel(p => Math.min(8, p + 1));

    const levelInfo = LEVEL_CONFIG[currentLevel - 1];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 10000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
            <div className="glass-card" style={{
                width: '100%', maxWidth: '400px', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column', position: 'relative',
                border: `1px solid ${currentLevel >= 7 ? '#FFD700' : '#00F2FE'}`, // Borde dorado para niveles altos
                borderRadius: '20px', padding: '20px',
                boxShadow: currentLevel >= 7 ? '0 0 30px rgba(255, 215, 0, 0.15)' : 'none'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: 15, right: 15,
                    background: 'none', border: 'none', color: '#fff', cursor: 'pointer'
                }}><X size={24} /></button>

                {/* HEADER CON NAVEGACIÓN DE NIVEL */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{fontSize:'12px', color:'#aaa', marginBottom:'5px', letterSpacing:'2px'}}>LEAGUE STANDINGS</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom:'15px' }}>
                        <button onClick={handlePrev} disabled={currentLevel === 1} style={{background:'none', border:'none', color: currentLevel===1 ? '#333':'#fff', cursor:'pointer'}}><ChevronLeft size={30}/></button>
                        
                        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                            <Trophy size={40} color={currentLevel >= 7 ? "#FFD700" : "#00F2FE"} style={{ marginBottom: '5px', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }} />
                            <h2 style={{ margin: 0, color: '#fff', fontSize:'18px' }}>{levelInfo.name}</h2>
                            <div style={{fontSize:'10px', background:'#333', padding:'2px 8px', borderRadius:'10px', marginTop:'5px', color:'#aaa'}}>LVL {currentLevel}</div>
                        </div>

                        <button onClick={handleNext} disabled={currentLevel === 8} style={{background:'none', border:'none', color: currentLevel===8 ? '#333':'#fff', cursor:'pointer'}}><ChevronRight size={30}/></button>
                    </div>

                    {/* BENEFICIOS DEL NIVEL (STATS) */}
                    <div style={{
                        display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'5px', 
                        background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'12px'
                    }}>
                        <div style={{textAlign:'center'}}>
                            <div style={{display:'flex', justifyContent:'center', marginBottom:'2px'}}><Zap size={12} color="#00F2FE"/></div>
                            <div style={{fontSize:'9px', color:'#aaa'}}>SPEED</div>
                            <div style={{fontSize:'10px', fontWeight:'bold'}}>{levelInfo.speed}</div>
                        </div>
                        <div style={{textAlign:'center', borderLeft:'1px solid rgba(255,255,255,0.1)', borderRight:'1px solid rgba(255,255,255,0.1)'}}>
                            <div style={{display:'flex', justifyContent:'center', marginBottom:'2px'}}><Database size={12} color="#00F2FE"/></div>
                            <div style={{fontSize:'9px', color:'#aaa'}}>CAPACITY</div>
                            <div style={{fontSize:'10px', fontWeight:'bold'}}>{levelInfo.cap}</div>
                        </div>
                        <div style={{textAlign:'center'}}>
                            <div style={{display:'flex', justifyContent:'center', marginBottom:'2px'}}><Lock size={12} color={currentLevel>=7?"#FFD700":"#4CAF50"}/></div>
                            <div style={{fontSize:'9px', color:'#aaa'}}>UNLOCK</div>
                            <div style={{fontSize:'9px', fontWeight:'bold', color: currentLevel>=7?"#FFD700":"#fff"}}>{levelInfo.benefit}</div>
                        </div>
                    </div>
                </div>

                {/* LISTA DE JUGADORES */}
                <div style={{ 
                    overflowY: 'auto', 
                    paddingRight: '5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flex: 1
                }}>
                    {loading ? (
                        <div style={{textAlign:'center', color:'#aaa', marginTop:'20px'}}>Syncing Satellite Data...</div>
                    ) : rankings.length === 0 ? (
                        <div style={{textAlign:'center', color:'#666', marginTop:'20px', fontStyle:'italic'}}>
                            No miners in this sector yet.<br/>Be the first!
                        </div>
                    ) : (
                        rankings.map((player, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 15px',
                                borderRadius: '12px',
                                // Resaltar al usuario actual
                                background: player.is_current_user 
                                    ? 'linear-gradient(90deg, rgba(0, 242, 254, 0.2), rgba(0,0,0,0))' 
                                    : 'rgba(255,255,255,0.03)',
                                borderLeft: player.is_current_user ? '4px solid #00F2FE' : '4px solid transparent',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    {/* MEDALLAS */}
                                    <div style={{ 
                                        width: '24px', 
                                        fontWeight: 'bold', 
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {index === 0 ? <Medal size={24} color="#FFD700" fill="#FFD700" style={{filter:'drop-shadow(0 0 5px #FFD700)'}} /> : 
                                         index === 1 ? <Medal size={22} color="#C0C0C0" fill="#C0C0C0" /> : 
                                         index === 2 ? <Medal size={20} color="#CD7F32" fill="#CD7F32" /> : 
                                         <span style={{color:'#666', fontSize:'12px'}}>#{index + 1}</span>}
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ 
                                            color: player.is_current_user ? '#00F2FE' : '#fff',
                                            fontWeight: player.is_current_user ? 'bold' : 'normal',
                                            fontSize: '13px'
                                        }}>
                                            {player.display_name} {player.is_current_user && '(You)'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ fontWeight: 'bold', color: index < 3 ? '#fff' : '#aaa', fontSize:'13px' }}>
                                    {player.score.toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};