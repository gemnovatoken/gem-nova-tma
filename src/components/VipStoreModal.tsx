import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Star, Diamond, Zap, Flame, Clock, ShieldAlert, Lock, Unlock, Ticket } from 'lucide-react';
// 🔥 1. IMPORTAMOS AUTENTICACIÓN Y BASE DE DATOS
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

interface VipStoreModalProps {
    onClose: () => void;
    userLevel?: number;
}

interface StorePackage {
    id: string;
    name: string;
    spins: number;
    points: string | number;
    gnt: number;
    base: string | number;
    flash: string | number;
    color: string;
    popular?: boolean;
}

interface PresalePackage {
    id: string;
    name: string;
    gnt: number;
    bonus: string;
    ton: number;
}

type PurchaseItem = StorePackage | PresalePackage;

const triggerConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;
    
    const frame = () => {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FFD700', '#FFA500', '#FF8C00'] 
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#FFD700', '#FFA500', '#FF8C00']
        });
    
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };
    frame();
};

// 🔥 2. TRADUCTOR DE PRECIOS VISUALES A NÚMEROS REALES
const parseCost = (costStr: string | number): number => {
    if (typeof costStr === 'number') return costStr;
    const upperStr = costStr.toUpperCase();
    if (upperStr.includes('K')) return parseFloat(upperStr) * 1000;
    if (upperStr.includes('M')) return parseFloat(upperStr) * 1000000;
    return parseFloat(upperStr);
};

