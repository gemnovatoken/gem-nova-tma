import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
// 🔥 Añadimos Twitter y Youtube a las importaciones
import { Calendar, CheckCircle2, Play, Brain, Rocket, Shield, Coins, Gift, Zap, Tv, MessageCircle, Map, X, Twitter, Youtube } from 'lucide-react';
import { MemoryGame, AsteroidGame, HackerGame } from './ArcadeGames';
import { MillionPath } from './MillionPath';

interface TransactionResponse {
    success: boolean;
    new_coins?: number;
    message?: string;
}

interface GameCardProps {
    title: string;
    desc: string;
    reward: string | number;
    icon: React.ReactNode;
    color: string;
    onPlay: () => void;
}

interface MissionZoneProps {
    setGlobalScore: (val: number | ((prev: number) => number)) => void;
}

interface CommunityTaskCardProps {
    title: string;
    desc: string;
    reward: number;
    status: 'idle' | 'pending' | 'claimed';
    isLoading: boolean;
    onGo: () => void;
    onVerify: () => void;
    icon: React.ReactNode;
    color: string;
}

export const MissionZone: React.FC<MissionZoneProps> = ({ setGlobalScore }) => {
    const { user } = useAuth();
    const [streak, setStreak] = useState(0);
    const [checkedInToday, setCheckedInToday] = useState(false);
    const [coins, setCoins] = useState(3);
    const [loadingAd, setLoadingAd] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeGame, setActiveGame] = useState<string | null>(null);

    const [showPathModal, setShowPathModal] = useState(false);

    // 🔥 ESTADOS ACTUALIZADOS (News, Global, Twitter, YouTube)
    const [newsStatus, setNewsStatus] = useState<'idle' | 'pending' | 'claimed'>('idle');
    const [globalStatus, setGlobalStatus] = useState<'idle' | 'pending' | 'claimed'>('idle');
    const [twitterStatus, setTwitterStatus] = useState<'idle' | 'pending' | 'claimed'>('idle');
    const [youtubeStatus, setYoutubeStatus] = useState<'idle' | 'pending' | 'claimed'>('idle');
    const [claimingTask, setClaimingTask] = useState<string | null>(null);
    
    // Ref para guardar el momento exacto
    const clickTimestamps = useRef({ news: 0, global: 0, twitter: 0, youtube: 0 });

    const loadData = useCallback(async () => {
        if(!user) return;
        const { data, error } = await supabase
            .from('user_score')
            // 🔥 LEEMOS LAS NUEVAS COLUMNAS
            .select('current_streak, last_check_in_date, arcade_coins, last_news_claim, last_global_claim, last_twitter_claim, last_youtube_claim')
            .eq('user_id', user.id)
            .single();
            
        if (!error && data) {
            setStreak(data.current_streak || 0);
            const today = new Date().toISOString().split('T')[0];
            
            if (data.last_check_in_date === today) setCheckedInToday(true);
            
            // Si ya cobró hoy, bloqueamos el botón permanentemente hasta mañana
            if (data.last_news_claim === today) setNewsStatus('claimed');
            if (data.last_global_claim === today) setGlobalStatus('claimed');
            if (data.last_twitter_claim === today) setTwitterStatus('claimed');
            if (data.last_youtube_claim === today) setYoutubeStatus('claimed');
            
            setCoins(data.arcade_coins ?? 0);
        }
    }, [user]);

    useEffect(() => {
        const t = setTimeout(() => loadData(), 0);
        return () => clearTimeout(t);
    }, [loadData]);

    useEffect(() => {
        setTimeout(() => {
            if (scrollRef.current) {
                const cardWidth = 85; 
                const centerOffset = (window.innerWidth / 2) - (cardWidth / 2) - 20; 
                scrollRef.current.scrollLeft = (streak * cardWidth) - centerOffset;
            }
        }, 100);
    }, [streak]);

    const handleCheckIn = async () => {
        if (checkedInToday || !user) return;
        const { data, error } = await supabase.rpc('daily_check_in', { user_id_in: user.id });
        if (!error && data && data[0].success) {
            const reward = data[0].reward;
            if (window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
            
            setGlobalScore(prev => prev + reward);
            alert(`✅ +${reward} PTS CLAIMED!`);
            loadData();
        } else {
            alert(data?.[0]?.message || "Error");
        }
    };

    const handleTaskGo = (taskType: 'news' | 'global' | 'twitter' | 'youtube', url: string) => {
        clickTimestamps.current[taskType] = Date.now();
        
        if (taskType === 'news') setNewsStatus('pending');
        else if (taskType === 'global') setGlobalStatus('pending');
        else if (taskType === 'twitter') setTwitterStatus('pending');
        else if (taskType === 'youtube') setYoutubeStatus('pending');

        // @ts-expect-error Explicacion: TypeScript no conoce WebApp
        if (window.Telegram?.WebApp?.openTelegramLink && !url.includes('youtube.com') && !url.includes('x.com')) {
             // @ts-expect-error Explicacion: Telegram API
             window.Telegram.WebApp.openTelegramLink(url);
        } else {
             window.open(url, '_blank');
        }
    };

    const handleTaskVerify = async (taskType: 'news' | 'global' | 'twitter' | 'youtube') => {
        if (!user || claimingTask) return;

        const timeSpentAway = Date.now() - clickTimestamps.current[taskType];

        // 3 segundos anti-trampas
        if (timeSpentAway < 3000) {
            alert("⚠️ VERIFICATION FAILED!\n\nYou must engage with the content for at least 3 seconds to verify.");
            return;
        }

        setClaimingTask(taskType);
        
        try {
            const today = new Date().toISOString().split('T')[0];
            let columnToUpdate = '';
            let taskName = '';

            if (taskType === 'news') { columnToUpdate = 'last_news_claim'; taskName = 'Gnova News'; }
            else if (taskType === 'global') { columnToUpdate = 'last_global_claim'; taskName = 'Gnova Global'; }
            else if (taskType === 'twitter') { columnToUpdate = 'last_twitter_claim'; taskName = 'X (Twitter)'; }
            else if (taskType === 'youtube') { columnToUpdate = 'last_youtube_claim'; taskName = 'YouTube'; }
            
            await supabase.rpc('increment_score', { p_user_id: user.id, p_amount: 500 });
            await supabase.from('user_score').update({ [columnToUpdate]: today }).eq('user_id', user.id);
            
            if (taskType === 'news') setNewsStatus('claimed');
            else if (taskType === 'global') setGlobalStatus('claimed');
            else if (taskType === 'twitter') setTwitterStatus('claimed');
            else if (taskType === 'youtube') setYoutubeStatus('claimed');
            
            setGlobalScore(prev => prev + 500);
            
            if (window.navigator.vibrate) window.navigator.vibrate(200);
            alert(`✅ VERIFIED! +500 PTS added from ${taskName}.`);
        } catch {
            alert("Error verifying task.");
        } finally {
            setClaimingTask(null);
        }
    };

    const handleWatchAdForCoins = async () => {
        if (!user || loadingAd) return;

        if(window.confirm("📺 WATCH AD for +2 COINS?\n\n(Bonus: This ad counts towards your Lucky Ticket!)")) {
            setLoadingAd(true);
            await new Promise(r => setTimeout(r, 2000));

            const { data, error } = await supabase.rpc('refill_arcade_coins_with_ad', { p_user_id: user.id });
            const result = data as TransactionResponse;

            if (!error && result.success) {
                setCoins(result.new_coins || 0);
                alert("✅ +2 COINS ADDED!\n🎟️ Lucky Ticket progress updated!");
            } else {
                alert("Error watching ad.");
            }
            setLoadingAd(false);
        }
    };

    const handlePlayGame = async (gameId: string) => {
        if (!user) return;
        
        if (coins <= 0) {
            handleWatchAdForCoins();
            return;
        }

        const { data } = await supabase.rpc('spend_arcade_coin', { p_user_id: user.id });
        const result = data as TransactionResponse;

        if (!result || result.success === false) {
             handleWatchAdForCoins();
        } else {
            setCoins(prev => prev - 1);
            setActiveGame(gameId);
        }
    };

    const handleGameFinish = async (won: boolean, score: number) => {
        setActiveGame(null);
        if (won && user) {
            await supabase.rpc('increment_score', { p_user_id: user.id, p_amount: score });
            setGlobalScore(prev => prev + score);
            alert(`🏆 VICTORIA! Ganaste +${score} Puntos`);
        }
        loadData();
    };

    const renderCalendarDays = () => {
        const days: React.ReactNode[] = [];
        const maxDayToShow = Math.max(7, streak + 4); 
        
        for (let i = 1; i <= maxDayToShow; i++) {
            const reward = i <= 4 ? (i + 1) * 100 : (i <= 9 ? 500 + ((i - 4) * 50) : 1000);
            const isPast = i < (checkedInToday ? streak : streak + 1);
            const isToday = i === (checkedInToday ? streak : streak + 1);
            const isMilestone = i === 5 || i === 10 || i === 15 || i === 30;

            let borderColor = '#333';
            let bg = 'rgba(255,255,255,0.03)';
            let shadow = 'none';
            let scale = '1';
            let iconColor = '#555';

            if (isPast) {
                borderColor = '#4CAF50';
                bg = 'rgba(76, 175, 80, 0.1)';
                iconColor = '#4CAF50';
            } else if (isToday) {
                borderColor = isMilestone ? '#FFD700' : '#00F2FE';
                bg = isMilestone ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 242, 254, 0.1)';
                shadow = isMilestone ? '0 0 20px rgba(255, 215, 0, 0.3)' : '0 0 15px rgba(0, 242, 254, 0.3)';
                scale = '1.1';
                iconColor = '#fff';
            } else if (isMilestone) {
                borderColor = '#E040FB'; 
                iconColor = '#E040FB';
            }

            days.push(
                <div key={i} style={{
                    minWidth: '75px', height: '100px', margin: '10px 6px', padding: '10px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
                    border: `1px solid ${borderColor}`, borderRadius: '15px',
                    background: bg, boxShadow: shadow, transform: `scale(${scale})`,
                    transition: 'all 0.3s ease', position: 'relative',
                    opacity: isPast ? 0.6 : 1
                }}>
                    {isMilestone && !isPast && (
                        <div style={{position:'absolute', top:-8, right:-5, fontSize:'8px', background: borderColor, color:'black', padding:'1px 4px', borderRadius:'4px', fontWeight:'bold'}}>
                            BONUS
                        </div>
                    )}
                    <span style={{fontSize:'9px', color:'#aaa', fontWeight:'bold'}}>DAY {i}</span>
                    <div style={{
                        width:'36px', height:'36px', borderRadius:'50%', background: isPast ? '#4CAF50' : 'rgba(0,0,0,0.3)',
                        display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${borderColor}`
                    }}>
                        {isPast ? <CheckCircle2 size={18} color="#000" /> : (
                            isMilestone ? <Gift size={18} color={iconColor} /> : 
                            (isToday ? <Zap size={18} color={iconColor} fill={iconColor} /> : <Calendar size={16} color="#444" />)
                        )}
                    </div>
                    <span style={{fontSize:'11px', fontWeight:'900', color: isToday ? '#fff' : (isMilestone ? '#E040FB' : '#888')}}>
                        +{reward}
                    </span>
                </div>
            );
        }
        return days;
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            
            {showPathModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9000,
                    background: '#0a0a0a', overflowY: 'auto', display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => setShowPathModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '10px', color: '#fff', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </div>
                    <div style={{ flex: 1 }}>
                        <MillionPath setGlobalScore={setGlobalScore} />
                    </div>
                </div>
            )}

            {activeGame === 'memory' && <MemoryGame onClose={() => setActiveGame(null)} onFinish={(w, s) => handleGameFinish(w, s)} />}
            {activeGame === 'asteroid' && <AsteroidGame onClose={() => setActiveGame(null)} onFinish={(w, s) => handleGameFinish(w, s)} />}
            {activeGame === 'hacker' && <HackerGame onClose={() => setActiveGame(null)} onFinish={(w, s) => handleGameFinish(w, s)} />}

            <div style={{textAlign:'center', marginBottom:'25px'}}>
                <h2 style={{marginTop: 0, fontSize:'28px', marginBottom:'5px', color:'#fff'}}>🗺️ Expedition</h2>
                <div style={{display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.1)', padding:'5px 12px', borderRadius:'20px'}}>
                    <div style={{width:8, height:8, background: checkedInToday ? '#4CAF50' : '#FFD700', borderRadius:'50%', boxShadow: checkedInToday ? '0 0 5px #4CAF50' : '0 0 5px #FFD700'}}></div>
                    <span style={{fontSize: '12px', color: '#fff', fontWeight:'bold'}}>
                        Streak: {streak} Days
                    </span>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <div style={{ position:'relative' }}>
                    <div ref={scrollRef} className="no-scrollbar" style={{ 
                        display: 'flex', overflowX: 'auto', padding: '10px 5px', scrollBehavior:'smooth',
                        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                    }}>
                        {renderCalendarDays()}
                    </div>
                </div>
                
                {!checkedInToday ? (
                    <button className="btn-neon" onClick={handleCheckIn} style={{
                        width:'100%', marginTop:'15px', padding:'15px', fontSize:'16px',
                        background: 'linear-gradient(90deg, #00F2FE, #0072FF)', border:'none',
                        boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)'
                    }}>
                        CLAIM DAY {streak + 1} REWARD
                    </button>
                ) : (
                    <div style={{
                        textAlign:'center', fontSize:'12px', color:'#888', marginTop:'15px', 
                        background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'10px', border:'1px dashed #444'
                    }}>
                        ✅ Rewards claimed. Come back tomorrow.
                    </div>
                )}
            </div>

            {/* 🔥 BANNER DORADO ACTUALIZADO A 5M */}
            <div 
                onClick={() => setShowPathModal(true)}
                className="glass-card"
                style={{
                    marginBottom: '35px', padding: '0', overflow: 'hidden', cursor: 'pointer',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%)',
                    border: '1px solid #FFD700', boxShadow: '0 0 15px rgba(255, 215, 0, 0.2)'
                }}
            >
                <div style={{ padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: '#FFD700', padding: '10px', borderRadius: '12px', color: '#000' }}>
                            <Map size={24} />
                        </div>
                        <div>
                            <div style={{ color: '#FFD700', fontWeight: '900', fontSize: '16px', letterSpacing: '1px' }}>THE 5M PATH</div>
                            <div style={{ color: '#aaa', fontSize: '10px' }}>ULTIMATE PROTOCOL ACTIVATED</div>
                        </div>
                    </div>
                    <Play size={20} color="#FFD700" fill="#FFD700" />
                </div>
                <div style={{ background: 'rgba(255, 215, 0, 0.2)', padding: '5px', textAlign: 'center', fontSize: '10px', color: '#FFD700', fontWeight: 'bold' }}>
                    TAP TO OPEN MISSION MAP
                </div>
            </div>

            {/* 🔥 DAILY BOUNTIES EN GRID (2x2) */}
            <div style={{ marginBottom: '35px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', borderBottom:'1px solid #333', paddingBottom:'8px' }}>
                    <h3 style={{ fontSize:'16px', margin:0, color: '#fff' }}>📢 Daily Bounties</h3>
                    <span style={{ fontSize:'10px', color:'#FFD700', background:'rgba(255, 215, 0, 0.1)', padding:'2px 6px', borderRadius:'4px' }}>Resets in 24h</span>
                </div>
                
                {/* Contenedor Grid (2 Columnas) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    
                    <CommunityTaskCard 
                        title="TG News" 
                        desc="@gnovaofiicialnews"
                        reward={500} 
                        status={newsStatus}
                        isLoading={claimingTask === 'news'}
                        onGo={() => handleTaskGo('news', 'https://t.me/gnovaofiicialnews')}
                        onVerify={() => handleTaskVerify('news')}
                        icon={<Tv size={16} color="#00F2FE"/>}
                        color="#00F2FE"
                    />
                    
                    <CommunityTaskCard 
                        title="TG Global" 
                        desc="@gnovaglobal"
                        reward={500} 
                        status={globalStatus}
                        isLoading={claimingTask === 'global'}
                        onGo={() => handleTaskGo('global', 'https://t.me/gnovaglobal')}
                        onVerify={() => handleTaskVerify('global')}
                        icon={<MessageCircle size={16} color="#E040FB"/>}
                        color="#E040FB"
                    />

                    <CommunityTaskCard 
                        title="X (Twitter)" 
                        desc="@gnovatoken"
                        reward={500} 
                        status={twitterStatus}
                        isLoading={claimingTask === 'twitter'}
                        onGo={() => handleTaskGo('twitter', 'https://x.com/gnovatoken')}
                        onVerify={() => handleTaskVerify('twitter')}
                        icon={<Twitter size={16} color="#1DA1F2"/>}
                        color="#1DA1F2"
                    />

                    <CommunityTaskCard 
                        title="YouTube" 
                        desc="Anonymous"
                        reward={500} 
                        status={youtubeStatus}
                        isLoading={claimingTask === 'youtube'}
                        onGo={() => handleTaskGo('youtube', 'https://youtube.com/')}
                        onVerify={() => handleTaskVerify('youtube')}
                        icon={<Youtube size={16} color="#FF0000"/>}
                        color="#FF0000"
                    />

                </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', borderBottom:'1px solid #333', paddingBottom:'10px' }}>
                <h3 style={{ fontSize:'18px', margin:0 }}>🕹️ Arcade Zone</h3>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'#111', padding:'6px 12px', borderRadius:'20px', border:'1px solid #333' }}>
                    <Coins size={14} color={coins > 0 ? "#E040FB" : "#555"} />
                    <span style={{fontSize:'12px', fontWeight:'bold', color: coins > 0 ? "#fff" : "#555"}}>{coins} Coins</span>
                    {coins === 0 && (
                        <button onClick={handleWatchAdForCoins} style={{background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', marginLeft:'5px'}}>
                            <Tv size={14} color="#4CAF50"/>
                        </button>
                    )}
                </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <GameCard title="Quantum Memory" desc="Pattern recognition" reward="1,500" icon={<Brain color="#E040FB" size={20}/>} color="#E040FB" onPlay={() => handlePlayGame('memory')} />
                <GameCard title="Asteroid Field" desc="Reflex challenge" reward="~1,500" icon={<Shield color="#FF512F" size={20}/>} color="#FF512F" onPlay={() => handlePlayGame('asteroid')} />
                <GameCard title="System Hacker" desc="Timing precision" reward="1,500" icon={<Rocket color="#00F2FE" size={20}/>} color="#00F2FE" onPlay={() => handlePlayGame('hacker')} />
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

// --- COMPONENTES AUXILIARES ---

const GameCard: React.FC<GameCardProps> = ({ title, desc, reward, icon, color, onPlay }) => (
    <div className="glass-card" style={{ 
        display:'flex', alignItems:'center', justifyContent:'space-between', padding:'15px', 
        borderLeft:`4px solid ${color}`, transition: 'transform 0.1s', cursor:'pointer'
    }}
    onClick={onPlay}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
        <div style={{ display:'flex', alignItems:'center', gap:'15px' }}>
            <div style={{ background:`rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.1)`, padding:'12px', borderRadius:'12px' }}>
                {icon}
            </div>
            <div>
                <div style={{ fontWeight:'bold', fontSize:'14px', color:'#fff' }}>{title}</div>
                <div style={{ fontSize:'11px', color:'#aaa' }}>{desc}</div>
            </div>
        </div>
        <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'14px', color:color, fontWeight:'900' }}>+{reward}</div>
            <div style={{ fontSize:'9px', color:'#555', marginTop:'2px' }}>REWARD</div>
            <div style={{display:'none'}}><Play /></div> 
        </div>
    </div>
);

// 🔥 MODIFICADO PARA GRID: Ajusté los paddings y tamaños para que quepa bien en 2 columnas
const CommunityTaskCard: React.FC<CommunityTaskCardProps> = ({ title, desc, reward, status, isLoading, onGo, onVerify, icon, color }) => {
    
    const renderButton = () => {
        if (isLoading) {
            return <button disabled style={btnStyle('#555', 'transparent', '#555')}>...</button>;
        }
        if (status === 'claimed') {
            return <button disabled style={btnStyle('#4CAF50', 'transparent', '#4CAF50')}>DONE</button>;
        }
        if (status === 'pending') {
            return (
                <button onClick={onVerify} className="btn-neon" style={btnStyle('#000', '#00F2FE', 'none', '0 0 5px rgba(0, 242, 254, 0.4)')}>
                    VERIFY
                </button>
            );
        }
        return (
            <button onClick={onGo} className="btn-neon" style={btnStyle('#000', '#FFD700', 'none', '0 0 5px rgba(255, 215, 0, 0.4)')}>
                GO
            </button>
        );
    };

    const btnStyle = (textColor: string, bgColor: string, border: string, shadow: string = 'none'): React.CSSProperties => ({
        padding: '6px 0', width: '100%', fontSize: '10px', borderRadius: '6px', fontWeight: 'bold',
        color: textColor, background: bgColor, border: border !== 'none' ? `1px solid ${border}` : 'none',
        boxShadow: shadow, cursor: status === 'claimed' ? 'default' : 'pointer',
        display: 'flex', justifyContent: 'center', marginTop: '8px'
    });

    return (
        <div className="glass-card" style={{ 
            display: 'flex', flexDirection: 'column', padding: '10px', 
            background: status === 'claimed' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(255,255,255,0.03)', 
            border: status === 'claimed' ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid #333', 
            opacity: status === 'claimed' ? 0.6 : 1,
            transition: 'all 0.3s'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ background: `rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.1)`, padding: '6px', borderRadius: '8px' }}>
                    {icon}
                </div>
                <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                    <div style={{ fontSize: '9px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</div>
                </div>
            </div>
            <div style={{ fontSize: '10px', color: '#FFD700', textAlign: 'center', fontWeight: 'bold' }}>+{reward} PTS</div>
            {renderButton()}
        </div>
    );
};