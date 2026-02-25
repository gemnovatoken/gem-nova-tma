import { useState, useEffect, useRef, useCallback } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { BottomNav } from './components/BottomNav';
import { MyMainTMAComponent } from './components/MyMainTMAComponent';
import { MarketDashboard } from './components/MarketDashboard'; 
import { BulkStore } from './components/BulkStore';
import { SquadZone } from './components/SquadZone';
import { WalletRoadmap } from './components/WalletRoadmap';
import { supabase } from './services/supabase';
import { useAuth } from './hooks/useAuth';
import { MissionZone } from './components/MissionZone';

const GAME_CONFIG = {
    limit: { values: [500, 1000, 1500, 2000, 4000, 6000, 8500, 12000] },
    speed: { values: [1, 2, 3, 4, 5, 6, 8, 10] }
};

const MANIFEST_URL = 'https://gem-nova-tma.vercel.app/tonconnect-manifest.json'; 

interface TelegramWebApp {
    initDataUnsafe?: {
        user?: {
            username?: string;
            first_name?: string;
        };
        start_param?: string; 
    };
}

export default function App() {
    const [currentTab, setCurrentTab] = useState('mine');
    
    // Estados Juego
    const [score, setScore] = useState(0);
    const [energy, setEnergy] = useState(0); 
    const [levels, setLevels] = useState({ multitap: 1, limit: 1, speed: 1 });
    const [globalProgress, setGlobalProgress] = useState(0);
    
    // Seguridad
    const [canSave, setCanSave] = useState(false);

    const energyRef = useRef(0);
    const scoreRef = useRef(0);
    
    const [botTime, setBotTime] = useState(0);
    const [adsWatched, setAdsWatched] = useState(0);

    const [overclockTime, setOverclockTime] = useState(0); 

    const { user, loading: authLoading } = useAuth();
    
    const limitIdx = Math.min(Math.max(0, levels.limit - 1), 7);
    const speedIdx = Math.min(Math.max(0, levels.limit - 1), 7);
    const maxEnergy = GAME_CONFIG.limit.values[limitIdx] || 500;
    const regenRate = GAME_CONFIG.speed.values[speedIdx] || 1;

    useEffect(() => { energyRef.current = energy; }, [energy]);
    useEffect(() => { scoreRef.current = score; }, [score]);


    // =========================================================================
    // 🚀 NUEVA CAPTURA GLOBAL DE REFERIDO BLINDADA
    // =========================================================================
    // =========================================================================
    // 🚀 NUEVA CAPTURA GLOBAL DE REFERIDO BLINDADA (CORREGIDA)
    // =========================================================================
    useEffect(() => {
        const captureReferralGlobal = async () => {
            if (!user) return;

            // 🔥 ELIMINAMOS EL CHEQUEO DE SESSIONSTORAGE AQUÍ 🔥

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tg = (window as any).Telegram?.WebApp as TelegramWebApp;
            const startParam = tg?.initDataUnsafe?.start_param;
            const tgUser = tg?.initDataUnsafe?.user;
            const username = tgUser?.username || tgUser?.first_name || 'Miner';

            // Solo intentamos registrar si hay un parámetro de inicio válido diferente al propio usuario
            if (startParam && startParam !== user.id) {
                console.log("🚀 Referrer detected globally:", startParam);

                let cleanReferrerId = startParam;
                if (startParam.includes('ref_')) {
                    cleanReferrerId = startParam.split('ref_')[1];
                } else if (startParam.includes('_')) {
                    cleanReferrerId = startParam.split('_')[1];
                }

                // Usamos la función unificada
                const { error } = await supabase.rpc('register_new_user', {
                    p_user_id: user.id,
                    p_username: username,
                    p_referral_code_text: cleanReferrerId
                });

                if (error) {
                    // Es normal que de error si el usuario ya existe, no te preocupes mucho por este log
                    // console.error("❌ Error guardando el referido global (puede que ya exista):", error);
                } else {
                    console.log("✅ Intento de registro de referido global enviado");
                }
            }
             // 🔥 ELIMINAMOS EL SETITEM DE SESSIONSTORAGE AQUÍ 🔥
        };

        captureReferralGlobal();
    }, [user]);
    // =========================================================================
    // =========================================================================


    // AUTO-SAVE
    const saveProgress = useCallback(async () => {
        if (!user || !canSave) return; 
        const { error } = await supabase.rpc('save_game_progress', {
            user_id_in: user.id,
            new_energy: Math.floor(energyRef.current),
            new_score: scoreRef.current
        });
        if (error) console.error("Save Error:", error);
    }, [user, canSave]);

    // 1. CARGA INICIAL
    useEffect(() => {
        if (user && !authLoading) {
            const fetchInitialData = async () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tg = (window as any).Telegram?.WebApp as TelegramWebApp;
                const tgUser = tg?.initDataUnsafe?.user;
                const startParam = tg?.initDataUnsafe?.start_param; 
                const username = tgUser?.username || tgUser?.first_name || 'Miner';

                const { data: userData } = await supabase
                    .from('user_score')
                    .select('score, energy, limit_level, speed_level, multitap_level, bot_active_until, bot_ads_watched_today, last_bot_ad_date, overclock_active_until') 
                    .eq('user_id', user.id)
                    .single();
                
                // CASO A: USUARIO EXISTE
                if (userData) {
                    setScore(userData.score);
                    setEnergy(userData.energy);
                    
                    setLevels({ 
                        multitap: userData.multitap_level || 1, 
                        limit: userData.limit_level || 1, 
                        speed: userData.speed_level || 1 
                    });

                    if (userData.bot_active_until) {
                        const botExpiry = new Date(userData.bot_active_until).getTime();
                        const now = new Date().getTime();
                        setBotTime(Math.max(0, Math.floor((botExpiry - now) / 1000)));
                    }
                    
                    if (userData.overclock_active_until) {
                        const turboExpiry = new Date(userData.overclock_active_until).getTime();
                        const now = new Date().getTime();
                        const remainingTurbo = Math.max(0, Math.floor((turboExpiry - now) / 1000));
                        setOverclockTime(remainingTurbo);
                    }
                    const today = new Date().toISOString().split('T')[0];
                    setAdsWatched(userData.last_bot_ad_date !== today ? 0 : (userData.bot_ads_watched_today || 0));

                    // Sincronizar offline
                    const mySpeed = GAME_CONFIG.speed.values[Math.max(0, (userData.limit_level || 1) - 1)];
                    const myLimit = GAME_CONFIG.limit.values[Math.max(0, (userData.limit_level || 1) - 1)];
                    const { data: syncData } = await supabase.rpc('sync_energy_on_load', { 
                        user_id_in: user.id,
                        my_regen_rate: mySpeed,
                        my_max_energy: myLimit
                    });

                    if (syncData && syncData.length > 0) {
                        const result = syncData[0];
                        setEnergy(result.synced_energy);
                        energyRef.current = result.synced_energy;
                        scoreRef.current = result.current_score;
                    }

                    setTimeout(() => setCanSave(true), 1500);
                    await supabase.from('user_score').update({ username: username }).eq('user_id', user.id);

                } 
                // ==========================================
                // CASO B: USUARIO NUEVO
                // ==========================================
                else {
                    console.log("🆕 Usuario Nuevo detectado. Start Param:", startParam);
                    
                    let referrerId = null;

                    if (startParam && startParam.length > 5) { 
                        if (startParam.includes('ref_')) {
                            referrerId = startParam.split('ref_')[1]; 
                        } 
                        else if (startParam.includes('_')) {
                             referrerId = startParam.split('_')[1];
                        }
                        else {
                            referrerId = startParam; 
                        }
                    }

                    const { error: insertError } = await supabase.rpc('register_new_user', {
                        p_user_id: user.id,
                        p_username: username,
                        p_referral_code_text: referrerId 
                    });
                    
                    if (!insertError) {
                        setScore(referrerId ? 5000 : 0); 
                        scoreRef.current = referrerId ? 5000 : 0;
                        
                        setEnergy(1000); 
                        energyRef.current = 1000;
                        
                        setCanSave(true);
                    } else {
                        console.error("❌ Error registrando usuario:", insertError);
                    }
                }
            };
            fetchInitialData();
        }
    }, [user, authLoading]);

    // 2. FETCH BARRA GLOBAL
    useEffect(() => {
        const fetchGlobalProgress = async () => {
            const { data, error } = await supabase.rpc('get_global_launch_progress');
            if (!error && data !== null) setGlobalProgress(Number(data));
        };
        fetchGlobalProgress();
        const interval = setInterval(fetchGlobalProgress, 60000);
        return () => clearInterval(interval);
    }, []);

    // 3. GAME LOOP (MOTOR CON TURBO)
    useEffect(() => {
        const timer = setInterval(() => {
            setEnergy(prevPoints => {
                if (prevPoints >= maxEnergy) return prevPoints;
                
                const currentSpeed = overclockTime > 0 ? (regenRate * 2) : regenRate;
                
                return Math.min(maxEnergy, prevPoints + currentSpeed);
            });

            setBotTime(prev => Math.max(0, prev - 1));
            setOverclockTime(prev => Math.max(0, prev - 1)); 

        }, 1000);
        return () => clearInterval(timer);
    }, [maxEnergy, regenRate, overclockTime]); 

    // 4. AUTO-SAVE
    useEffect(() => {
        if (!user || !canSave) return;
        const intervalId = setInterval(saveProgress, 5000);
        const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') saveProgress(); };
        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', saveProgress);
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', saveProgress);
        };
    }, [user, canSave, saveProgress]);

    return (
        <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
            <div className="app-container" style={{ height: '100dvh', overflow: 'hidden', background: '#000', color: 'white', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', paddingTop: '20px' }}>
                    {currentTab === 'mine' && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            

                            <div style={{ padding: '0 15px', marginBottom: '0', flexShrink: 0 }}>
                                <MarketDashboard globalProgress={globalProgress} />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <MyMainTMAComponent 
                                    score={score} setScore={setScore} 
                                    energy={energy} setEnergy={setEnergy} 
                                    levels={levels} setLevels={setLevels}
                                    maxEnergy={maxEnergy} regenRate={regenRate}
                                    botTime={botTime} setBotTime={setBotTime}
                                    adsWatched={adsWatched} setAdsWatched={setAdsWatched}
                                    overclockTime={overclockTime}       
                                    setOverclockTime={setOverclockTime} 
                                />
                            </div>
                        </div>
                    )}
                    
                    {currentTab === 'market' && (
                        <div style={{ animation: 'fadeIn 0.3s' }}>
                            <BulkStore 
                                onPurchaseSuccess={(newScore) => {
                                    console.log("💰 Compra detectada! Actualizando saldo a:", newScore);
                                    setScore(newScore); 
                                    scoreRef.current = newScore; 
                                }} 
                                score={score} 
                                setScore={setScore}
                                userLevel={levels.limit}
                            />
                        </div>
                    )}

                    {currentTab === 'mission' && (
                        <div style={{ animation: 'fadeIn 0.3s' }}>
                            <MissionZone setGlobalScore={setScore} />
                        </div>
                    )}
                    
                    {currentTab === 'squad' && (
                        <div style={{ padding: '20px', animation: 'fadeIn 0.3s' }}>
                            <SquadZone setGlobalScore={setScore} />
                        </div>
                    )}
                    
                    {currentTab === 'wallet' && <div style={{ animation: 'fadeIn 0.3s' }}><WalletRoadmap /></div>}
                </div>
                <div style={{ flexShrink: 0 }}>
                    <BottomNav activeTab={currentTab} setTab={setCurrentTab} />
                </div>
            </div>
        </TonConnectUIProvider>
    );
}