
import { Pickaxe, Rocket, Map, Users, Wallet } from 'lucide-react';

// 1. Definimos la "forma" de los datos que recibe el componente
interface BottomNavProps {
  activeTab: string;
  setTab: (tab: string) => void;
}

// 2. Usamos esa definición en lugar de 'any'
export const BottomNav = ({ activeTab, setTab }: BottomNavProps) => {
  const tabs = [
    { id: 'mine', icon: Pickaxe, label: 'Mine' },
    { id: 'market', icon: Rocket, label: 'Market' },
    { id: 'mission', icon: Map, label: 'Mission' },
    { id: 'squad', icon: Users, label: 'Squad' },
    { id: 'wallet', icon: Wallet, label: 'Airdrop' },
  ];

  return (
    <div style={{ 
      position: 'fixed', bottom: 0, left: 0, right: 0, 
      background: 'rgba(11, 14, 20, 0.95)', borderTop: '1px solid #333', 
      display: 'flex', justifyContent: 'space-around', padding: '12px 0 25px 0', zIndex: 100 
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '10px', color: activeTab === t.id ? '#00F2FE' : '#666' }}>
          <t.icon size={24} />
          {t.label}
        </button>
      ))}
    </div>
  );
};