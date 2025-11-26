import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Calendar, CheckCircle2, Lock, Play, Brain, Rocket, Shield } from 'lucide-react';
import { MemoryGame, AsteroidGame, HackerGame } from './ArcadeGames';

interface GameCardProps {
    title: string;
    desc: string;
    reward: string | number;
    icon: React.ReactNode;
    color: string;
    onPlay: () => void;
}

export const MissionZone: React.FC = () => {
    const { user } = useAuth();
    const [streak, setStreak] = useState(0);
    const [checkedInToday, setCheckedInToday] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeGame, setActiveGame] = useState<string | null>(null);

    useEffect(() => {
        if(!user) return;
        const fetchData = async () => {
            const { data } = await supabase.from('user_score').select('current_streak, last_check_in_date').eq('user_id', user.id).single();
            if (data) {
                setStreak(data.current_streak);
                const today = new Date().toISOString().split('T')[0];
                if (data.last_check_in_date === today) setCheckedInToday(true);
            }
        };
        fetchData();
    }, [user]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollLeft = (streak - 2) * 70;
    }, [streak]);

    const handleCheckIn = async () => {
        if (checkedInToday || !user) return;
        const { data, error } = await supabase.rpc('daily_check_in', { user_id_in: user.id });
        if (!error && data && data[0].success) {
            alert(`✅ Check-in Complete! +${data[0].reward} Pts`);
            setStreak(data[0].new_streak);
            setCheckedInToday(true);
        } else alert(data?.[0]?.message || "Error");
    };

    const handleGameFinish = async (won: boolean, score: number, gameId: string) => {
        setActiveGame(null);
        if (won && user) {
            await supabase.rpc('play_minigame', { user_id_in: user.id, game_id: gameId, score_obtained: score });
            alert(`🏆 VICTORIA! Ganaste +${score} Puntos`);
        } else {
            alert("❌ Perdiste. Intenta de nuevo.");
        }
    };

    const renderCalendarDays = () => {
        const days = [];
        const maxDayToShow = Math.max(7, streak + 5); 
        
        for (let i = 1; i <= maxDayToShow; i++) {
            // ✅ CORRECCIÓN: Usamos 'const' porque el valor no cambia dentro de la iteración
            const reward = i <= 4 ? (i + 1) * 100 : (i <= 9 ? 500 + ((i - 4) * 50) : 1000);
            
            const isPast = i < (checkedInToday ? streak : streak + 1);
            const isToday = i === (checkedInToday ? streak : streak + 1);
            const isLocked = i > (checkedInToday ? streak : streak + 1);

            days.push(
                <div key={i} className="glass-card" style={{
                    minWidth: '70px', height: '90px', margin: '0 5px', padding: '10px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
                    border: isToday ? '2px solid #00F2FE' : (isPast ? '1px solid #4CAF50' : '1px solid #333'),
                    background: isToday ? 'rgba(0, 242, 254, 0.1)' : (isPast ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.02)'),
                    opacity: isLocked ? 0.5 : 1
                }}>
                    <span style={{fontSize:'10px', color:'#aaa'}}>DAY {i}</span>
                    {isLocked ? <Lock size={16} color="#555"/> : (isPast ? <CheckCircle2 size={16} color="#4CAF50"/> : <Calendar size={16} color="#00F2FE"/>)}
                    <span style={{fontSize:'10px', fontWeight:'bold', color: isToday ? '#fff' : '#888'}}>+{reward}</span>
                </div>
            );
        }
        return days;
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            {activeGame === 'memory' && <MemoryGame onClose={() => setActiveGame(null)} onFinish={(w, s) => handleGameFinish(w, s, 'Memory')} />}
            {activeGame === 'asteroid' && <AsteroidGame onClose={() => setActiveGame(null)} onFinish={(w, s) => handleGameFinish(w, s, 'Asteroid')} />}
            {activeGame === 'hacker' && <HackerGame onClose={() => setActiveGame(null)} onFinish={(w, s) => handleGameFinish(w, s, 'Hacker')} />}

            <div style={{textAlign:'center', marginBottom:'20px'}}>
                <h2 style={{marginTop: 0, fontSize:'28px', marginBottom:'5px', color:'#fff'}}>🗺️ Expedition</h2>
                <p style={{fontSize: '12px', color: '#aaa', margin:0}}>Daily Login Rewards</p>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <div ref={scrollRef} style={{ display: 'flex', overflowX: 'auto', paddingBottom: '10px', scrollBehavior:'smooth' }}>
                    {renderCalendarDays()}
                </div>
                {!checkedInToday ? (
                    <button className="btn-neon" onClick={handleCheckIn} style={{width:'100%', marginTop:'10px'}}>✅ CHECK IN DAY {streak + 1}</button>
                ) : (
                    <div style={{textAlign:'center', fontSize:'12px', color:'#4CAF50', marginTop:'10px'}}>Come back tomorrow!</div>
                )}
            </div>

            <h3 style={{ fontSize:'16px', marginBottom:'15px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>🕹️ Nova Arcade</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <GameCard title="Quantum Code" desc="Memory Challenge" reward="3,000" icon={<Brain color="#E040FB"/>} color="#E040FB" onPlay={() => setActiveGame('memory')} />
                <GameCard title="Asteroid Defense" desc="Reaction Test" reward="500/hit" icon={<Shield color="#FF512F"/>} color="#FF512F" onPlay={() => setActiveGame('asteroid')} />
                <GameCard title="Vault Hacker" desc="Precision Timing" reward="5,000" icon={<Rocket color="#00F2FE"/>} color="#00F2FE" onPlay={() => setActiveGame('hacker')} />
            </div>
        </div>
    );
};

const GameCard: React.FC<GameCardProps> = ({ title, desc, reward, icon, color, onPlay }) => (
    <div className="glass-card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'15px', borderLeft:`4px solid ${color}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:'15px' }}>
            <div style={{ background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'10px' }}>{icon}</div>
            <div>
                <div style={{ fontWeight:'bold', fontSize:'14px', color:'#fff' }}>{title}</div>
                <div style={{ fontSize:'11px', color:'#aaa' }}>{desc}</div>
            </div>
        </div>
        <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'12px', color:color, fontWeight:'bold' }}>+{reward}</div>
            <button onClick={onPlay} style={{ marginTop:'5px', background: color, border:'none', borderRadius:'5px', padding:'4px 10px', color:'#000', fontSize:'10px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                <Play size={10}/> PLAY
            </button>
        </div>
    </div>
);