import React, { useState, useEffect } from 'react';
// 🔥 SOLUCIÓN 1: Agregamos 'Ticket' a la importación
import { X, Star, Diamond, Zap, Flame, Clock, ShieldAlert, Lock, Unlock, Ticket } from 'lucide-react';

interface VipStoreModalProps {
    onClose: () => void;
    userLevel?: number;
}

// 🔥 SOLUCIÓN 2: Definimos cómo es exactamente un Paquete Normal (Stars, TON, Points)
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

// 🔥 SOLUCIÓN 3: Definimos cómo es un Paquete de Preventa (IDO)
interface PresalePackage {
    id: string;
    name: string;
    gnt: number;
    bonus: string;
    ton: number;
}

// Tipo combinado para la función de compra
type PurchaseItem = StorePackage | PresalePackage;

export const VipStoreModal: React.FC<VipStoreModalProps> = ({ onClose, userLevel = 1 }) => {
    const [activeTab, setActiveTab] = useState<'STARS' | 'TON' | 'POINTS' | 'PRESALE'>('STARS');
    const [timeLeft, setTimeLeft] = useState("11:59:59");
    const isFlashSale = true;

    useEffect(() => {
        const timer = setInterval(() => {
            const d = new Date();
            setTimeLeft(`${11 - (d.getHours() % 12)}h ${59 - d.getMinutes()}m ${59 - d.getSeconds()}s`);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 📦 BASE DE DATOS (Ahora fuertemente tipada)
    const storeData: {
        STARS: StorePackage[];
        TON: StorePackage[];
        POINTS: StorePackage[];
        PRESALE: PresalePackage[];
    } = {
        STARS: [
            { id: 's1', name: 'Starter Pouch', spins: 20, points: '50K', gnt: 0, base: 100, flash: 50, color: '#FFD700' },
            { id: 's2', name: 'Streak Chest', spins: 65, points: '150K', gnt: 1, base: 300, flash: 150, color: '#FF9800', popular: true },
            { id: 's3', name: 'Gnova Briefcase', spins: 150, points: '300K', gnt: 2, base: 600, flash: 300, color: '#FF0055' }
        ],
        TON: [
            { id: 't1', name: 'Seed Investor', spins: 30, points: '100K', gnt: 0, base: 1.0, flash: 0.5, color: '#00F2FE' },
            { id: 't2', name: 'Venture Capital', spins: 70, points: '200K', gnt: 1, base: 2.0, flash: 1.0, color: '#0088CC', popular: true },
            { id: 't3', name: 'The Oracle', spins: 160, points: '500K', gnt: 3, base: 4.0, flash: 2.0, color: '#7B2CBF' }
        ],
        POINTS: [
            { id: 'p1', name: 'Survival Pack', spins: 15, points: 0, gnt: 0, base: '200K', flash: '100K', color: '#4CAF50' },
            { id: 'p2', name: 'Grinder Stash', spins: 40, points: 0, gnt: 0, base: '500K', flash: '250K', color: '#8BC34A' },
            { id: 'p3', name: 'The Vault', spins: 90, points: 0, gnt: 0, base: '1.0M', flash: '500K', color: '#00C853', popular: true }
        ],
        PRESALE: [
            { id: 'ido1', name: 'Airdrop Tier', gnt: 50, bonus: '0%', ton: 1 },
            { id: 'ido2', name: 'Whale Tier', gnt: 525, bonus: '+5%', ton: 10 },
            { id: 'ido3', name: 'Shark Tier', gnt: 1100, bonus: '+10%', ton: 20 },
            { id: 'ido4', name: 'Kraken Tier', gnt: 2825, bonus: '+13%', ton: 50 },
            { id: 'ido5', name: 'Leviathan Tier', gnt: 5750, bonus: '+15%', ton: 100 }
        ]
    };

    // 🔥 SOLUCIÓN 4: Quitamos 'any' y usamos nuestro tipo PurchaseItem
    const handlePurchase = (item: PurchaseItem) => {
        alert(`🚧 CONECTANDO PASARELA DE PAGO...\n\nIniciando compra de ${item.name}. Pronto conectaremos la API de Telegram Stars y TON Connect aquí.`);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 5, 10, 0.98)', zIndex: 9900,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '20px 10px', overflowY: 'auto', backdropFilter: 'blur(15px)'
        }}>
            {/* HEADER */}
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap color="#FFD700" fill="#FFD700" size={24} />
                    <h2 style={{ color: '#FFF', margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '2px' }}>BLACK MARKET</h2>
                </div>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            {/* FLASH SALE BANNER */}
            {isFlashSale && (
                <div style={{ width: '100%', maxWidth: '400px', background: 'linear-gradient(90deg, #FF0055, #FF4400)', borderRadius: '12px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', boxShadow: '0 5px 20px rgba(255,0,85,0.4)', border: '1px solid #FFAA00' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF', fontWeight: '900', fontSize: '14px' }}>
                        <Flame fill="#FFD700" color="#FFD700" /> 50% FLASH SALE
                    </div>
                    <div style={{ background: '#000', padding: '4px 10px', borderRadius: '8px', color: '#FFD700', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} /> {timeLeft}
                    </div>
                </div>
            )}

            {/* TABS (NAVEGACIÓN) */}
            <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }} className="no-scrollbar">
                {[
                    { id: 'STARS', icon: <Star size={16}/>, label: 'STARS' },
                    { id: 'TON', icon: <Diamond size={16}/>, label: 'TON' },
                    { id: 'POINTS', icon: <Zap size={16}/>, label: 'BURN' },
                    { id: 'PRESALE', icon: <ShieldAlert size={16}/>, label: 'IDO' }
                ].map(tab => (
                    // 🔥 SOLUCIÓN 5: Quitamos el 'as any' y lo casteamos correctamente
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as 'STARS' | 'TON' | 'POINTS' | 'PRESALE')}
                        style={{
                            flex: 1, minWidth: '85px', padding: '10px 5px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '900',
                            background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: activeTab === tab.id ? '#FFF' : '#666',
                            border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                            transition: 'all 0.3s'
                        }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENIDO DE LA TIENDA */}
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* RENDERIZADO DE STARS, TON Y POINTS */}
                {activeTab !== 'PRESALE' && storeData[activeTab].map((pkg: StorePackage) => (
                    <div key={pkg.id} style={{
                        background: 'linear-gradient(145deg, rgba(30,30,35,0.9) 0%, rgba(15,15,20,0.9) 100%)',
                        border: `1px solid ${pkg.popular ? pkg.color : '#333'}`, borderRadius: '16px', padding: '20px',
                        position: 'relative', overflow: 'hidden', boxShadow: pkg.popular ? `0 0 20px ${pkg.color}33` : 'none'
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
                                    {pkg.base} {activeTab === 'STARS' ? '⭐' : (activeTab === 'TON' ? '💎' : 'PTS')}
                                </div>
                                <div style={{ color: '#FFF', fontSize: '24px', fontWeight: '900', marginTop: '-5px', textShadow: isFlashSale ? '0 0 10px rgba(255,0,85,0.5)' : 'none' }}>
                                    {pkg.flash} {activeTab === 'STARS' ? '⭐' : (activeTab === 'TON' ? '💎' : 'PTS')}
                                </div>
                            </div>
                        </div>

                        <button onClick={() => handlePurchase(pkg)} style={{
                            width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
                            background: isFlashSale ? 'linear-gradient(90deg, #FF0055, #FF4400)' : '#333',
                            color: '#FFF', fontWeight: '900', fontSize: '16px', cursor: 'pointer',
                            boxShadow: isFlashSale ? '0 5px 15px rgba(255,0,85,0.3)' : 'none', transition: 'transform 0.2s'
                        }}>
                            {activeTab === 'POINTS' ? 'BURN POINTS' : 'BUY NOW'}
                        </button>
                    </div>
                ))}

                {/* RENDERIZADO DE LA PRE-VENTA PRIVADA (GATED) */}
                {activeTab === 'PRESALE' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        
                        {/* AVISO DEL BANCO CENTRAL */}
                        <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid #FFD700', padding: '15px', borderRadius: '16px', textAlign: 'center' }}>
                            <h3 style={{ color: '#FFD700', margin: '0 0 10px 0', fontSize: '16px', fontWeight: '900' }}>🏦 GNOVA CENTRAL BANK</h3>
                            <p style={{ color: '#aaa', fontSize: '12px', margin: '0 0 10px 0', lineHeight: '1.4' }}>The Private GNT Sale is exclusively for elite players. Your tokens are locked until the official DEX listing.</p>
                            <div style={{ background: '#000', padding: '10px', borderRadius: '8px', color: userLevel >= 5 ? '#4CAF50' : '#FF0055', fontWeight: 'bold', fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                                {userLevel >= 5 ? <Unlock size={14}/> : <Lock size={14}/>}
                                YOUR LEVEL: {userLevel} (REQ: LVL 5)
                            </div>
                        </div>

                        {userLevel < 5 && (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                                <Lock size={48} style={{ margin: '0 auto 15px auto', opacity: 0.5 }} />
                                <h3 style={{ margin: 0, color: '#fff' }}>ACCESS DENIED</h3>
                                <p style={{ fontSize: '14px' }}>Play the wheel and level up your account to access the private token sale.</p>
                            </div>
                        )}

                        {userLevel >= 5 && storeData.PRESALE.map((ido: PresalePackage) => (
                            <div key={ido.id} style={{
                                background: 'linear-gradient(90deg, rgba(20,20,25,0.9), rgba(40,20,50,0.9))',
                                border: '1px solid #7B2CBF', borderRadius: '16px', padding: '15px 20px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
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
                                <button onClick={() => handlePurchase(ido)} style={{
                                    background: '#7B2CBF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                                }}>
                                    {ido.ton} <Diamond size={14}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};