import { useState } from 'react';
import { StakingModal } from './StakingModal'; // Importamos el Modal
// ... otros imports

export const BulkStore: React.FC = () => {
    // ... lógica de compra ...
    const [showBank, setShowBank] = useState(false); // Estado para mostrar el modal

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            
            {/* ... tus tarjetas de paquetes ... */}

            {/* BOTÓN PARA ABRIR EL BANCO (En lugar del componente incrustado) */}
            <div style={{ marginTop: '30px' }}>
                <button onClick={() => setShowBank(true)} className="glass-card" style={{ width:'100%', padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', border:'1px solid #E040FB', background:'rgba(224, 64, 251, 0.1)' }}>
                    <div style={{textAlign:'left'}}>
                        <div style={{fontWeight:'bold', fontSize:'18px', color:'#fff'}}>🏦 Nova Bank</div>
                        <div style={{fontSize:'12px', color:'#E040FB'}}>Staking & Passive Income</div>
                    </div>
                    <div style={{fontSize:'24px', color:'#fff'}}>&gt;</div>
                </button>
            </div>

            {/* EL MODAL */}
            {showBank && <StakingModal onClose={() => setShowBank(false)} />}
        </div>
    );
};