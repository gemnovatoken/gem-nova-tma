import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Flame, Trophy, Timer, Zap, Video, Bomb, ShieldAlert, Crosshair } from 'lucide-react';

// --- DEFINICIONES GLOBALES PARA TYPESCRIPT ---
declare global {
    interface Window {
        Adsgram?: {
            init: (config: { blockId: string; debug?: boolean }) => AdController;
        };
    }
}

interface AdController {
    show: () => Promise<void>;
}

// --- CONFIGURACIÓN ---
const ADMIN_WALLET = "UQBjXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // <--- TU WALLET REAL
const ADSGRAM_BLOCK_ID = "int-00000"; // TU ID DE ADSGRAM

const RAID_CONFIG = {
    boss_hp: 1000000000,
    entry_cost: 15000,
    dmg_tap: 1000,
    dmg_video: 50000,
    dmg_nuke: 400000,
    dmg_antimatter: 4500000
};

// --- INTERFACES DE ESTADO ---
interface RaidState {
    current_hp: number;
    max_hp: number;
    is_active: boolean;
    ends_at: string;
}

interface LeaderboardItem {
    rank: number;
    name: string;
    damage: number;
    reward: string;
}

export const SolarRaid: React.FC = () => {
    const { user } = useAuth();
    const [tonConnectUI] = useTonConnectUI();
    
    const adControllerRef = useRef<AdController | null>(null);

    const [raid, setRaid] = useState<RaidState>(() => ({ 
        current_hp: 850000000,
        max_hp: RAID_CONFIG.boss_hp, 
        is_active: true, 
        ends_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString()
    }));
    
    const [myDamage, setMyDamage] = useState<number>(0);
    const [hasJoined, setHasJoined] = useState<boolean>(false);
    
    // CORRECCIÓN: Eliminamos 'setLeaderboard' porque no se usa (datos fijos)
    // Cuando conectes Supabase, cámbialo a: const [leaderboard, setLeaderboard] = ...
    const [leaderboard] = useState<LeaderboardItem[]>([
        { rank: 1, name: "CryptoWhale", damage: 55000000, reward: "🏆 35 TON" },
        { rank: 2, name: "ElonMusk_TON", damage: 32000000, reward: "🥈 20 TON" },
        { rank: 3, name: "GemHunter", damage: 15000000, reward: "🥉 10 TON" },
        { rank: 4, name: "Miner_007", damage: 8000000, reward: "3 TON" },
        { rank: 25, name: "LuckyGuy", damage: 500000, reward: "1 TON" },
    ]);

    const [loading, setLoading] = useState<boolean>(false);
    const [attackAnim, setAttackAnim] = useState<boolean>(false);

    // 1. INICIALIZACIÓN ADSGRAM
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Adsgram && !adControllerRef.current) {
            adControllerRef.current = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
        }
    }, []);

    // --- LÓGICA DE JUEGO ---

    const joinRaid = async () => {
        if (!user) return;
        if (!window.confirm(`🔥 BURN ${RAID_CONFIG.entry_cost.toLocaleString()} Points to enter the Raid?`)) return;
        
        setLoading(true);
        
        // Simulación de llamada a servidor
        setTimeout(() => {
            setHasJoined(true);
            setLoading(false);
            alert("⚔️ YOU HAVE JOINED THE RAID!");
        }, 1000);
    };

    const applyDamage = (amount: number) => {
        setRaid(prev => ({ ...prev, current_hp: Math.max(0, prev.current_hp - amount) }));
        setMyDamage(prev => prev + amount);
        
        setAttackAnim(true);
        setTimeout(() => setAttackAnim(false), 100);
    };

    const handleTapAttack = () => {
        applyDamage(RAID_CONFIG.dmg_tap);
    };

    const handleVideoAttack = async () => {
        if (loading) return;
        
        let success = false;
        if (adControllerRef.current) {
            try {
                await adControllerRef.current.show();
                success = true;
            } catch (e) {
                console.error("Ad error:", e);
            }
        } else {
            // Modo Beta / Fallback
            success = window.confirm("📺 Watch Ad Simulation?");
        }

        if (success) {
            applyDamage(RAID_CONFIG.dmg_video);
            alert(`💥 LASER BEAM! -${RAID_CONFIG.dmg_video.toLocaleString()} HP`);
        }
    };

    const buyAttack = async (type: 'nuke' | 'antimatter') => {
        if (!tonConnectUI.wallet) {
            return alert("Connect Wallet first!");
        }
        
        const price = type === 'nuke' ? 0.15 : 1.5;
        const damage = type === 'nuke' ? RAID_CONFIG.dmg_nuke : RAID_CONFIG.dmg_antimatter;
        const name = type === 'nuke' ? "TACTICAL NUKE" : "ANTIMATTER BOMB";

        try {
            const amountInNanotons = (price * 1000000000).toString();
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [{ address: ADMIN_WALLET, amount: amountInNanotons }]
            };
            
            await tonConnectUI.sendTransaction(transaction);
            applyDamage(damage);
            alert(`🚀 ${name} LAUNCHED! -${damage.toLocaleString()} HP`);

        } catch (e) {
            console.error(e);
            alert("Attack Cancelled");
        }
    };

    // --- RENDERIZADO ---
    const hpPercent = (raid.current_hp / raid.max_hp) * 100;

    return (
        <div style={{ padding: '20px 10px', paddingBottom: '100px', textAlign: 'center', color: 'white' }}>
            
            {/* HEADER */}
            <h2 className="text-gradient" style={{ fontSize: '28px', margin: '0 0 5px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                <Flame color="#FF512F" fill="#FF512F" /> SOLAR RAID
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '12px', color: '#aaa', marginBottom: '20px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Timer size={14} /> 71h left</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={14} /> 1,240 Raiders</span>
            </div>

            {/* BOSS VISUAL */}
            <div style={{ position: 'relative', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <div style={{
                    width: '180px', height: '180px', borderRadius: '50%',
                    background: 'radial-gradient(circle, #F09819 20%, #FF512F 90%)',
                    boxShadow: '0 0 60px #FF512F',
                    transform: attackAnim ? 'scale(0.95)' : 'scale(1)',
                    transition: 'transform 0.1s',
                    position: 'relative', zIndex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <span style={{ fontSize: '60px' }}>🌞</span>
                    {attackAnim && <div style={{position:'absolute', color:'#fff', fontWeight:'bold', fontSize:'24px', textShadow:'0 0 10px red'}}>-DMG</div>}
                </div>

                <div style={{ position: 'absolute', bottom: 0, width: '90%', maxWidth: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#fff', marginBottom: '4px', fontWeight: 'bold' }}>
                        <span>{(raid.current_hp / 1000000).toFixed(1)}M HP</span>
                        <span>{(raid.max_hp / 1000000).toFixed(0)}M</span>
                    </div>
                    <div style={{ width: '100%', height: '16px', background: '#220000', borderRadius: '8px', overflow: 'hidden', border: '1px solid #550000', boxShadow: '0 0 10px #000' }}>
                        <div style={{ 
                            width: `${hpPercent}%`, height: '100%', 
                            background: 'linear-gradient(90deg, #FF512F, #DD2476)',
                            boxShadow: '0 0 20px #FF512F', transition: 'width 0.3s ease-out' 
                        }} />
                    </div>
                </div>
            </div>

            {/* ACTIONS */}
            {!hasJoined ? (
                <div className="glass-card" style={{ border: '1px solid #FF512F', animation: 'pulse 2s infinite', marginTop: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>Join the Raid</h3>
                    <p style={{ fontSize: '12px', color: '#aaa' }}>Fee: {RAID_CONFIG.entry_cost.toLocaleString()} Points</p>
                    <button onClick={joinRaid} disabled={loading} className="btn-neon" style={{ width: '100%', background: '#FF512F', marginTop: '10px' }}>
                        {loading ? 'Joining...' : '🔥 JOIN RAID'}
                    </button>
                </div>
            ) : (
                <div style={{ marginTop: '20px' }}>
                    {/* Stats */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '15px' }}>
                        <div>
                            <div style={{ fontSize: '10px', color: '#aaa' }}>DAMAGE</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FF9800' }}>{myDamage.toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', color: '#aaa' }}>RANK</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>#42</div>
                        </div>
                    </div>

                    {/* Weapons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px' }}>
                        <button onClick={handleTapAttack} className="glass-card" style={{ padding: '10px', cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center' }}>
                            <Crosshair size={20} color="#fff" />
                            <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '5px' }}>BASIC</div>
                            <div style={{ fontSize: '9px', color: '#aaa' }}>-1k</div>
                        </button>
                        <button onClick={handleVideoAttack} className="glass-card" style={{ padding: '10px', cursor: 'pointer', border: '1px solid #4CAF50', display:'flex', flexDirection:'column', alignItems:'center' }}>
                            <Video size={20} color="#4CAF50" />
                            <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '5px' }}>LASER</div>
                            <div style={{ fontSize: '9px', color: '#4CAF50' }}>-50k</div>
                        </button>
                        <button onClick={() => buyAttack('nuke')} className="glass-card" style={{ padding: '10px', cursor: 'pointer', border: '1px solid #00F2FE', display:'flex', flexDirection:'column', alignItems:'center' }}>
                            <Zap size={20} color="#00F2FE" />
                            <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '5px' }}>NUKE</div>
                            <div style={{ fontSize: '9px', color: '#00F2FE' }}>0.15 TON</div>
                        </button>
                        <button onClick={() => buyAttack('antimatter')} className="glass-card" style={{ padding: '10px', cursor: 'pointer', border: '1px solid #E040FB', display:'flex', flexDirection:'column', alignItems:'center' }}>
                            <Bomb size={20} color="#E040FB" />
                            <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '5px' }}>BOMB</div>
                            <div style={{ fontSize: '9px', color: '#E040FB' }}>1.5 TON</div>
                        </button>
                    </div>

                    {/* Leaderboard */}
                    <div className="glass-card" style={{ textAlign: 'left', padding: '15px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#fff', display:'flex', alignItems:'center', gap:'8px' }}>
                            <Trophy size={16} color="#FFD700" /> TOP RAIDERS
                        </h4>
                        {leaderboard.map((player) => (
                            <div key={player.rank} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '11px' }}>
                                <span>#{player.rank} {player.name}</span>
                                <span style={{ color: '#FF512F' }}>{player.damage.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};