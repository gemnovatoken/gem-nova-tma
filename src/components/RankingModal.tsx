import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { X, Trophy, Medal } from 'lucide-react';

interface RankingEntry {
    display_name: string;
    score: number;
    is_current_user: boolean;
}

export const RankingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [rankings, setRankings] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRankings = async () => {
            const { data, error } = await supabase.rpc('get_top_ranking', { limit_num: 50 });
            if (!error && data) {
                setRankings(data);
            }
            setLoading(false);
        };
        fetchRankings();
    }, []);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 10000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
            <div className="glass-card" style={{
                width: '100%', maxWidth: '400px', maxHeight: '80vh',
                display: 'flex', flexDirection: 'column', position: 'relative',
                border: '1px solid #FFD700', borderRadius: '20px', padding: '20px'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: 15, right: 15,
                    background: 'none', border: 'none', color: '#fff', cursor: 'pointer'
                }}><X size={24} /></button>

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <Trophy size={48} color="#FFD700" style={{ marginBottom: '10px' }} />
                    <h2 style={{ margin: 0, color: '#FFD700' }}>Global Ranking</h2>
                    <p style={{ margin: '5px 0', color: '#aaa', fontSize: '12px' }}>Top 50 Players</p>
                </div>

                <div style={{ 
                    overflowY: 'auto', 
                    paddingRight: '5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    {loading ? (
                        <div style={{textAlign:'center', color:'#aaa'}}>Loading rankings...</div>
                    ) : rankings.map((player, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            borderRadius: '12px',
                            background: player.is_current_user ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                            border: player.is_current_user ? '1px solid #FFD700' : '1px solid transparent',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ 
                                    width: '30px', 
                                    fontWeight: 'bold', 
                                    color: index < 3 ? '#FFD700' : '#888',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {index === 0 ? <Medal size={20} color="#FFD700" /> : 
                                     index === 1 ? <Medal size={20} color="#C0C0C0" /> : 
                                     index === 2 ? <Medal size={20} color="#CD7F32" /> : 
                                     `#${index + 1}`}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ 
                                        color: player.is_current_user ? '#FFD700' : '#fff',
                                        fontWeight: player.is_current_user ? 'bold' : 'normal'
                                    }}>
                                        {player.display_name} {player.is_current_user && '(You)'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#fff' }}>
                                {player.score.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};