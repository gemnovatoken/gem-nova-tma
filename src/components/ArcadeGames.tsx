import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Crosshair } from 'lucide-react';
import { supabase } from '../services/supabase'; // Asegúrate que la ruta sea correcta
import { useAuth } from '../hooks/useAuth';

// ✅ INTERFAZ DEFINIDA PARA RESPUESTA DE VIDEO (Soluciona el error de "any")
interface AdResponse {
    success: boolean;
    progress: number;
    rewarded: boolean;
}

interface GameProps {
    onClose: () => void;
    onFinish: (won: boolean, score: number) => void;
}

// Helper para registrar videos (Línea Mágica Global)
const registerAdView = async (userId: string) => {
    try {
        console.log("🎬 Registering Arcade Ad View...");
        const { data, error } = await supabase.rpc('register_ad_view', { p_user_id: userId });
        
        // ✅ CORRECCIÓN DE TIPO: Convertimos la respuesta a 'AdResponse'
        // Esto elimina el error 'Unexpected any'
        const result = data as AdResponse;

        if (!error && result?.rewarded) {
            // Opcional: Feedback visual si ganó ticket
            // alert("🎟️ +1 LUCKY TICKET EARNED!"); 
        }
    } catch (e) {
        console.error("Ad Error:", e);
    }
};

// Estilo compartido
const GameOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ 
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', zIndex: 5000, 
        background: 'rgba(0,0,0,0.95)', 
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding: '20px', boxSizing: 'border-box'
    }}>
        {children}
    </div>
);

// 🧠 JUEGO 1: MEMORIA (Con Retry por Video)
export const MemoryGame: React.FC<GameProps> = ({ onClose, onFinish }) => {
    const { user } = useAuth();
    const [pattern, setPattern] = useState<number[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [showing, setShowing] = useState(true);
    const [round, setRound] = useState(1);
    const [hasRevived, setHasRevived] = useState(false); // Solo 1 revivir por juego

    const startRound = useCallback((currentRound: number) => {
        const newPattern = new Set<number>();
        while(newPattern.size < (currentRound + 2)) {
            newPattern.add(Math.floor(Math.random() * 9));
        }
        setPattern(Array.from(newPattern));
        setSelected([]);
        setShowing(true);
        setTimeout(() => setShowing(false), 1500 + (currentRound * 200));
    }, []);

    useEffect(() => {
        const t = setTimeout(() => startRound(1), 100);
        return () => clearTimeout(t);
    }, [startRound]);

    const handleTap = async (index: number) => {
        if (showing) return;
        if (selected.includes(index)) return;

        if (pattern.includes(index)) {
            const newSelected = [...selected, index];
            setSelected(newSelected);

            if (newSelected.length === pattern.length) {
                if (round >= 3) {
                    setTimeout(() => onFinish(true, 1500), 500);
                } else {
                    setTimeout(() => {
                        setRound(r => r + 1);
                        startRound(round + 1);
                    }, 500);
                }
            }
        } else {
            // 🔥 LÓGICA DE REVIVIR (VIDEO)
            if (!hasRevived && user) {
                const wantRevive = window.confirm("🧠 MEMORY FAILED!\n\nWatch Ad to Retry this round?");
                if (wantRevive) {
                    await registerAdView(user.id); // Cuenta para el Ticket
                    setHasRevived(true);
                    setSelected([]); // Reiniciar selección
                    alert("🔁 Retrying Round...");
                    return; // No terminar el juego
                }
            }
            onFinish(false, 0);
        }
    };

    return (
        <GameOverlay>
            <h2 style={{color:'#E040FB', marginBottom:'10px'}}>QUANTUM CODE: LVL {round}</h2>
            <p style={{color:'#aaa', marginBottom:'20px'}}>{showing ? "MEMORIZE..." : "FIND NODES!"}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
                    let bgColor = '#222';
                    if (showing && pattern.includes(i)) bgColor = '#E040FB';
                    if (!showing && selected.includes(i)) bgColor = '#4CAF50';
                    return (
                        <button key={i} onClick={() => handleTap(i)} style={{
                            width: '80px', height: '80px', borderRadius: '12px', border:'2px solid #333',
                            background: bgColor,
                            boxShadow: (showing && pattern.includes(i)) || selected.includes(i) ? `0 0 15px ${bgColor}` : 'none',
                            transition: 'all 0.2s', cursor:'pointer', transform: 'scale(1)'
                        }} 
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                    );
                })}
            </div>
            <button onClick={onClose} style={{marginTop:'40px', background:'none', border:'1px solid #555', color:'#fff', padding:'10px 30px', borderRadius:'20px'}}>GIVE UP</button>
        </GameOverlay>
    );
};

