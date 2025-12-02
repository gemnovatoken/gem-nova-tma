import React from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';

export const Header: React.FC = () => {
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'center', // Centra el contenido horizontalmente
      alignItems: 'center', 
      padding: '10px 20px',
      paddingTop: '25px', // 🛡️ Safe Area extra para el botón de cierre
      background: 'rgba(11, 14, 20, 0.95)', // Un poco más oscuro para legibilidad
      backdropFilter: 'blur(10px)',
      position: 'sticky', top: 0, zIndex: 100,
      borderBottom: '1px solid rgba(255,255,255,0.05)'
    }}>
      
      {/* Logo / Nombre Oficial (CENTRADO) */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#00F2FE', boxShadow:'0 0 10px #00F2FE'}}></div>
          <span style={{ 
              fontWeight:'900', 
              fontSize:'20px', // 🔍 Más grande (antes 16px)
              letterSpacing:'1px',
              color: '#fff',
              textShadow: '0 0 15px rgba(0, 242, 254, 0.3)'
          }}>
            GNova<span style={{color:'#00F2FE'}}>Ecosystem</span>
          </span>
      </div>

      {/* Botón de Conexión (FLOTANDO A LA DERECHA) */}
      {/* Lo sacamos del flujo normal para que no empuje el título */}
      <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-40%)' }}>
          <TonConnectButton />
      </div>

    </header>
  );
};