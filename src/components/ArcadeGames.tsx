import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Crosshair } from 'lucide-react';

interface GameProps {
    onClose: () => void;
    onFinish: (won: boolean, score: number) => void;
}

// Estilo compartido (Overlay Centrado y Fijo)
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

// 🧠 JUEGO 1: MEMORIA (LÓGICA DE PATRÓN RESTAURADA)
export const MemoryGame: React.FC<GameProps> = ({ onClose, onFinish }) => {
    const [pattern, setPattern] = useState<number[]>([]); // Cuadros correctos
    const [selected, setSelected] = useState<number[]>([]); // Cuadros que ya encontraste
    const [showing, setShowing] = useState(true);
    const [round, setRound] = useState(1);

    const startRound = useCallback((currentRound: number) => {
        // 1. Generar patrón ÚNICO (sin repetidos)
        const newPattern = new Set<number>();
        // Nivel 1: 3 cuadros, Nivel 2: 4 cuadros, etc.
        while(newPattern.size < (currentRound + 2)) {
            newPattern.add(Math.floor(Math.random() * 9));
        }
        
        setPattern(Array.from(newPattern));
        setSelected([]);
        setShowing(true);
        
        // Tiempo para memorizar
        setTimeout(() => setShowing(false), 1500 + (currentRound * 200));
    }, []);

    useEffect(() => {
        const t = setTimeout(() => startRound(1), 100);
        return () => clearTimeout(t);
    }, [startRound]);

    const handleTap = (index: number) => {
        if (showing) return; // No tocar mientras memorizas
        if (selected.includes(index)) return; // Ya lo tocaste

        // 2. Lógica: ¿Es parte del patrón?
        if (pattern.includes(index)) {
            // ✅ CORRECTO
            const newSelected = [...selected, index];
            setSelected(newSelected);

            // ¿Encontró todos?
            if (newSelected.length === pattern.length) {
                if (round >= 3) {
                    // Ganó el juego completo
                    setTimeout(() => onFinish(true, 3000), 500);
                } else {
                    // Siguiente ronda
                    setTimeout(() => {
                        setRound(r => r + 1);
                        startRound(round + 1);
                    }, 500);
                }
            }
        } else {
            // ❌ INCORRECTO (Tocó uno que no era)
            onFinish(false, 0);
        }
    };

    return (
        <GameOverlay>
            <h2 style={{color:'#E040FB', marginBottom:'10px'}}>QUANTUM CODE: LVL {round}</h2>
            <p style={{color:'#aaa', marginBottom:'20px'}}>{showing ? "MEMORIZE THE PATTERN..." : "FIND THE NODES!"}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
                    // Estado visual del botón
                    let bgColor = '#222'; // Apagado
                    if (showing && pattern.includes(i)) bgColor = '#E040FB'; // Mostrando patrón
                    if (!showing && selected.includes(i)) bgColor = '#4CAF50'; // Encontrado (Verde)

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

// ☄️ JUEGO 2: ASTEROIDES (CON RELOJ ARREGLADO)
export const AsteroidGame: React.FC<GameProps> = ({ onClose, onFinish }) => {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [asteroidPos, setAsteroidPos] = useState({ top: 40, left: 40 });
    
    // 🛡️ ESCUDO DE REFERENCIAS (Para que el reloj no se congele)
    const scoreRef = useRef(0);
    const onFinishRef = useRef(onFinish);

    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

    const spawnAsteroid = useCallback(() => {
        setAsteroidPos({ 
            top: Math.floor(Math.random() * 70) + 10, 
            left: Math.floor(Math.random() * 70) + 10 
        });
    }, []);

    // ⏰ TEMPORIZADOR BLINDADO
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onFinishRef.current(true, scoreRef.current * 100);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const spawnTimer = setTimeout(() => spawnAsteroid(), 0);

        return () => {
            clearInterval(timer);
            clearTimeout(spawnTimer);
        };
    }, [spawnAsteroid]); 

    const hit = () => {
        setScore(s => s + 1);
        spawnAsteroid();
    };

    return (
        <GameOverlay>
            {/* HUD Centrado */}
            <div style={{ 
                width: '300px', display:'flex', justifyContent:'space-between', 
                marginBottom:'10px', color:'#fff', fontWeight:'bold', fontSize:'18px'
            }}>
                <span>⏳ {timeLeft}s</span>
                <span style={{color:'#FF512F'}}>💥 {score}</span>
            </div>
            
            <div style={{textAlign:'center', color:'#888', marginBottom:'15px', fontSize:'12px'}}>
                TAP THE TARGETS!
            </div>

            {/* Área de Juego */}
            <div style={{ 
                width: '300px', height: '300px', border: '2px dashed #333', borderRadius:'20px', 
                position: 'relative', overflow:'hidden', background:'rgba(255,255,255,0.02)',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}>
                <div onClick={hit} style={{
                    position: 'absolute', 
                    top: `${asteroidPos.top}%`, 
                    left: `${asteroidPos.left}%`,
                    width: '60px', height: '60px', 
                    background: 'radial-gradient(circle, #FF512F 20%, transparent 70%)',
                    borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor:'pointer', transition: 'top 0.1s, left 0.1s',
                    border: '2px solid #FF512F',
                    boxShadow: '0 0 15px #FF512F',
                    transform: 'translate(-50%, -50%)'
                }}>
                    <Crosshair size={30} color="#fff"/>
                </div>
            </div>
            
            <button onClick={onClose} style={{marginTop:'40px', background:'none', border:'1px solid #555', color:'#aaa', padding:'10px 30px', borderRadius:'10px', cursor:'pointer'}}>EXIT GAME</button>
        </GameOverlay>
    );
};

// 🔐 JUEGO 3: HACKER (INTACTO)
export const HackerGame: React.FC<GameProps> = ({ onClose, onFinish }) => {
    const [targetZone, setTargetZone] = useState(50);
    const [cursorPos, setCursorPos] = useState(0);
    const [level, setLevel] = useState(1);
    
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

    const handleLock = () => {
        if (Math.abs(posRef.current - targetZone) < 10) {
            if (level >= 3) onFinish(true, 5000);
            else { setLevel(l => l + 1); setTargetZone(Math.random() * 80 + 10); posRef.current = 0; }
        } else onFinish(false, 0);
    };

    return (
        <GameOverlay>
            <h2 style={{color:'#00F2FE', marginBottom:'5px'}}>SECURITY LEVEL {level}</h2>
            <p style={{color:'#aaa', marginBottom:'40px'}}>TAP when aligned!</p>
            <div style={{ width: '300px', height: '50px', border: '2px solid #333', borderRadius: '25px', position: 'relative', overflow:'hidden', background:'#111' }} onClick={handleLock}>
                <div style={{ position: 'absolute', left: `${targetZone}%`, width: '15%', height: '100%', background: 'rgba(0, 242, 254, 0.3)', transform: 'translateX(-50%)', borderLeft:'1px solid #00F2FE', borderRight:'1px solid #00F2FE' }} />
                <div style={{ position: 'absolute', left: `${cursorPos}%`, width: '4px', height: '100%', background: '#fff', boxShadow: '0 0 10px #fff', transform: 'translateX(-50%)' }} />
            </div>
            <button onClick={onClose} style={{marginTop:'50px', background:'none', border:'none', color:'#555'}}>Exit</button>
        </GameOverlay>
    );
};