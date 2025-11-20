import { useEffect, useState } from 'react'; // Quitamos React de aquí si usas Vite nuevo
import { supabase } from '../services/supabase';
import { X, Trophy } from 'lucide-react';

// 1. Definir la interfaz de los datos del usuario
interface LeaderboardUser {
    score: number;
    user_id: string;
}

// 2. Definir las props del componente
interface RankingModalProps {
    onClose: () => void;
}

export const RankingModal: React.FC<RankingModalProps> = ({ onClose }) => {
    // 3. Usar el tipo correcto en el estado
    const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRank = async () => {
            const { data, error } = await supabase
                .from('user_score')
                .select('score, user_id')
                .order('score', { ascending: false })
                .limit(50);
            
            if (error) {
                console.error("Error cargando ranking:", error);
            } else if (data) {
                setLeaders(data); // TypeScript ahora sabe que 'data' coincide con LeaderboardUser[]
            }
            setLoading(false);
        };
        fetchRank();
    }, []);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 2000, padding: '20px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center'
        }}>
            <div className="glass-card" style={{ maxHeight: '80vh', overflowY: 'auto', position: 'relative', border: '1px solid #FFD700' }}>
                
                <button onClick={onClose} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                    <X />
                </button>
                
                <h2 style={{ textAlign: 'center', color: '#FFD700', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginTop: 0 }}>
                    <Trophy /> TOP MINERS
                </h2>

                {loading ? (
                    <p style={{textAlign:'center', color:'#aaa'}}>Loading data...</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {leaders.map((user, index) => (
                            <div key={index} style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px', borderRadius: '12px',
                                background: index === 0 ? 'linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, transparent 100%)' : 'rgba(255,255,255,0.05)',
                                borderLeft: index < 3 ? `4px solid ${index === 0 ? '#FFD700' : (index === 1 ? '#C0C0C0' : '#CD7F32')}` : 'none'
                            }}>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <span style={{fontWeight:'bold', color: '#fff', width: '25px'}}>#{index + 1}</span>
                                    <span style={{color: '#ddd'}}>
                                        Miner {user.user_id.substring(0, 4)}...
                                    </span>
                                </div>
                                <span style={{color:'#00F2FE', fontWeight:'bold'}}>
                                    {user.score.toLocaleString()} pts
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};