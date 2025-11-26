import React, { useState, useEffect, useRef, useCallback } from 'react';

interface GameProps {
    onClose: () => void;
    onFinish: (won: boolean, score: number) => void;
}

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
        setTimeout(() => setShowing(false), 1500 + (currentRound * 500));
    }, []);

    // CORRECCIÓN 1: Usamos setTimeout para desacoplar la llamada inicial
    useEffect(() => {
        const timer = setTimeout(() => {
            startRound(1);
        }, 0);
        return () => clearTimeout(timer);
    }, [startRound]);

    const handleTap = (index: number) => {
        if (showing) return;

        if (index !== sequence[inputIndex]) {
            onFinish(false, 0);
            return;
        }

        if (inputIndex + 1 === sequence.length) {
            if (round >= 3) {
                onFinish(true, 3000);
            } else {
                setRound(r => {
                    const nextRound = r + 1;
                    setTimeout(() => startRound(nextRound), 1000);
                    return nextRound;
                });
            }
        } else {
            setInputIndex(i => i + 1);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 5000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <h2 style={{color:'#E040FB', marginBottom:'10px'}}>MEMORY HACK: LEVEL {round}</h2>
            <p style={{color:'#aaa', marginBottom:'20px'}}>{showing ? "WATCH PATTERN..." : "REPEAT PATTERN!"}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <button key={i} onClick={() => handleTap(i)} style={{
                        width: '70px', height: '70px', borderRadius: '10px', border:'none',
                        background: showing && sequence.includes(i) ? '#E040FB' : '#222',
                        boxShadow: showing && sequence.includes(i) ? '0 0 20px #E040FB' : 'none',
                        transition: 'background 0.2s', cursor:'pointer'
                    }} />
                ))}
            </div>
            <button onClick={onClose} style={{marginTop:'30px', background:'none', border:'1px solid #555', color:'#fff', padding:'10px 20px', cursor:'pointer'}}>CANCEL</button>
        </div>
    );
};

// ☄️ JUEGO 2: ASTEROIDES
export const AsteroidGame: React.FC<GameProps> = ({ onClose, onFinish }) => {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [asteroidPos, setAsteroidPos] = useState({ top: 20, left: 50 });

    const spawnAsteroid = useCallback(() => {
        setAsteroidPos({
            top: Math.floor(Math.random() * 80),
            left: Math.floor(Math.random() * 80)
        });
    }, []);

    // CORRECCIÓN 2: Desacoplamos el spawn inicial
    useEffect(() => {
        const spawnTimer = setTimeout(() => {
            spawnAsteroid();
        }, 0);

        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timer);
                    onFinish(true, score * 100);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        
        return () => {
            clearTimeout(spawnTimer);
            clearInterval(timer);
        };
    }, [onFinish, score, spawnAsteroid]);

    const hit = () => {
        setScore(s => s + 1);
        spawnAsteroid();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#111', zIndex: 5000, overflow:'hidden' }}>
            <div style={{padding:'20px', display:'flex', justifyContent:'space-between', color:'#fff', fontSize:'14px'}}>
                <span>TIME: {timeLeft}s</span>
                <span>HITS: {score}</span>
            </div>
            
            <div onClick={hit} style={{
                position: 'absolute', top: `${asteroidPos.top}%`, left: `${asteroidPos.left}%`,
                width: '60px', height: '60px', background: '#FF512F', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor:'pointer',
                boxShadow: '0 0 20px #FF512F', transition: 'all 0.2s ease-out', fontSize:'24px'
            }}>
                ☄️
            </div>
            
            <button onClick={onClose} style={{position:'absolute', bottom:'30px', left:'50%', transform:'translateX(-50%)', background:'none', border:'1px solid #555', color:'#fff', padding:'10px 20px'}}>EXIT</button>
        </div>
    );
};

// 🔐 JUEGO 3: HACKER (Este estaba bien, pero lo incluimos para completar el archivo)
export const HackerGame: React.FC<GameProps> = ({ onClose, onFinish }) => {
    const [targetZone, setTargetZone] = useState(50);
    const [cursorPos, setCursorPos] = useState(0);
    const [level, setLevel] = useState(1);
    
    const directionRef = useRef(1);
    const posRef = useRef(0);
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const animate = () => {
            const speed = 1 + (level * 0.5);
            
            posRef.current += directionRef.current * speed;

            if (posRef.current >= 100) {
                posRef.current = 100;
                directionRef.current = -1;
            } else if (posRef.current <= 0) {
                posRef.current = 0;
                directionRef.current = 1;
            }

            setCursorPos(posRef.current);
            requestRef.current = requestAnimationFrame(animate);
        };
        
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [level]);

    const handleLock = () => {
        const hit = Math.abs(posRef.current - targetZone) < 10;
        
        if (hit) {
            if (level >= 3) {
                onFinish(true, 5000);
            } else {
                setLevel(l => l + 1);
                setTargetZone(Math.random() * 80 + 10);
                posRef.current = 0; 
            }
        } else {
            onFinish(false, 0);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 5000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }} onClick={handleLock}>
            <h2 style={{color:'#00F2FE', marginBottom:'5px'}}>SECURITY LEVEL {level}</h2>
            <p style={{color:'#aaa', marginBottom:'40px'}}>TAP when aligned!</p>

            <div style={{ width: '80%', height: '40px', border: '2px solid #333', borderRadius: '20px', position: 'relative', overflow:'hidden', background:'#111' }}>
                <div style={{ 
                    position: 'absolute', left: `${targetZone}%`, width: '15%', height: '100%', 
                    background: 'rgba(0, 242, 254, 0.3)', transform: 'translateX(-50%)', borderLeft:'1px solid #00F2FE', borderRight:'1px solid #00F2FE'
                }} />
                <div style={{ 
                    position: 'absolute', left: `${cursorPos}%`, width: '4px', height: '100%', 
                    background: '#fff', boxShadow: '0 0 10px #fff', transform: 'translateX(-50%)'
                }} />
            </div>

            <p style={{marginTop:'50px', fontSize:'12px', color:'#555'}}>Tap anywhere to lock</p>
            <button onClick={onClose} style={{marginTop:'20px', background:'none', border:'none', color:'#555'}}>Exit</button>
        </div>
    );
};