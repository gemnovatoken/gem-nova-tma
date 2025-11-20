// src/components/Header.tsx
import { TonConnectButton } from '@tonconnect/ui-react';
import React from 'react';
import { AddressDisplay } from './AddressDisplay';


export const Header: React.FC = () => {
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '10px 20px',
      borderBottom: '1px solid #ccc' 
    }}>
      <span>**Mi TMA Tap-to-Earn**</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}></div>
          <AddressDisplay />
          <TonConnectButton /> 
      {/* El botón maneja toda la lógica de conexión */}
    </header>
  );
};