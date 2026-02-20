import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
// IMPORTAMOS EL COMPONENTE DE LOTERÍA 
import { LotteryModal } from './GemLottery'; 
import { Copy, Share2, Gift, Crown, Percent, CheckCircle2, X, ChevronRight, Zap, Users, DollarSign, Ticket, Calendar, Tv, Trophy, Lock } from 'lucide-react';

// --- INTERFACES ---
interface RewardCardProps {
    icon: React.ReactNode;
    title: string;
    reward: string;
    sub?: string;
    color: string;
}

interface MilestoneRowProps {
    count: number;
    reward: string;
    done: boolean;
    isBig?: boolean;
}

interface ReferralUser {
    user_id: string;
    username: string;
    limit_level: number;
    bonus_claimed_initial: boolean;
    bonus_claimed_lvl4: boolean;
}

interface UserScoreData {
    referral_ton_earnings: number;
    referral_count: number;
}

interface SquadZoneProps {
    setGlobalScore: (val: number | ((prev: number) => number)) => void;
}

// ✅ INTERFAZ PARA RESPUESTA DE VIDEO
interface AdResponse {
    success: boolean;
    progress: number;
    rewarded: boolean;
}

// --- COMPONENTE: TICKET EMPIRE (SINCRONIZADO CON MISSION ZONE) ---
const TicketEmpire: React.FC<SquadZoneProps> = ({ setGlobalScore }) => {
    const { user } = useAuth();
    const [luckyTickets, setLuckyTickets] = useState(0);
    const [videoProgress, setVideoProgress] = useState(0); 
    
    // 🔥 CAMBIO: Usamos los mismos nombres de estado que en MissionZone para claridad lógica
    const [streak, setStreak] = useState(0); 
    const [checkedInToday, setCheckedInToday] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [showLottery, setShowLottery] = useState(false);

    // 🔥 EVENTO PARA RECIBIR TICKETS RETROACTIVOS DESDE SQUADZONE SIN CAMBIAR PROPS 🔥
    useEffect(() => {
        const handleAddTickets = ((e: CustomEvent) => {
            setLuckyTickets(prev => prev + e.detail);
        }) as EventListener;
        
        window.addEventListener('addLuckyTickets', handleAddTickets);
        return () => window.removeEventListener('addLuckyTickets', handleAddTickets);
    }, []);

    // Carga de datos UNIFICADA (Sincronización)
    useEffect(() => {
        if (!user) return;
        const fetchUserData = async () => {
            // 🔥 LEEMOS LAS MISMAS COLUMNAS QUE MISSION ZONE ('current_streak', 'last_check_in_date')
            const { data, error } = await supabase
                .from('user_score')
                .select('lucky_tickets, videos_watched_streak, current_streak, last_check_in_date')
                .eq('user_id', user.id)
                .single();

            if (!error && data) {
                setLuckyTickets(data.lucky_tickets || 0);
                setVideoProgress(data.videos_watched_streak || 0);
                
                // Sincronizamos el streak con la base de datos
                setStreak(data.current_streak || 0);
                
                // Verificamos si ya reclamó hoy (Igual que en MissionZone)
                const today = new Date().toISOString().split('T')[0];
                if (data.last_check_in_date === today) {
                    setCheckedInToday(true);
                } else {
                    setCheckedInToday(false);
                }
            }
        };
        fetchUserData();
    }, [user]);

    const handleWatchAd = async () => {
        if (loading || !user) return;
        const confirmWatch = window.confirm("📺 WATCH AD BOOSTER:\n\nWatch an ad to speed up your progress towards the next Ticket?\n\n(Tip: Ads watched in Shop & Arcade also count!)");
        if (!confirmWatch) return;

        setLoading(true);
        setTimeout(async () => {
            const { data, error } = await supabase.rpc('register_ad_view', { p_user_id: user.id });
            if (!error && data) {
                const result = data as AdResponse;
                setVideoProgress(result.progress);
                if (result.rewarded) {
                    alert("🎉 MILESTONE REACHED!\n\nYou earned +1 LUCKY TICKET!");
                    setLuckyTickets((prev: number) => prev + 1);
                }
            }
            setLoading(false);
        }, 2000);
    };

    // 🔥 FUNCIÓN DE CHECK-IN SINCRONIZADA 🔥
    const handleDailyCheckIn = async () => {
        if (loading || checkedInToday || !user) return;
        setLoading(true);

        // Usamos 'daily_check_in' (la misma que MissionZone)
        const { data, error } = await supabase.rpc('daily_check_in', { user_id_in: user.id });

        if (!error && data && data[0].success) {
            const reward = data[0].reward;
            
            // Actualizamos estados locales
            setStreak(prev => prev + 1);
            setCheckedInToday(true);
            setGlobalScore((prev: number) => prev + reward);

            // Mensaje especial si es día 7 (Multiplo de 7)
            if ((streak + 1) % 7 === 0) {
                 alert(`🏆 7-DAY STREAK COMPLETED!\n\nBIG REWARD: +${reward} PTS & Possible Lucky Ticket!`);
                 // Si tu lógica de backend da Lucky Ticket en el día 7, aquí podrías recargar los tickets:
                 // setLuckyTickets(prev => prev + 1); 
            } else {
                 alert(`✅ DAILY CHECK-IN SUCCESS!\n\nStreak: ${streak + 1} Days\nReceived: +${reward} PTS`);
            }
        } else {
            alert(data?.[0]?.message || "Error claiming reward.");
        }
        setLoading(false);
    };

    // Lógica visual para la barra de 7 días
    // Calculamos qué día del ciclo (1 al 7) toca mostrar
    const currentCycleDay = streak % 7; 
    // Si hoy ya reclamé, la barra de hoy debe estar llena. Si no, llena hasta ayer.
    const activeBars = checkedInToday ? (currentCycleDay === 0 ? 7 : currentCycleDay) : currentCycleDay;
    
    // Detectar si el siguiente botón es el premio gordo (Día 7)
    const isDay7Upcoming = (streak + 1) % 7 === 0;

    return (
        <div style={{ marginBottom: '20px' }}>
            {/* Modal de Lotería */}
            {showLottery && <LotteryModal onClose={() => setShowLottery(false)} luckyTickets={luckyTickets} setLuckyTickets={setLuckyTickets} />}

            {/* ENCABEZADO: TOTAL TICKETS + BOTÓN DE LOTERÍA */}
            <div className="cyber-card" style={{ 
                background: 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)',
                padding: '15px', borderRadius: '16px', textAlign: 'center', marginBottom: '15px',
                boxShadow: '0 0 15px rgba(138, 43, 226, 0.3)', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: -10, left: -10, width: '50px', height: '50px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <Ticket size={24} color="#fff" />
                    <span style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', opacity: 0.9 }}>LUCKY TICKETS</span>
                </div>
                <div style={{ fontSize: '36px', fontWeight: '900', textShadow: '0 2px 10px rgba(0,0,0,0.3)', lineHeight: '1' }}>
                    {luckyTickets}
                </div>
                
                <button 
                    onClick={() => setShowLottery(true)}
                    className="btn-neon" 
                    style={{ 
                        marginTop: '15px', width: '100%', background: '#FFD700', color: '#000', border: 'none', 
                        fontSize: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)' 
                    }}
                >
                    <Trophy size={14} color="#000" /> ENTER LOTTERY
                </button>
            </div>

            {/* SECCIÓN DE MISIONES */}
            <div style={{ display: 'flex', gap: '10px' }}>
                
                {/* 1. AD MILESTONE */}
                <div className="glass-card" style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.03)', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ background: '#FF512F', padding: '6px', borderRadius: '6px' }}><Tv size={14} color="#fff" /></div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '11px' }}>AD REWARDS</div>
                            <div style={{ fontSize: '8px', color: '#aaa' }}>Any Ad = +1 Progress</div>
                        </div>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '2px', color: '#00F2FE' }}>
                            <span>Global Count</span>
                            <span>{videoProgress}/20</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '2px' }}>
                            <div style={{ width: `${(videoProgress / 20) * 100}%`, height: '100%', background: '#00F2FE', borderRadius: '2px', transition: 'width 0.3s' }}></div>
                        </div>
                    </div>
                    <button onClick={handleWatchAd} disabled={loading} className="btn-cyber" style={{ width: '100%', padding: '6px', fontSize: '10px', background: loading ? '#333' : 'transparent', border: '1px solid #FF512F', color: '#FF512F' }}>
                        {loading ? '...' : 'WATCH AD NOW'}
                    </button>
                </div>

                {/* 2. DAILY STREAK (AHORA SINCRONIZADO) */}
                <div className="glass-card" style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.03)', display:'flex', flexDirection:'column', justifyContent:'space-between', border: isDay7Upcoming && !checkedInToday ? '1px solid #FFD700' : '1px solid #333' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ background: '#4CAF50', padding: '6px', borderRadius: '6px' }}><Calendar size={14} color="#fff" /></div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '11px' }}>STREAK</div>
                            <div style={{ fontSize: '8px', color: '#aaa' }}>Day {streak}</div>
                        </div>
                    </div>
                    
                    {/* Visualización de 7 días */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        {[1, 2, 3, 4, 5, 6, 7].map(day => {
                            const isActive = day <= activeBars;
                            return (
                                <div key={day} style={{ 
                                    width: '8px', height: '15px', borderRadius: '2px', 
                                    background: isActive ? (day === 7 ? '#FFD700' : '#4CAF50') : '#333',
                                    border: day === 7 ? '1px solid #FFD700' : 'none',
                                    boxShadow: day === 7 && isActive ? '0 0 5px #FFD700' : 'none'
                                }}></div>
                            );
                        })}
                    </div>

                    <button 
                        onClick={handleDailyCheckIn} 
                        disabled={checkedInToday || loading}
                        className="btn-cyber" 
                        style={{ 
                            width: '100%', padding: '6px', fontSize: '10px', 
                            borderColor: checkedInToday ? '#4CAF50' : (isDay7Upcoming ? '#FFD700' : '#4CAF50'),
                            background: checkedInToday ? 'rgba(76, 175, 80, 0.2)' : (isDay7Upcoming ? 'rgba(255, 215, 0, 0.2)' : 'transparent'),
                            color: checkedInToday ? '#4CAF50' : (isDay7Upcoming ? '#FFD700' : '#4CAF50'),
                            opacity: checkedInToday ? 0.8 : 1,
                            fontWeight: isDay7Upcoming && !checkedInToday ? 'bold' : 'normal'
                        }}
                    >
                        {checkedInToday ? 'CLAIMED' : (isDay7Upcoming ? 'CLAIM BONUS' : 'CLAIM')}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL (SQUAD ZONE) ---
export const SquadZone: React.FC<SquadZoneProps> = ({ setGlobalScore }) => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState(0);
    const [showMilestones, setShowMilestones] = useState(false);
    const [tonEarnings, setTonEarnings] = useState(0);
    const [showReferralList, setShowReferralList] = useState(false);
    const [referralList, setReferralList] = useState<ReferralUser[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [referralCode, setReferralCode] = useState<string | null>(null);

    const pointsQueue = useRef(0);
    const BOT_USERNAME = "Gnovatoken_bot"; 

    // 🔥 MODIFICAMOS EL LINK: Usamos el código si existe, si no, el ID
    const inviteLink = user 
        ? `https://t.me/${BOT_USERNAME}?start=${referralCode || user.id}` 
        : "Loading...";

    // Guardado de puntos (Batching)
    useEffect(() => {
        if (!user) return;
        const saveInterval = setInterval(async () => {
            if (pointsQueue.current > 0) {
                const pointsToSave = pointsQueue.current;
                pointsQueue.current = 0; 
                const { error } = await supabase.rpc('increment_score', { p_user_id: user.id, p_amount: pointsToSave });
                if (error) pointsQueue.current += pointsToSave;
            }
        }, 2000);
        return () => clearInterval(saveInterval);
    }, [user]);

    // Carga Inicial de Datos
    useEffect(() => {
        if (!user) return;
        const loadData = async () => {
            try {
                // 1. Cargar Estadísticas
                const { data: scoreData } = await supabase
                    .from('user_score')
                    .select('referral_ton_earnings')
                    .eq('user_id', user.id)
                    .single();
                
                const userData = scoreData as unknown as UserScoreData;
                if (userData) setTonEarnings(userData.referral_ton_earnings || 0);

                // 2. Cargar Conteo de Referidos
                const { data: count, error: rpcError } = await supabase.rpc('get_my_referrals', { my_id: user.id });
                if (!rpcError) setReferrals(Number(count) || 0);

                // 3. 🔥 OBTENER O CREAR CÓDIGO DE REFERIDO BONITO 🔥
                const { data: codeData } = await supabase.rpc('get_or_create_referral_code', { p_user_id: user.id });
                // "@ts-expect-error"
                if (codeData && codeData.code) {
                    // "@ts-expect-error"
                    setReferralCode(codeData.code);
                }

            } catch (e) { console.error("Error crítico:", e); }
        };
        loadData();
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, [user]);

    // 🔥 LÓGICA NUEVA: ENTREGAR TICKETS RETROACTIVOS Y NUEVOS POR REFERIDO 🔥
    useEffect(() => {
        if (!user || referrals === 0) return;
        
        const syncReferralTickets = async () => {
            const storedKey = `retro_tickets_synced_${user.id}`;
            const syncedCount = Number(localStorage.getItem(storedKey) || 0);
            
            // Si tiene más referidos que los tickets que ya hemos procesado
            if (referrals > syncedCount) {
                const ticketsToAdd = referrals - syncedCount;
                
                // Traemos sus tickets actuales de la BD para sumarle los nuevos
                const { data, error } = await supabase
                    .from('user_score')
                    .select('lucky_tickets')
                    .eq('user_id', user.id)
                    .single();
                    
                if (!error && data) {
                    const newTotal = (data.lucky_tickets || 0) + ticketsToAdd;
                    
                    // Guardamos el nuevo total en Supabase
                    const { error: updateError } = await supabase
                        .from('user_score')
                        .update({ lucky_tickets: newTotal })
                        .eq('user_id', user.id);
                        
                    if (!updateError) {
                        // Marcamos localmente que ya le dimos estos tickets
                        localStorage.setItem(storedKey, String(referrals));
                        // Disparamos el evento para que TicketEmpire se actualice visualmente al instante
                        window.dispatchEvent(new CustomEvent('addLuckyTickets', { detail: ticketsToAdd }));
                    }
                }
            }
        };
        
        syncReferralTickets();
    }, [user, referrals]);
    // ==========================================

    const fetchReferralList = async () => {
        if(!user) return;
        if (referralList.length === 0) setLoadingList(true);
        const { data, error } = await supabase.rpc('get_my_referrals_list', { my_id: user.id });
        if(error) console.error("Error loading list:", error);
        else setReferralList(data as ReferralUser[]);
        setLoadingList(false);
    };

    const handleOpenAgents = () => {
        setShowReferralList(true);
        fetchReferralList();
    };

    const handleClaimReward = async (targetId: string, type: 'initial' | 'lvl4') => {
        if(!user) return;
        setReferralList(prev => prev.map(u => {
            if(u.user_id === targetId) {
                return { ...u, bonus_claimed_initial: type === 'initial' ? true : u.bonus_claimed_initial, bonus_claimed_lvl4: type === 'lvl4' ? true : u.bonus_claimed_lvl4 };
            }
            return u;
        }));
        const { data, error } = await supabase.rpc('claim_referral_reward', { referral_user_id: targetId, reward_type: type, my_id: user.id });
        if(error || !data) {
            alert("Error claiming reward.");
            fetchReferralList();
        } else {
            const amount = type === 'initial' ? 2500 : 5000;
            if (setGlobalScore) setGlobalScore((prev: number) => prev + amount);
            if(window.navigator.vibrate) window.navigator.vibrate(200);
            setTimeout(() => { fetchReferralList(); }, 1000);
        }
    };

    const handleCopy = () => {
        if (!user) return; 
        navigator.clipboard.writeText(inviteLink);
        alert(`✅ Link Copied!\n\n${inviteLink}\n\nSend this Golden Link to your friends.`);
    };

    return (
        <div style={{ padding: '0 15px', paddingBottom: '100px', height: '100%', overflowY: 'auto' }}>
            
            {/* TICKET EMPIRE CON EL NUEVO BOTÓN DE LOTERÍA */}
            <TicketEmpire setGlobalScore={setGlobalScore} />

            {/* SQUAD DASHBOARD */}
            <div className="glass-card" style={{ padding: '10px', marginBottom: '10px', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{display:'flex', gap:'15px', cursor:'pointer'}} onClick={handleOpenAgents}>
                    <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'18px', fontWeight:'900', color:'#fff'}}>{referrals}</div>
                        <div style={{fontSize:'8px', color:'#aaa', display:'flex', alignItems:'center', gap:'2px', justifyContent:'center'}}>
                            <Users size={8}/> AGENTS
                        </div>
                    </div>
                    <div style={{width:'1px', height:'25px', background:'rgba(255,255,255,0.1)'}}></div>
                    <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'18px', fontWeight:'900', color:'#4CAF50'}}>{tonEarnings.toFixed(2)}</div>
                        <div style={{fontSize:'8px', color:'#aaa', display:'flex', alignItems:'center', gap:'2px', justifyContent:'center'}}>
                            <DollarSign size={8}/> TON
                        </div>
                    </div>
                </div>
                <div style={{display:'flex', gap:'5px'}}>
                    <button onClick={handleCopy} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #444', padding: '8px', borderRadius: '8px', color: '#fff', cursor:'pointer' }}>
                        <Copy size={14} />
                    </button>
                    <button onClick={() => { if (user) window.open(`https://t.me/share/url?url=${inviteLink}&text=🔥 Join Gem Nova! Mine crypto before launch! 🚀`, '_blank'); }} className="btn-neon" style={{ padding: '8px 12px', fontSize: '10px', background: '#00F2FE', color: '#000', height: 'auto', display:'flex', alignItems:'center', gap:'4px' }}>
                        <Share2 size={14}/> INVITE
                    </button>
                </div>
            </div>

            {/* BOUNTY BOARD */}
            <div className="glass-card" style={{ padding:'10px', marginBottom:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', borderBottom:'1px solid #333', paddingBottom:'5px' }}>
                    <h3 style={{ fontSize: '12px', margin: 0, color:'#aaa' }}>ACTIVE BOUNTIES</h3>
                    <div style={{fontSize:'8px', color:'#4CAF50', background:'rgba(76, 175, 80, 0.1)', padding:'2px 6px', borderRadius:'4px'}}>AUTO-CLAIM</div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'8px'}}>
                    <RewardCard icon={<Gift size={12} color="#4CAF50"/>} title="New Recruit" reward="+2,500 Pts" color="#4CAF50" />
                    <RewardCard icon={<Zap size={12} color="#E040FB"/>} title="Active Miner" reward="+5,000 Pts" sub="Lvl 4" color="#E040FB" />
                </div>
                <div style={{ background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '10px', padding: '10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                        <div style={{background:'rgba(255, 215, 0, 0.2)', padding:'6px', borderRadius:'6px'}}>
                            <Percent size={14} color="#FFD700"/>
                        </div>
                        <div>
                            <div style={{fontSize:'11px', fontWeight:'bold', color:'#FFD700'}}>SHOP COMMISSION</div>
                            <div style={{fontSize:'8px', color:'#aaa'}}>Earn Real TON Cash</div>
                        </div>
                    </div>
                    <div style={{fontSize:'14px', fontWeight:'900', color:'#FFD700'}}>1% - 5%</div>
                </div>
            </div>

            <button onClick={() => setShowMilestones(true)} className="glass-card" style={{ width: '100%', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', cursor: 'pointer' }}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <Crown size={18} color="#FFD700" />
                    <span style={{ fontWeight: 'bold', color: '#aaa', fontSize:'12px' }}>VIEW ALL MILESTONES</span>
                </div>
                <ChevronRight size={14} color="#aaa" />
            </button>

            {/* MODAL 1: AGENTS LIST */}
            {showReferralList && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 6000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                    <div className="glass-card" style={{ width: '100%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #00F2FE', position: 'relative', padding:'15px' }}>
                        <button onClick={() => setShowReferralList(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#fff' }}><X /></button>
                        <h3 style={{ textAlign: 'center', color: '#00F2FE', marginTop: 0, display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                            <Users size={20}/> YOUR AGENTS
                        </h3>

                        {loadingList && referralList.length === 0 ? (
                            <p style={{textAlign:'center', color:'#aaa'}}>Scanning blockchain...</p>
                        ) : referralList.length === 0 ? (
                            <div style={{textAlign:'center', padding:'20px', color:'#666'}}>
                                <p>No active agents found.</p>
                                <p style={{fontSize:'12px'}}>Invite friends to start building your squad!</p>
                            </div>
                        ) : (
                            <div style={{marginTop:'15px'}}>
                                <div style={{display:'grid', gridTemplateColumns:'0.5fr 2fr 1fr 1fr', fontSize:'10px', color:'#666', marginBottom:'10px', paddingBottom:'5px', borderBottom:'1px solid #333'}}>
                                    <div>#</div>
                                    <div>AGENT</div>
                                    <div style={{textAlign:'center'}}>INIT</div>
                                    <div style={{textAlign:'center'}}>LVL 4</div>
                                </div>
                                {referralList.map((refUser, index) => (
                                    <div key={refUser.user_id} style={{display:'grid', gridTemplateColumns:'0.5fr 2fr 1fr 1fr', alignItems:'center', marginBottom:'10px', fontSize:'12px'}}>
                                        <div style={{color:'#aaa'}}>{index + 1}</div>
                                        <div>
                                            <div style={{color:'#fff', fontWeight:'bold'}}>{refUser.username || 'Unknown'}</div>
                                            <div style={{fontSize:'9px', color:'#00F2FE'}}>Lvl {refUser.limit_level}</div>
                                        </div>
                                        <div style={{textAlign:'center'}}>
                                            {refUser.bonus_claimed_initial ? (
                                                <CheckCircle2 size={16} color="#4CAF50" style={{margin:'0 auto'}}/>
                                            ) : (
                                                <button onClick={() => handleClaimReward(refUser.user_id, 'initial')} style={{background:'#4CAF50', border:'none', borderRadius:'4px', color:'#000', fontSize:'9px', fontWeight:'bold', padding:'4px', cursor:'pointer', width:'100%'}}>GET</button>
                                            )}
                                        </div>
                                        <div style={{textAlign:'center'}}>
                                            {refUser.bonus_claimed_lvl4 ? (
                                                <CheckCircle2 size={16} color="#E040FB" style={{margin:'0 auto'}}/>
                                            ) : refUser.limit_level >= 4 ? (
                                                <button onClick={() => handleClaimReward(refUser.user_id, 'lvl4')} style={{background:'#E040FB', border:'none', borderRadius:'4px', color:'#fff', fontSize:'9px', fontWeight:'bold', padding:'4px', cursor:'pointer', width:'100%'}}>5K</button>
                                            ) : (
                                                <Lock size={14} color="#444" style={{margin:'0 auto'}}/>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 2: MILESTONES */}
            {showMilestones && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 6000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass-card" style={{ width: '100%', maxHeight: '70vh', overflowY: 'auto', border: '1px solid #FFD700', position: 'relative' }}>
                        <button onClick={() => setShowMilestones(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#fff' }}><X /></button>
                        <h3 style={{ textAlign: 'center', color: '#FFD700', marginTop: 0 }}>SQUAD GOALS</h3>
                        <MilestoneRow count={5} reward="2.5k" done={referrals >= 5} />
                        <MilestoneRow count={10} reward="10k" done={referrals >= 10} />
                        <MilestoneRow count={25} reward="50k" done={referrals >= 25} />
                        <MilestoneRow count={50} reward="200k" done={referrals >= 50} isBig />
                        <button onClick={() => setShowMilestones(false)} className="btn-neon" style={{ width: '100%', marginTop: '20px' }}>CLOSE</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- COMPONENTES AUXILIARES ---
const RewardCard: React.FC<RewardCardProps> = ({ icon, title, reward, sub, color }) => (
    <div style={{ background: `rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.1)`, border: `1px solid ${color}40`, borderRadius: '10px', padding: '8px', display: 'flex', flexDirection: 'column', gap:'4px' }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            {icon}
            {sub && <span style={{fontSize:'8px', background:'#333', padding:'1px 4px', borderRadius:'3px', color:'#aaa'}}>{sub}</span>}
        </div>
        <div style={{fontSize:'10px', color:'#ddd'}}>{title}</div>
        <div style={{fontSize:'12px', fontWeight:'bold', color: color}}>{reward}</div>
    </div>
);

const MilestoneRow: React.FC<MilestoneRowProps> = ({ count, reward, done, isBig }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', marginBottom: '8px', borderRadius: '10px', background: done ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.03)', border: isBig ? '1px solid #FFD700' : '1px solid #333', opacity: done ? 1 : 0.7 }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: done ? '#4CAF50' : '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', border:'1px solid #444' }}>
                {done ? <CheckCircle2 size={12} color="#000" /> : <span style={{ fontSize: '9px', color:'#aaa' }}>{count}</span>}
            </div>
            <span style={{ color: done ? '#fff' : '#aaa', fontWeight: 'bold', fontSize:'12px' }}>{count} Invites</span>
        </div>
        <span style={{ color: isBig ? '#FFD700' : '#4CAF50', fontWeight: 'bold', fontSize:'12px' }}>+{reward}</span>
    </div>
);