export const VipStoreModal: React.FC<VipStoreModalProps> = ({ onClose, userLevel = 1 }) => {
    const { user } = useAuth(); // Obtenemos al usuario activo
    const [timeLeft, setTimeLeft] = useState("11:59:59");
    const [isProcessing, setIsProcessing] = useState(false); // Para evitar doble clic
    const isFlashSale = true; 

    useEffect(() => {
        const timer = setInterval(() => {
            const d = new Date();
            setTimeLeft(`${11 - (d.getHours() % 12)}h ${59 - d.getMinutes()}m ${59 - d.getSeconds()}s`);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const storeData: {
        STARS: StorePackage[];
        TON: StorePackage[];
        POINTS: StorePackage[];
        PRESALE: PresalePackage[];
    } = {
        STARS: [
            { id: 's1', name: 'Starter Pouch', spins: 5, points: '50K', gnt: 0, base: 100, flash: 50, color: '#FFD700' },
            { id: 's2', name: 'Streak Chest', spins: 12, points: '150K', gnt: 1, base: 300, flash: 150, color: '#FF9800', popular: true },
            { id: 's3', name: 'Gnova Briefcase', spins: 30, points: '300K', gnt: 2, base: 600, flash: 300, color: '#FF0055' }
        ],
        TON: [
            { id: 't1', name: 'Seed Investor', spins: 8, points: '100K', gnt: 0, base: 1.0, flash: 0.5, color: '#00F2FE' },
            { id: 't2', name: 'Venture Capital', spins: 18, points: '200K', gnt: 1, base: 2.0, flash: 1.0, color: '#0088CC', popular: true },
            { id: 't3', name: 'The Oracle', spins: 40, points: '500K', gnt: 3, base: 4.0, flash: 2.0, color: '#7B2CBF' }
        ],
        POINTS: [
            { id: 'p1', name: 'Survival Pack', spins: 3, points: 0, gnt: 0, base: '200K', flash: '100K', color: '#4CAF50' },
            { id: 'p2', name: 'Grinder Stash', spins: 8, points: 0, gnt: 0, base: '500K', flash: '250K', color: '#8BC34A' },
            { id: 'p3', name: 'The Vault', spins: 18, points: 0, gnt: 0, base: '1.0M', flash: '500K', color: '#00C853', popular: true }
        ],
        PRESALE: [
            { id: 'ido1', name: 'Airdrop Tier', gnt: 50, bonus: '0%', ton: 1 },
            { id: 'ido2', name: 'Whale Tier', gnt: 525, bonus: '+5%', ton: 10 },
            { id: 'ido3', name: 'Shark Tier', gnt: 1100, bonus: '+10%', ton: 20 },
            { id: 'ido4', name: 'Kraken Tier', gnt: 2825, bonus: '+13%', ton: 50 },
            { id: 'ido5', name: 'Leviathan Tier', gnt: 5750, bonus: '+15%', ton: 100 }
        ]
    };

    // 🔥 3. EL CEREBRO DE LAS COMPRAS
    const handlePurchase = async (item: PurchaseItem, currencyType: 'STARS' | 'TON' | 'POINTS' | 'PRESALE') => {
        if (!user) {
            alert("❌ User session not found. Please log in again.");
            return;
        }

        if (currencyType === 'POINTS') {
            const pkg = item as StorePackage;
            const realCost = parseCost(isFlashSale ? pkg.flash : pkg.base);
            
            const confirmMsg = `🔥 BURN ${realCost.toLocaleString()} POINTS?\n\nYou are buying the "${pkg.name}".\nYou will receive ${pkg.spins} VIP Spins!`;
            if (!window.confirm(confirmMsg)) return;

            setIsProcessing(true);
            try {
                // Llamamos a la función de Supabase
                const { data, error } = await supabase.rpc('process_store_purchase', {
                    p_user_id: user.id,
                    p_package_id: pkg.id,
                    p_currency: 'POINTS',
                    p_cost: realCost,
                    p_spins: pkg.spins,
                    p_points: 0, // Los paquetes de Puntos no regalan más puntos
                    p_gnt: pkg.gnt
                });

                if (error) throw error;

                if (data && data.success) {
                    triggerConfetti();
                    alert(`🎉 SUCCESS!\n\nTransaction complete. Close the Black Market to see your new VIP Spins!`);
                } else {
                    alert(`📉 FAILED: ${data?.message || 'Insufficient Points balance.'}`);
                }
            } catch (err: unknown) {
                console.error("Purchase Error:", err);
                let errorMessage = "An unexpected error occurred.";
                if (err instanceof Error) {
                    errorMessage = err.message;
                } else if (err && typeof err === 'object' && 'message' in err) {
                    errorMessage = String((err as Record<string, unknown>).message);
                }
                alert(`❌ SERVER ERROR: ${errorMessage}`);
            } finally {
                setIsProcessing(false);
            }

        } else {
            // Para TON y STARS lo dejamos preparado para la API oficial
            alert(`🚧 CONNECTING PAYMENT GATEWAY...\n\nInitiating purchase of ${item.name}. TON Connect / Telegram Stars integration coming soon.`);
        }
    };

    // 🔥 Actualizamos el Render para que sepa qué moneda está usando cada paquete
    const renderStorePackage = (pkg: StorePackage, currencyIcon: string, buttonText: string, currencyType: 'STARS' | 'TON' | 'POINTS') => (
        <div key={pkg.id} style={{
            background: 'linear-gradient(145deg, rgba(30,30,35,0.9) 0%, rgba(15,15,20,0.9) 100%)',
            border: `1px solid ${pkg.popular ? pkg.color : '#333'}`, borderRadius: '16px', padding: '20px',
            position: 'relative', overflow: 'hidden', boxShadow: pkg.popular ? `0 0 20px ${pkg.color}33` : 'none',
            opacity: isProcessing ? 0.6 : 1
        }}>
            {pkg.popular && (
                <div style={{ position: 'absolute', top: 15, right: -30, background: pkg.color, color: '#000', fontSize: '10px', fontWeight: '900', padding: '5px 40px', transform: 'rotate(45deg)', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    BEST DEAL
                </div>
            )}
            
            <h3 style={{ margin: '0 0 15px 0', color: '#FFF', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: pkg.color, boxShadow: `0 0 10px ${pkg.color}` }} />
                {pkg.name}
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ color: '#00F2FE', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Ticket size={16} /> {pkg.spins} VIP SPINS
                    </div>
                    {pkg.points !== 0 && (
                        <div style={{ color: '#aaa', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Zap size={14} /> {pkg.points} PTS
                        </div>
                    )}
                    {pkg.gnt > 0 && (
                        <div style={{ color: '#FFD700', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', textShadow: '0 0 5px rgba(255,215,0,0.5)' }}>
                            <ShieldAlert size={14} /> +{pkg.gnt} GNT TOKEN
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#666', textDecoration: 'line-through', fontSize: '14px', fontWeight: 'bold' }}>
                        {pkg.base} {currencyIcon}
                    </div>
                    <div style={{ color: '#FFF', fontSize: '24px', fontWeight: '900', marginTop: '-5px', textShadow: isFlashSale ? '0 0 10px rgba(255,0,85,0.5)' : 'none' }}>
                        {pkg.flash} {currencyIcon}
                    </div>
                </div>
            </div>

            <button 
                onClick={() => handlePurchase(pkg, currencyType)} 
                disabled={isProcessing}
                style={{
                    width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
                    background: isFlashSale ? 'linear-gradient(90deg, #FF0055, #FF4400)' : '#333',
                    color: '#FFF', fontWeight: '900', fontSize: '16px', cursor: isProcessing ? 'not-allowed' : 'pointer',
                    boxShadow: isFlashSale ? '0 5px 15px rgba(255,0,85,0.3)' : 'none', transition: 'transform 0.2s'
            }}>
                {isProcessing ? 'PROCESSING...' : buttonText}
            </button>
        </div>
    );

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 5, 10, 0.98)', zIndex: 9900,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '20px 10px', overflowY: 'auto', backdropFilter: 'blur(15px)'
        }}>
            {/* HEADER FIJO */}
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap color="#FFD700" fill="#FFD700" size={24} />
                    <h2 style={{ color: '#FFF', margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '2px' }}>BLACK MARKET</h2>
                </div>
                <button onClick={onClose} disabled={isProcessing} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            {/* FLASH SALE BANNER */}
            {isFlashSale && (
                <div style={{ width: '100%', maxWidth: '400px', background: 'linear-gradient(90deg, #FF0055, #FF4400)', borderRadius: '12px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', boxShadow: '0 5px 20px rgba(255,0,85,0.4)', border: '1px solid #FFAA00' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF', fontWeight: '900', fontSize: '14px' }}>
                        <Flame fill="#FFD700" color="#FFD700" /> 50% FLASH SALE
                    </div>
                    <div style={{ background: '#000', padding: '4px 10px', borderRadius: '8px', color: '#FFD700', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} /> {timeLeft}
                    </div>
                </div>
            )}

            {/* CONTENIDO DE LA TIENDA (SCROLL CONTINUO) */}
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '50px' }}>
                
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#FFD700', borderBottom: '1px solid rgba(255,215,0,0.3)', paddingBottom: '10px' }}>
                        <Star size={20} fill="#FFD700" />
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>IMPULSE PACKS <span style={{fontSize:'12px', color:'#aaa', fontWeight:'normal'}}>(STARS)</span></h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* Pasamos 'STARS' como tipo de moneda */}
                        {storeData.STARS.map(pkg => renderStorePackage(pkg, '⭐', 'BUY WITH STARS', 'STARS'))}
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#00F2FE', borderBottom: '1px solid rgba(0,242,254,0.3)', paddingBottom: '10px' }}>
                        <Diamond size={20} fill="#00F2FE" />
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>WHALE PACKS <span style={{fontSize:'12px', color:'#aaa', fontWeight:'normal'}}>(TON)</span></h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* Pasamos 'TON' como tipo de moneda */}
                        {storeData.TON.map(pkg => renderStorePackage(pkg, '💎', 'BUY WITH TON', 'TON'))}
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#4CAF50', borderBottom: '1px solid rgba(76,175,80,0.3)', paddingBottom: '10px' }}>
                        <Zap size={20} fill="#4CAF50" />
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>BURNER PACKS <span style={{fontSize:'12px', color:'#aaa', fontWeight:'normal'}}>(POINTS)</span></h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* Pasamos 'POINTS' como tipo de moneda */}
                        {storeData.POINTS.map(pkg => renderStorePackage(pkg, 'PTS', 'BURN POINTS', 'POINTS'))}
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#7B2CBF', borderBottom: '1px solid rgba(123,44,191,0.3)', paddingBottom: '10px' }}>
                        <ShieldAlert size={20} />
                        <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '900' }}>PRIVATE GNT SALE <span style={{fontSize:'12px', color:'#aaa', fontWeight:'normal'}}>(IDO)</span></h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid #FFD700', padding: '15px', borderRadius: '16px', textAlign: 'center' }}>
                            <h3 style={{ color: '#FFD700', margin: '0 0 10px 0', fontSize: '16px', fontWeight: '900' }}>🏦 GNOVA CENTRAL BANK</h3>
                            <p style={{ color: '#aaa', fontSize: '12px', margin: '0 0 10px 0', lineHeight: '1.4' }}>Exclusively for elite players. Tokens are locked until official DEX listing.</p>
                            <div style={{ background: '#000', padding: '10px', borderRadius: '8px', color: userLevel >= 5 ? '#4CAF50' : '#FF0055', fontWeight: 'bold', fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                                {userLevel >= 5 ? <Unlock size={14}/> : <Lock size={14}/>}
                                YOUR LEVEL: {userLevel} (REQ: LVL 5)
                            </div>
                        </div>

                        {userLevel < 5 && (
                            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#666', border: '1px dashed #444', borderRadius: '16px' }}>
                                <Lock size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>ACCESS DENIED</h3>
                                <p style={{ fontSize: '12px' }}>Level up your account to unlock these investment tiers.</p>
                            </div>
                        )}

                        {userLevel >= 5 && storeData.PRESALE.map((ido: PresalePackage) => (
                            <div key={ido.id} style={{
                                background: 'linear-gradient(90deg, rgba(20,20,25,0.9), rgba(40,20,50,0.9))',
                                border: '1px solid #7B2CBF', borderRadius: '16px', padding: '15px 20px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                opacity: isProcessing ? 0.6 : 1
                            }}>
                                <div>
                                    <div style={{ color: '#aaa', fontSize: '12px', fontWeight: 'bold' }}>{ido.name}</div>
                                    <div style={{ color: '#FFF', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        {ido.gnt} <span style={{ color: '#FFD700', fontSize: '14px' }}>GNT</span>
                                    </div>
                                    <div style={{ color: '#00F2FE', fontSize: '11px', fontWeight: '900', marginTop: '4px', background: 'rgba(0,242,254,0.1)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                        {ido.bonus} EXTRA BONUS
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handlePurchase(ido, 'PRESALE')} 
                                    disabled={isProcessing}
                                    style={{
                                    background: '#7B2CBF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '900', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                                }}>
                                    {ido.ton} <Diamond size={14}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};