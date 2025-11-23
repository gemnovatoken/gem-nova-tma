import React from 'react';
import { X } from 'lucide-react';

// --- Interfaces Definidas Aquí ---
interface UpgradeConfig {
  values: number[];
  costs: number[];
}

interface GameConfigs {
  multitap: UpgradeConfig;
  limit: UpgradeConfig;
  speed: UpgradeConfig;
}

interface BoostModalProps {
    onClose: () => void;
    levels: { multitap: number; limit: number; speed: number };
    score: number;
    onBuy: (type: 'multitap' | 'limit' | 'speed') => void;
    configs: GameConfigs; // <--- AQUÍ CORREGIMOS EL PRIMER ANY
}

export const BoostModal: React.FC<BoostModalProps> = ({ onClose, levels, score, onBuy, configs }) => {
    
    const getInfo = (type: keyof GameConfigs, currentLvl: number) => { // Usamos keyof GameConfigs para seguridad
        const config = configs[type];
        const idx = currentLvl - 1;
        const isMax = idx >= config.values.length - 1;
        
        // TypeScript ahora sabe que costs y values son arrays de números
        const nextCost = isMax ? 0 : config.costs[currentLvl]; 
        const currentVal = config.values[idx];
        const nextVal = isMax ? currentVal : config.values[idx + 1];
        
        return { isMax, nextCost, currentVal, nextVal };
    };

    const multiInfo = getInfo('multitap', levels.multitap);
    const limitInfo = getInfo('limit', levels.limit);
    const speedInfo = getInfo('speed', levels.speed);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 2000,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }}>
            <div style={{flex: 1}} onClick={onClose} />

            <div className="glass-card" style={{ 
                margin: 0, borderRadius: '20px 20px 0 0', padding: '20px', 
                borderBottom: 'none', maxHeight: '70vh', overflowY: 'auto',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h2 style={{margin: 0}}>🚀 Upgrades</h2>
                    <button onClick={onClose} style={{background:'none', border:'none', color:'#fff'}}><X /></button>
                </div>

                <BoostItem 
                    title="👆 Multitap" level={levels.multitap} 
                    desc={`+${multiInfo.currentVal} ➔ +${multiInfo.nextVal} pts`} 
                    price={multiInfo.nextCost} isMax={multiInfo.isMax} 
                    canAfford={score >= multiInfo.nextCost} onBuy={() => onBuy('multitap')} 
                />
                <BoostItem 
                    title="🔋 Energy Tank" level={levels.limit} 
                    desc={`${limitInfo.currentVal} ➔ ${limitInfo.nextVal} Cap`} 
                    price={limitInfo.nextCost} isMax={limitInfo.isMax} 
                    canAfford={score >= limitInfo.nextCost} onBuy={() => onBuy('limit')} 
                />
                <BoostItem 
                    title="⚡ Recharge Speed" level={levels.speed} 
                    desc={`+${speedInfo.currentVal} ➔ +${speedInfo.nextVal} /s`} 
                    price={speedInfo.nextCost} isMax={speedInfo.isMax} 
                    canAfford={score >= speedInfo.nextCost} onBuy={() => onBuy('speed')} 
                />
            </div>
            <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>
    );
};

// --- Componente de Fila Corregido ---
// Definimos la interfaz para las props de BoostItem
interface BoostItemProps {
    title: string;
    level: number;
    desc: string;
    price: number;
    isMax: boolean;
    canAfford: boolean;
    onBuy: () => void;
}

// Quitamos 'any' y usamos React.FC<BoostItemProps> o desestructuramos con el tipo inline
const BoostItem: React.FC<BoostItemProps> = ({ title, level, desc, price, isMax, canAfford, onBuy }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
        <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', color: '#fff' }}>{title} <span style={{color: '#00F2FE', fontSize: '10px'}}>Lvl {level}</span></div>
            <div style={{ fontSize: '11px', color: '#888' }}>{desc}</div>
        </div>
        <button className="btn-neon" onClick={onBuy} disabled={isMax || !canAfford} 
            style={{ fontSize: '12px', padding: '8px 16px', opacity: (isMax || !canAfford) ? 0.5 : 1, cursor: (isMax || !canAfford) ? 'not-allowed' : 'pointer', background: isMax ? '#2ecc71' : (canAfford ? undefined : '#333') }}>
            {isMax ? 'MAX' : `${price} 💎`}
        </button>
    </div>
);