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

// 🧠 JUEGO 1: MEMORIA
export const MemoryGame: React.FC<GameProps> = ({ onClose, onFinish }) => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [showing, setShowing] = useState(true);
    const [round, setRound] = useState(1);
    const [inputIndex, setInputIndex] = useState(0);

    const startRound = useCallback((currentRound: number) => {
        const newSeq = Array.from({ length: currentRound + 2 }, () => Math.floor(Math.random() * 9));
        setSequence(newSeq);
        setInputIndex(0);
        setShowing(true);
        setTimeout(() => setShowing(false), 1000 + (currentRound * 500));
    }, []);

    useEffect(() => {
        const t = setTimeout(() => startRound(1), 100);
        return () => clearTimeout(t);
    }, [startRound]);

    const handleTap = (index: number) => {
        if (showing) return;
        if (index !== sequence[inputIndex]) { onFinish(false, 0); return; }
        
        if (inputIndex + 1 === sequence.length) {
            if (round >= 3) onFinish(true, 3000);
            else {
                setRound(r => {
                    setTimeout(() => startRound(r + 1), 500);
                    return r + 1;
                });
            }
        } else setInputIndex(i => i + 1);
    };

    return (
        <GameOverlay>
            <h2 style={{color:'#E040FB', marginBottom:'10px'}}>MEMORY HACK: LVL {round}</h2>
            <p style={{color:'#aaa', marginBottom:'20px'}}>{showing ? "MEMORIZE..." : "REPEAT!"}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <button key={i} onClick={() => handleTap(i)} style={{
                        width: '70px', height: '70px', borderRadius: '10px', border:'2px solid #333',
                        background: showing && sequence.includes(i) ? '#E040FB' : 'transparent',
                        boxShadow: showing && sequence.includes(i) ? '0 0 20px #E040FB' : 'none',
                        transition: 'all 0.2s', cursor:'pointer'
                    }} />
                ))}
            </div>
            <button onClick={onClose} style={{marginTop:'30px', background:'none', border:'none', color:'#555'}}>GIVE UP</button>
        </GameOverlay>
    );
};

// ☄️ JUEGO 2: ASTEROIDES (ARREGLADO DEFINITIVO)
export const AsteroidGame: React.FC<GameProps> = ({ onClose, onFinish }) => {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [asteroidPos, setAsteroidPos] = useState({ top: 40, left: 40 });

    // 🛡️ ESCUDO DE REFERENCIAS (Evita reinicios por renderizados del padre)
    const onFinishRef = useRef(onFinish);
    const scoreRef = useRef(score);

    // Mantener las referencias actualizadas sin disparar efectos
    useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);
    useEffect(() => { scoreRef.current = score; }, [score]);

    const spawnAsteroid = useCallback(() => {
        // Usamos porcentajes seguros para que no se salga del cuadro (10% a 80%)
        setAsteroidPos({ 
            top: Math.floor(Math.random() * 70) + 10, 
            left: Math.floor(Math.random() * 70) + 10 
        });
    }, []);

    // ⏰ TEMPORIZADOR BLINDADO
    useEffect(() => {
        // Este efecto SOLO se ejecuta una vez al montar el juego
        // No depende de 'score' ni de 'onFinish' directamente

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Llamamos a la referencia actualizada
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
    }, [spawnAsteroid]); // Dependencia mínima

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

            {/* Área de Juego (Centrada Vertical y Horizontalmente) */}
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
                    cursor:'pointer', transition: 'top 0.1s, left 0.1s', // Movimiento suave
                    border: '2px solid #FF512F',
                    boxShadow: '0 0 15px #FF512F',
                    transform: 'translate(-50%, -50%)' // Centrar el punto de anclaje
                }}>
                    <Crosshair size={30} color="#fff"/>
                </div>
            </div>
            
            <button onClick={onClose} style={{marginTop:'40px', background:'none', border:'1px solid #555', color:'#aaa', padding:'10px 30px', borderRadius:'10px', cursor:'pointer'}}>EXIT GAME</button>
        </GameOverlay>
    );
};

// 🔐 JUEGO 3: HACKER
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