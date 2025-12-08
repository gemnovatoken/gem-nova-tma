import { useState, useEffect, useRef, useCallback } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
// import { Header } from './components/Header'; 
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

export default function App() {
    const [currentTab, setCurrentTab] = useState('mine');
    
    // Inicializamos en 0, pero la carga offline lo corregirá rápido
    const [score, setScore] = useState(0);
    const [energy, setEnergy] = useState(0);
    const [levels, setLevels] = useState({ multitap: 1, limit: 1, speed: 1 });
    
    // Referencias para tener siempre el valor real sin reiniciar efectos
    const energyRef = useRef(0);
    const scoreRef = useRef(0);
    
    const [botTime, setBotTime] = useState(0);
    const [adsWatched, setAdsWatched] = useState(0);

    const { user, loading: authLoading } = useAuth();
    
    const limitIdx = Math.min(Math.max(0, levels.limit - 1), 7);
    const speedIdx = Math.min(Math.max(0, levels.speed - 1), 7);
    const maxEnergy = GAME_CONFIG.limit.values[limitIdx] || 500;
    const regenRate = GAME_CONFIG.speed.values[speedIdx] || 1;

    // Actualizamos referencias constantemente
    useEffect(() => { energyRef.current = energy; }, [energy]);
    useEffect(() => { scoreRef.current = score; }, [score]);

    // 🔥 FUNCIÓN CENTRALIZADA DE GUARDADO (La clave de la solución)
    const saveProgress = useCallback(async () => {
        if (!user) return;
        
        const currentE = energyRef.current;
        const currentS = scoreRef.current;

        // Guardamos Energía Y Score
        await supabase.from('user_score').update({
            energy: Math.floor(currentE),
            score: currentS, // También guardamos el score por si acaso
            last_energy_update: new Date().toISOString()
        }).eq('user_id', user.id);
        
        // console.log("💾 Progress Saved:", Math.floor(currentE));
    }, [user]);

    // 1. CARGA INICIAL + CÁLCULO OFFLINE
    useEffect(() => {
        if (user && !authLoading) {
            const fetchInitialData = async () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tg = (window as any).Telegram?.WebApp;
                const tgUser = tg?.initDataUnsafe?.user;
                const username = tgUser?.username || tgUser?.first_name || 'Miner';

                const { data } = await supabase
                    .from('user_score')
                    .select('*, bot_active_until, bot_ads_watched_today, last_bot_ad_date') 
                    .eq('user_id', user.id)
                    .single();
                
                if (data) {
                    setScore(data.score);
                    scoreRef.current = data.score;
                    
                    // --- CÁLCULO DE REGENERACIÓN OFFLINE ---
                    // 1. ¿Cuándo fue la última vez que guardamos?
                    const lastUpdate = data.last_energy_update ? new Date(data.last_energy_update).getTime() : new Date().getTime();
                    const now = new Date().getTime();
                    
                    // 2. ¿Cuántos segundos han pasado?
                    const secondsPassed = Math.max(0, Math.floor((now - lastUpdate) / 1000));
                    
                    // 3. ¿Qué velocidad y tanque tiene el usuario?
                    const mySpeed = GAME_CONFIG.speed.values[Math.max(0, (data.speed_level || 1) - 1)];
                    const myLimit = GAME_CONFIG.limit.values[Math.max(0, (data.limit_level || 1) - 1)];
                    
                    // 4. Calculamos cuánto generó mientras dormía
                    const generatedOffline = secondsPassed * mySpeed;
                    const storedEnergy = Number(data.energy) || 0; // Aseguramos que sea número
                    
                    // 5. Energía Final = Lo que tenía + Lo generado (Sin pasarse del límite)
                    const totalEnergy = Math.min(myLimit, storedEnergy + generatedOffline);
                    
                    console.log(`🔌 Offline: Pasaron ${secondsPassed}s. Generado: ${generatedOffline}. Total: ${totalEnergy}`);
                    
                    setEnergy(totalEnergy);
                    energyRef.current = totalEnergy;

                    // Actualizamos niveles y bot
                    setLevels({ 
                        multitap: data.multitap_level || 1, 
                        limit: data.limit_level || 1, 
                        speed: data.speed_level || 1 
                    });

                    if (data.bot_active_until) {
                        const botExpiry = new Date(data.bot_active_until).getTime();
                        const timeLeft = Math.max(0, Math.floor((botExpiry - now) / 1000));
                        setBotTime(timeLeft);
                    }

                    const today = new Date().toISOString().split('T')[0];
                    if (data.last_bot_ad_date !== today) {
                        setAdsWatched(0); 
                    } else {
                        setAdsWatched(data.bot_ads_watched_today || 0);
                    }

                    if (data.username !== username) {
                        await supabase.from('user_score').update({ username: username }).eq('user_id', user.id);
                    }

                } else {
                    // Nuevo Usuario
                    await supabase.from('user_score').insert([{
                        user_id: user.id, score: 0, energy: 500, username: username,
                        last_energy_update: new Date().toISOString()
                    }]);
                    setEnergy(500);
                }
            };
            fetchInitialData();
        }
    }, [user, authLoading]);

    // 2. LOOP VISUAL (Solo actualiza la pantalla)
    useEffect(() => {
        const timer = setInterval(() => {
            setEnergy(p => {
                if (p >= maxEnergy) return p;
                return Math.min(maxEnergy, p + regenRate);
            });
            setBotTime(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [maxEnergy, regenRate]);

    // 3. 🔥 GUARDADO AUTOMÁTICO INTELIGENTE
    useEffect(() => {
        if (!user) return;

        // A. Guardar cada 10 segundos (Respaldo)
        const intervalId = setInterval(saveProgress, 10000);

        // B. Guardar INMEDIATAMENTE si el usuario cambia de app o cierra la pestaña
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                saveProgress(); // ¡Guardar YA!
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', saveProgress); // Para navegadores de escritorio

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', saveProgress);
        };
    }, [user, saveProgress]);

    return (
        <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
            <div className="app-container" style={{ height: '100dvh', overflow: 'hidden', background: '#000', color: 'white', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    position: 'relative',
                    display: 'flex', flexDirection: 'column',
                    paddingTop: '20px' 
                }}>
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