import React from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';

export const Header: React.FC = () => {
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '15px 20px',
      // Fondo sutil para separar del contenido
      background: 'rgba(11, 14, 20, 0.8)',
      backdropFilter: 'blur(10px)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      
      {/* Logo / Nombre Oficial */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#00F2FE', boxShadow:'0 0 10px #00F2FE'}}></div>
          <span style={{ fontWeight:'900', fontSize:'16px', letterSpacing:'0.5px' }}>
            GNova<span style={{color:'#00F2FE'}}>Ecosystem</span>
          </span>
      </div>

      {/* Botón de Conexión (Sin texto extra) */}
      <TonConnectButton /> 
    </header>
  );
};