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
    initDataUnsafe?: { user?: { username?: string; first_name?: string; }; };
}

export default function App() {
    const [currentTab, setCurrentTab] = useState('mine');
    
    // Estados del juego
    const [score, setScore] = useState(0);
    const [energy, setEnergy] = useState(0); 
    const [levels, setLevels] = useState({ multitap: 1, limit: 1, speed: 1 });
    const [botTime, setBotTime] = useState(0);
    const [adsWatched, setAdsWatched] = useState(0);

    // 🔥 ESTADO DE CARGA REAL (Bloquea la UI hasta estar listo)
    const [isAppReady, setIsAppReady] = useState(false);

    // Referencias para Auto-Save
    const energyRef = useRef(0);
    const scoreRef = useRef(0);
    
    const { user, loading: authLoading } = useAuth();
    
    const limitIdx = Math.min(Math.max(0, levels.limit - 1), 7);
    const speedIdx = Math.min(Math.max(0, levels.speed - 1), 7);
    const maxEnergy = GAME_CONFIG.limit.values[limitIdx] || 500;
    const regenRate = GAME_CONFIG.speed.values[speedIdx] || 1;

    useEffect(() => { energyRef.current = energy; }, [energy]);
    useEffect(() => { scoreRef.current = score; }, [score]);

    // AUTO-SAVE (Solo funciona si la app ya cargó)
    const saveProgress = useCallback(async () => {
        if (!user || !isAppReady) return; 

        await supabase.rpc('save_game_progress', {
            user_id_in: user.id,
            new_energy: Math.floor(energyRef.current),
            new_score: scoreRef.current
        });
    }, [user, isAppReady]);

    // 1. CARGA INICIAL (SINCRONIZACIÓN)
    useEffect(() => {
        if (user && !authLoading) {
            const fetchInitialData = async () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tg = (window as any).Telegram?.WebApp as TelegramWebApp;
                const username = tg?.initDataUnsafe?.user?.username || tg?.initDataUnsafe?.user?.first_name || 'Miner';

                const { data: userData } = await supabase
                    .from('user_score')
                    .select('limit_level, speed_level, multitap_level, bot_active_until, bot_ads_watched_today, last_bot_ad_date') 
                    .eq('user_id', user.id)
                    .single();
                
                if (userData) {
                    const mySpeed = GAME_CONFIG.speed.values[Math.max(0, (userData.speed_level || 1) - 1)];
                    const myLimit = GAME_CONFIG.limit.values[Math.max(0, (userData.limit_level || 1) - 1)];

                    // SINCRONIZACIÓN DE VERDAD (SQL UPDATE RETURNING)
                    const { data: syncData, error } = await supabase.rpc('sync_energy_on_load', { 
                        user_id_in: user.id,
                        my_regen_rate: mySpeed,
                        my_max_energy: myLimit
                    });

                    if (!error && syncData && syncData.length > 0) {
                        const result = syncData[0];
                        
                        // Aplicamos los datos REALES de la BD
                        setScore(result.current_score);
                        setEnergy(result.synced_energy);
                        energyRef.current = result.synced_energy;
                        scoreRef.current = result.current_score;

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

                        const today = new Date().toISOString().split('T')[0];
                        setAdsWatched(userData.last_bot_ad_date !== today ? 0 : (userData.bot_ads_watched_today || 0));

                        // ✅ DATOS LISTOS: QUITAMOS PANTALLA DE CARGA
                        setIsAppReady(true);
                    }
                    
                    // Actualizar nombre en background
                    supabase.from('user_score').update({ username: username }).eq('user_id', user.id).then();

                } else {
                    // USUARIO NUEVO
                    await supabase.from('user_score').insert([{
                        user_id: user.id, score: 0, energy: 0, username: username,
                        last_energy_update: new Date().toISOString()
                    }]);
                    setEnergy(0);
                    energyRef.current = 0;
                    setIsAppReady(true);
                }
            };
            fetchInitialData();
        }
    }, [user, authLoading]);

    // 2. GAME LOOP VISUAL
    useEffect(() => {
        if (!isAppReady) return; // No hacer nada hasta estar listos

        const timer = setInterval(() => {
            setEnergy(p => {
                if (p >= maxEnergy) return p;
                return Math.min(maxEnergy, p + regenRate);
            });
            setBotTime(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [maxEnergy, regenRate, isAppReady]);

    // 3. AUTO-SAVE INTERVAL
    useEffect(() => {
        if (!user || !isAppReady) return;

        const intervalId = setInterval(saveProgress, 5000);
        
        const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') saveProgress(); };
        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', saveProgress);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', saveProgress);
        };
    }, [user, isAppReady, saveProgress]);

    // 🔥 PANTALLA DE CARGA (Loading Spinner)
    // Esto evita que veas "0" y luego saltos raros.
    if (authLoading || !user || !isAppReady) {
        return (
            <div style={{
                height: '100dvh', background: '#000', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', color: '#00F2FE'
            }}>
                <div style={{
                    width: '40px', height: '40px', border: '4px solid #333', 
                    borderTop: '4px solid #00F2FE', borderRadius: '50%', 
                    animation: 'spin 1s linear infinite'
                }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // APP REAL
    return (
        <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
            <div className="app-container" style={{ height: '100dvh', overflow: 'hidden', background: '#000', color: 'white', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', paddingTop: '20px' }}>
                    {currentTab === 'mine' && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '0 15px', marginBottom: '0', flexShrink: 0 }}>
                                <MarketDashboard />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <MyMainTMAComponent 
                                    score={score} setScore={setScore} 
                                    energy={energy} setEnergy={setEnergy} 
                                    levels={levels} setLevels={setLevels}
                                    maxEnergy={maxEnergy} regenRate={regenRate}
                                    botTime={botTime} setBotTime={setBotTime}
                                    adsWatched={adsWatched} setAdsWatched={setAdsWatched}
                                />
                            </div>
                        </div>
                    )}
                    {currentTab === 'market' && <div style={{ animation: 'fadeIn 0.3s' }}><BulkStore /></div>}
                    {currentTab === 'mission' && <div style={{ animation: 'fadeIn 0.3s' }}><MissionZone /></div>}
                    {currentTab === 'squad' && <div style={{ padding: '20px', animation: 'fadeIn 0.3s' }}><SquadZone /></div>}
                    {currentTab === 'wallet' && <div style={{ animation: 'fadeIn 0.3s' }}><WalletRoadmap /></div>}
                </div>
                <div style={{ flexShrink: 0 }}>
                    <BottomNav activeTab={currentTab} setTab={setCurrentTab} />
                </div>
            </div>
        </TonConnectUIProvider>
    );
}