// ☄️ JUEGO 2: ASTEROIDES (Con Tiempo Extra por Video)
export const AsteroidGame: React.FC<GameProps> = ({ onClose, onFinish }) => {
    const { user } = useAuth();
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [asteroidPos, setAsteroidPos] = useState({ top: 40, left: 40 });
    const [hasRevived, setHasRevived] = useState(false); // Solo 1 vez
    const scoreRef = useRef(0);
    
    // Refs para evitar problemas con closures en setInterval
    const timeLeftRef = useRef(15);
    const hasRevivedRef = useRef(false);

    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { hasRevivedRef.current = hasRevived; }, [hasRevived]);

    const spawnAsteroid = useCallback(() => {
        setAsteroidPos({ 
            top: Math.floor(Math.random() * 70) + 10, 
            left: Math.floor(Math.random() * 70) + 10 
        });
    }, []);

    // Función para manejar el fin del tiempo
    const handleTimeUp = async () => {
        if (!hasRevivedRef.current && user) {
            // Pausamos visualmente (aunque el intervalo sigue, lo manejamos con lógica)
            const wantMoreTime = window.confirm("⏳ TIME UP!\n\nWatch Ad for +10 seconds?");
            if (wantMoreTime) {
                await registerAdView(user.id); // Cuenta para el Ticket
                setHasRevived(true);
                hasRevivedRef.current = true;
                setTimeLeft(10); // Dar 10 segundos extra
                return; // Continuar juego
            }
        }
        // Fin del juego real
        onFinish(true, scoreRef.current * 100);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                const newVal = prev - 1;
                timeLeftRef.current = newVal;
                
                if (newVal <= 0) {
                    // Importante: Limpiamos intervalo temporalmente para preguntar
                    clearInterval(timer);
                    handleTimeUp(); 
                    return 0;
                }
                return newVal;
            });
        }, 1000);
        
        const spawnTimer = setTimeout(() => spawnAsteroid(), 0);
        
        // Si revivimos, necesitamos reiniciar el timer effect, por eso dependemos de hasRevived
        return () => { clearInterval(timer); clearTimeout(spawnTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spawnAsteroid, hasRevived]); // Reinicia el timer si revive

    const hit = () => {
        if (timeLeft <= 0) return;
        setScore(s => s + 1);
        spawnAsteroid();
    };

    return (
        <GameOverlay>
            <div style={{ width: '300px', display:'flex', justifyContent:'space-between', marginBottom:'10px', color:'#fff', fontWeight:'bold', fontSize:'18px' }}>
                <span style={{ color: timeLeft <= 5 ? '#FF0000' : '#fff' }}>⏳ {timeLeft}s</span>
                <span style={{color:'#FF512F'}}>💥 {score}</span>
            </div>
            <div style={{textAlign:'center', color:'#888', marginBottom:'15px', fontSize:'12px'}}>TAP TARGETS (100 pts/hit)</div>
            <div style={{ 
                width: '300px', height: '300px', border: '2px dashed #333', borderRadius:'20px', 
                position: 'relative', overflow:'hidden', background:'rgba(255,255,255,0.02)', boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}>
                <div onClick={hit} style={{
                    position: 'absolute', top: `${asteroidPos.top}%`, left: `${asteroidPos.left}%`,
                    width: '60px', height: '60px', background: 'radial-gradient(circle, #FF512F 20%, transparent 70%)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor:'pointer', transition: 'top 0.1s, left 0.1s', border: '2px solid #FF512F',
                    boxShadow: '0 0 15px #FF512F', transform: 'translate(-50%, -50%)'
                }}>
                    <Crosshair size={30} color="#fff"/>
                </div>
            </div>
            <button onClick={onClose} style={{marginTop:'40px', background:'none', border:'1px solid #555', color:'#aaa', padding:'10px 30px', borderRadius:'10px', cursor:'pointer'}}>EXIT</button>
        </GameOverlay>
    );
};

// 🔐 JUEGO 3: HACKER (Con Segundo Intento por Video)
export const HackerGame: React.FC<GameProps> = ({ onClose, onFinish }) => {
    const { user } = useAuth();
    const [targetZone, setTargetZone] = useState(50);
    const [cursorPos, setCursorPos] = useState(0);
    const [level, setLevel] = useState(1);
    const [hasRevived, setHasRevived] = useState(false);
    
    const directionRef = useRef(1);
    const posRef = useRef(0);
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const animate = () => {
            const speed = 1.5 + (level * 0.5);
            posRef.current += directionRef.current * speed;
            if (posRef.current >= 100) { posRef.current = 100; directionRef.current = -1; }
            else if (posRef.current <= 0) { posRef.current = 0; directionRef.current = 1; }
            setCursorPos(posRef.current);
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [level]);

    const handleLock = async () => {
        if (Math.abs(posRef.current - targetZone) < 10) {
            // ACIERTO
            if (level >= 3) {
                onFinish(true, 1500);
            } else { 
                setLevel(l => l + 1); 
                setTargetZone(Math.random() * 80 + 10); 
                posRef.current = 0; 
            }
        } else {
            // FALLO
            if (!hasRevived && user) {
                // Pausamos animación (truco visual)
                cancelAnimationFrame(requestRef.current);
                
                const wantRetry = window.confirm("🔐 BREACH DETECTED!\n\nWatch Ad to bypass security and retry level?");
                if (wantRetry) {
                    await registerAdView(user.id); // Cuenta para el Ticket
                    setHasRevived(true);
                    posRef.current = 0; // Reset posición
                    alert("🛡️ SYSTEM BYPASSED. Retrying...");
                    // Reactivamos animación al cambiar estado
                    return;
                }
            }
            onFinish(false, 0);
        }
    };

    return (
        <GameOverlay>
            <h2 style={{color:'#00F2FE', marginBottom:'5px'}}>SECURITY LEVEL {level}</h2>
            <p style={{color:'#aaa', marginBottom:'40px'}}>TAP when aligned!</p>
            <div style={{ width: '300px', height: '50px', border: '2px solid #333', borderRadius: '25px', position: 'relative', overflow:'hidden', background:'#111' }} onClick={handleLock}>
                <div style={{ position: 'absolute', left: `${targetZone}%`, width: '15%', height: '100%', background: 'rgba(0, 242, 254, 0.3)', transform: 'translateX(-50%)', borderLeft:'1px solid #00F2FE', borderRight:'1px solid #00F2FE' }} />
                <div style={{ position: 'absolute', left: `${cursorPos}%`, width: '4px', height: '100%', background: '#fff', boxShadow: '0 0 10px #fff', transform: 'translateX(-50%)' }} />
            </div>
            <button onClick={onClose} style={{marginTop:'50px', background:'none', border:'1px solid #555', color:'#555'}}>Exit</button>
        </GameOverlay>
    );
};