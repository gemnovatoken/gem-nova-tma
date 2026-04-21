import { Pickaxe, Rocket, Aperture, Map, Users, Wallet } from 'lucide-react';

// 1. Definimos la "forma" de los datos que recibe el componente
interface BottomNavProps {
  activeTab: string;
  setTab: (tab: string) => void;
}

// 2. Usamos esa definición en lugar de 'any'
export const BottomNav = ({ activeTab, setTab }: BottomNavProps) => {
  // 🔥 MARKET REGRESA INTACTO Y SE MANTIENE LA NUEVA RULETA (SPIN) 🔥
  const tabs = [
    { id: 'mine', icon: Pickaxe, label: 'Mine' },
    { id: 'market', icon: Rocket, label: 'Market' }, // <--- TU MARKET 100% FUNCIONAL
    { id: 'wheel', icon: Aperture, label: 'Spin' },  // <--- LA NUEVA RULETA
    { id: 'mission', icon: Map, label: 'Mission' },
    { id: 'squad', icon: Users, label: 'Squad' },
    { id: 'wallet', icon: Wallet, label: 'Airdrop' },
  ];

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      /* 🔥 Efecto Cristal (Glassmorphism) */
      background: 'rgba(11, 14, 20, 0.85)', 
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)', /* Para Safari/iOS */
      borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
      display: 'flex', 
      justifyContent: 'space-between', /* Ajustado para que quepan 6 botones */
      /* 🔥 Safe Area para que no choque con la barra de iPhone */
      padding: '12px 10px calc(12px + env(safe-area-inset-bottom)) 10px', 
      zIndex: 100,
      boxShadow: '0 -5px 25px rgba(0,0,0,0.5)'
    }}>
      {tabs.map(t => {
        const isActive = activeTab === t.id;
        
        return (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)}
            style={{ 
              background: 'none', 
              border: 'none', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '4px', 
              fontSize: '10px', /* Letra un poco más ajustada para 6 tabs */
              fontWeight: isActive ? '900' : '600',
              color: isActive ? '#00F2FE' : '#666',
              cursor: 'pointer',
              /* 🔥 Animación suave al hacer clic */
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isActive ? 'translateY(-4px)' : 'translateY(0)',
              flex: 1 /* Distribución equitativa */
            }}
          >
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {/* 🔥 Resplandor detrás del ícono activo */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  width: '28px',
                  height: '28px',
                  background: 'rgba(0, 242, 254, 0.2)',
                  borderRadius: '50%',
                  filter: 'blur(8px)',
                  zIndex: 0
                }} />
              )}
              
              <t.icon 
                size={22} /* Ícono un pixel más pequeño para balancear */
                style={{ 
                  zIndex: 1,
                  /* 🔥 El ícono brilla con luz de neón si está activo */
                  filter: isActive ? 'drop-shadow(0 0 5px rgba(0, 242, 254, 0.8))' : 'none',
                  transition: 'all 0.3s ease'
                }} 
              />
            </div>
            
            {t.label}

            {/* 🔥 Puntito indicador bajo el texto */}
            <div style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#00F2FE',
              boxShadow: '0 0 8px #00F2FE',
              marginTop: '2px',
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'scale(1)' : 'scale(0)',
              transition: 'all 0.3s ease'
            }} />
          </button>
        );
      })}
    </div>
  );
};