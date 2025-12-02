import React from 'react';

export const Header: React.FC = () => {
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '10px 20px',
      // 🛡️ AJUSTE: Bajamos más el texto (45px) para librar botones de Telegram
      paddingTop: '45px', 
      background: 'rgba(11, 14, 20, 0.95)', 
      backdropFilter: 'blur(10px)',
      position: 'sticky', top: 0, zIndex: 100,
      borderBottom: '1px solid rgba(255,255,255,0.05)'
    }}>
      
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#00F2FE', boxShadow:'0 0 10px #00F2FE'}}></div>
          <span style={{ 
              fontWeight:'900', 
              fontSize:'20px', 
              letterSpacing:'1px',
              color: '#fff',
              textShadow: '0 0 15px rgba(0, 242, 254, 0.3)'
          }}>
            GNova<span style={{color:'#00F2FE'}}>Ecosystem</span>
          </span>
      </div>

      {/* 🗑️ Botón eliminado de aquí para limpiar la vista */}

    </header>
  );
};