import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { X, ChevronLeft, ChevronRight, Star, Zap, Lock, Trophy } from 'lucide-react';

// 1. Definimos la interfaz para el usuario del ranking (ADIÓS ANY)
interface LeaderboardUser {
    user_id: string;
    username: string | null;
    score: number;
}

// Configuración de Beneficios por Nivel
const LEVEL_BENEFITS = [
    { id: 1, name: "Rookie", rate: "500:1", benefit: "Starter Kit", icon: <Star color="#CD7F32" /> },
    { id: 2, name: "Scout", rate: "500:1", benefit: "Basic Mining", icon: <Star color="#C0C0C0" /> },
    { id: 3, name: "Miner", rate: "500:1", benefit: "Staking Teaser (10k)", icon: <Star color="#FFD700" /> },
    { id: 4, name: "Engineer", rate: "300:1", benefit: "✅ Nova Bank Access (10%)", icon: <Zap color="#00F2FE" /> },
    { id: 5, name: "Captain", rate: "200:1", benefit: "✅ Auto-Bot Unlocked", icon: <Zap color="#4CAF50" /> },
    { id: 6, name: "Commander", rate: "150:1", benefit: "✅ Staking Cap 35%", icon: <Lock color="#E040FB" /> },
    { id: 7, name: "Lord", rate: "100:1", benefit: "🔥 Premium Bot (6H Free)", icon: <Trophy color="#FFD700" /> },
    { id: 8, name: "Nova God", rate: "80:1", benefit: "💎 75% Staking + 0% Fee", icon: <Trophy color="#00F2FE" /> },
];

interface RankingModalProps {
    onClose: () => void;
}

export const RankingModal: React.FC<RankingModalProps> = ({ onClose }) => {
    // 2. Usamos la interfaz aquí en lugar de 'any[]'
    const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentLvl, setCurrentLvl] = useState(1);

    useEffect(() => {
        const fetchRank = async () => {
            setLoading(true);
            const { data } = await supabase.rpc('get_level_leaderboard', { target_level: currentLvl });
            if (data) {
                // TypeScript ahora sabe que 'data' debe coincidir con LeaderboardUser[]
                setLeaders(data as LeaderboardUser[]);
            }
            setLoading(false);
        };
        fetchRank();
    }, [currentLvl]);

    const info = LEVEL_BENEFITS[currentLvl - 1];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 3000, padding: '20px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center'
        }}>
            <div className="glass-card" style={{ maxHeight: '85vh', overflow: 'hidden', display:'flex', flexDirection:'column', position: 'relative', padding:0, border: `1px solid ${currentLvl >= 7 ? '#FFD700' : '#333'}` }}>
                
                {/* Header de Navegación */}
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X /></button>
                    
                    <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'15px', marginBottom:'10px'}}>
                        <button onClick={() => setCurrentLvl(p => Math.max(1, p - 1))} disabled={currentLvl===1} style={{background:'none', border:'none', color:'#fff', opacity: currentLvl===1?0.3:1, cursor: 'pointer'}}><ChevronLeft size={32}/></button>
                        
                        <div style={{textAlign:'center', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                            <div style={{ marginBottom: '5px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }}>
                                {info.icon}
                            </div>
                            <div style={{fontSize:'12px', color:'#aaa', letterSpacing:'2px'}}>LEAGUE {currentLvl}</div>
                            <div style={{fontSize:'24px', fontWeight:'900', color: currentLvl>=7 ? '#FFD700' : '#00F2FE', textTransform:'uppercase'}}>{info.name}</div>
                        </div>

                        <button onClick={() => setCurrentLvl(p => Math.min(8, p + 1))} disabled={currentLvl===8} style={{background:'none', border:'none', color:'#fff', opacity: currentLvl===8?0.3:1, cursor: 'pointer'}}><ChevronRight size={32}/></button>
                    </div>

                    {/* Tarjeta de Beneficios del Nivel */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'8px', fontSize:'11px', display:'flex', justifyContent:'space-around' }}>
                        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                            <span style={{color:'#aaa'}}>Swap Rate</span>
                            <span style={{color:'#FFD700', fontWeight:'bold'}}>{info.rate}</span>
                        </div>
                        <div style={{width:'1px', background:'#444'}}></div>
                        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                            <span style={{color:'#aaa'}}>Key Perk</span>
                            <span style={{color:'#4CAF50', fontWeight:'bold'}}>{info.benefit}</span>
                        </div>
                    </div>
                </div>

                {/* Lista de Jugadores */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    {loading ? <p style={{textAlign:'center', marginTop:'20px', color:'#666'}}>Loading League Data...</p> : (
                        leaders.length === 0 ? <p style={{textAlign:'center', marginTop:'20px', color:'#444'}}>No players in this league yet.</p> :
                        leaders.map((user, index) => (
                            <div key={index} style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 15px', marginBottom: '8px', borderRadius: '10px',
                                background: index < 3 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.03)',
                                border: index < 3 ? '1px solid rgba(255, 215, 0, 0.3)' : 'none'
                            }}>
                                <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                                    <span style={{fontWeight:'bold', color: index<3?'#FFD700':'#666', width:'20px'}}>{index + 1}</span>
                                    <span style={{color: '#eee', fontWeight:'500'}}>
                                        {/* TypeScript ahora sabe que user tiene user_id y username */}
                                        {user.username || `Miner ${user.user_id.substring(0,4)}`}
                                    </span>
                                </div>
                                <span style={{color:'#00F2FE', fontFamily:'monospace', fontSize:'13px'}}>
                                    {user.score.toLocaleString()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};