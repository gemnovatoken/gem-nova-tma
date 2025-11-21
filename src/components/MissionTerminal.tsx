import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase'; // Asegúrate de importar esto
import { useAuth } from '../hooks/useAuth';      // Y esto
import { Terminal, ShieldAlert, FileText, X, ChevronRight, CheckCircle2, Circle, Gift } from 'lucide-react';

// --- CONTENIDO DEL WHITEPAPER (SEPARADO POR PÁGINAS) ---
const WP_PAGES = [
    {
        title: "1.0 THE MISSION",
        content: (
            <>
                <p className="wp-text">The universe of Telegram Mini Apps is cluttered with empty promises. <strong>Gem Nova Token</strong> changes the paradigm.</p>
                <p className="wp-text">We are building a strategy-based ecosystem where value is not dictated by a calendar, but by the <strong>community's collective effort</strong>.</p>
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #00F2FE', color: '#00F2FE'}}>
                    "We do not measure progress in Days.<br/>
                    We measure progress in REVENUE %.<br/>
                    YOU control the launch date."
                </div>
            </>
        )
    },
    {
        title: "2.0 THE ECONOMY",
        content: (
            <>
                <p className="wp-text"><strong>THE FUEL (BULK PACKS):</strong><br/>Bulk Packs are the engine. Every purchase increases the simulated token price and fills the Launch Progress Bar.</p>
                <p className="wp-text"><strong>THE ELITE (NFTs):</strong><br/>Limited-supply assets released weekly.</p>
                <ul style={{fontSize: '12px', paddingLeft: '15px', color: '#aaa'}}>
                    <li><strong>Tier 7:</strong> Requires huge point burn. Grants daily rewards.</li>
                    <li><strong>Tier 8 (Whale):</strong> Grants elite daily yields + Bonus Points.</li>
                </ul>
            </>
        )
    },
    {
        title: "3.0 DYNAMIC ROADMAP",
        content: (
            <>
                <p className="wp-text">This Roadmap is bound by <strong>REVENUE MILESTONES</strong>.</p>
                <ul style={{listStyle: 'none', padding: 0, fontSize: '12px'}}>
                    <li style={{marginBottom: '8px'}}>🌑 <strong>PHASE 1: IGNITION (0-25%)</strong><br/><span style={{color:'#888'}}>Mining, Economy Setup, Community.</span></li>
                    <li style={{marginBottom: '8px'}}>🌒 <strong>PHASE 2: ACCELERATION (25-60%)</strong><br/><span style={{color:'#888'}}>NFT Marketplace, "Kill The Sun" Game, Staking.</span></li>
                    <li style={{marginBottom: '8px'}}>🌓 <strong>PHASE 3: VELOCITY (60-90%)</strong><br/><span style={{color:'#888'}}>DAO, Strategic Partnerships, DEX/CEX Negotiations.</span></li>
                    <li>🌕 <strong>PHASE 4: EVENT HORIZON (100%)</strong><br/><span style={{color:'#00F2FE'}}>TGE, Airdrop, Listing, NFT Dividends.</span></li>
                </ul>
            </>
        )
    },
    {
        title: "LEGAL DISCLAIMER",
        content: (
            <div style={{border: '1px solid #FFD700', padding: '15px', background: 'rgba(255, 215, 0, 0.1)'}}>
                <div style={{display:'flex', gap:'5px', color: '#FFD700', fontWeight:'bold', marginBottom:'10px'}}>
                    <ShieldAlert size={18}/> WARNING
                </div>
                <p style={{color: '#ddd', fontSize: '11px', lineHeight: '1.5'}}>
                    <strong>GNOVA Points are game assets.</strong> They do not represent financial securities. 
                    Future conversion to tokens depends on community liquidity goals. 
                    Participation involves the purchase of virtual items which are non-refundable.
                    <strong>Not financial advice.</strong>
                </p>
            </div>
        )
    }
];

export const MissionTerminal: React.FC = () => {
    const { user } = useAuth();
    const [isReading, setIsReading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasClaimed, setHasClaimed] = useState(false); // Estado local
    const [loadingClaim, setLoadingClaim] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Cargar si ya reclamó la recompensa al montar
    useEffect(() => {
        if (user) {
            supabase.from('user_score')
                .select('has_read_whitepaper')
                .eq('user_id', user.id)
                .single()
                .then(({ data }) => {
                    if (data) setHasClaimed(data.has_read_whitepaper);
                });
        }
    }, [user]);

    // Scroll al top al cambiar de página
    useEffect(() => {
        if (modalRef.current) modalRef.current.scrollTop = 0;
    }, [currentPage, isReading]);

    const handleNext = () => {
        if (currentPage < WP_PAGES.length - 1) {
            setCurrentPage(curr => curr + 1);
        } else {
            // Si ya reclamó, solo cierra. Si no, no hace nada (el botón cambia)
            if (hasClaimed) {
                setIsReading(false);
                setCurrentPage(0);
            }
        }
    };

    const handleClaim = async () => {
        if (!user || loadingClaim) return;
        setLoadingClaim(true);

        const { data } = await supabase.rpc('claim_whitepaper_reward', { user_id_in: user.id });

        if (data === true) {
            alert("✅ MISSION ACCOMPLISHED!\n+5,000 Points added to your balance.");
            setHasClaimed(true);
            setIsReading(false);
            setCurrentPage(0);
        } else {
            alert("You have already claimed this reward.");
            setHasClaimed(true);
        }
        setLoadingClaim(false);
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px', textAlign: 'left' }}>
            
            {/* --- PANTALLA PRINCIPAL --- */}
            <h2 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                <Terminal size={24} color="#00F2FE" /> MISSION LOG
            </h2>

            <div className="glass-card">
                <h3 style={{color: '#fff', fontSize: '16px', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px'}}>
                    🚀 CURRENT TRAJECTORY
                </h3>
                
                {/* Roadmap Visual Simplificado */}
                <div style={{position: 'relative', paddingLeft: '20px', borderLeft: '2px solid #333'}}>
                    <div style={{marginBottom: '20px', position: 'relative'}}>
                        <div style={{position:'absolute', left:'-26px', background:'#0B0E14', padding:'2px'}}><CheckCircle2 size={16} color="#00F2FE"/></div>
                        <div style={{color: '#00F2FE', fontWeight: 'bold', fontSize: '14px'}}>PHASE 1: IGNITION</div>
                        <div style={{fontSize: '11px', color: '#aaa'}}>Mining & Economy Setup</div>
                    </div>
                    <div style={{marginBottom: '20px', position: 'relative'}}>
                        <div style={{position:'absolute', left:'-26px', background:'#0B0E14', padding:'2px'}}><Circle size={16} color="#555"/></div>
                        <div style={{color: '#888', fontWeight: 'bold', fontSize: '14px'}}>PHASE 2: ACCELERATION</div>
                        <div style={{fontSize: '11px', color: '#666'}}>NFTs & Staking</div>
                    </div>
                    <div style={{position: 'relative'}}>
                        <div style={{position:'absolute', left:'-26px', background:'#0B0E14', padding:'2px'}}><Circle size={16} color="#555"/></div>
                        <div style={{color: '#888', fontWeight: 'bold', fontSize: '14px'}}>PHASE 3 & 4</div>
                        <div style={{fontSize: '11px', color: '#666'}}>Launch & Airdrop</div>
                    </div>
                </div>

                <div style={{marginTop: '30px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', textAlign: 'center'}}>
                    <p style={{fontSize: '12px', color: '#aaa', marginBottom: '15px'}}>
                        {hasClaimed 
                            ? "Archive accessed. Information retained."
                            : "Read the classified Whitepaper to unlock a reward."}
                    </p>
                    
                    <button className="btn-neon" style={{width: '100%', gap: '10px'}} onClick={() => setIsReading(true)}>
                        <FileText size={18}/> 
                        {hasClaimed ? "REVIEW ARCHIVE" : "READ & EARN 5,000 PTS"}
                    </button>
                </div>
            </div>


            {/* --- MODAL LECTOR (WHITE PAPER READER) --- */}
            {isReading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.95)', zIndex: 5000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div ref={modalRef} className="glass-card" style={{
                        width: '100%', maxWidth: '500px', height: '70vh',
                        border: '1px solid #00F2FE', boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)',
                        display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto'
                    }}>
                        {/* Cabecera */}
                        <div style={{borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontFamily: 'monospace', fontSize: '12px', color: '#00F2FE'}}>
                                // DOC_v2.0
                            </div>
                            {/* Barra de Progreso (Puntitos) */}
                            <div style={{display: 'flex', gap: '5px'}}>
                                {WP_PAGES.map((_, idx) => (
                                    <div key={idx} style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: idx <= currentPage ? '#00F2FE' : '#333',
                                        transition: 'background 0.3s'
                                    }}/>
                                ))}
                            </div>
                            <button onClick={() => {setIsReading(false); setCurrentPage(0);}} style={{background:'none', border:'none', color:'#fff'}}><X size={20}/></button>
                        </div>

                        {/* Contenido */}
                        <div style={{flex: 1}}>
                            <h2 style={{color: '#fff', fontSize: '22px', marginTop: 0}}>{WP_PAGES[currentPage].title}</h2>
                            <div style={{color: '#ccc', fontSize: '14px', lineHeight: '1.6'}}>
                                {WP_PAGES[currentPage].content}
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        {currentPage === WP_PAGES.length - 1 && !hasClaimed ? (
                            <button className="btn-neon" 
                                style={{marginTop: '20px', width: '100%', background: 'linear-gradient(90deg, #FFD700, #FFA500)', color: '#000'}} 
                                onClick={handleClaim}
                                disabled={loadingClaim}
                            >
                                <Gift size={20} style={{marginRight:'8px'}}/>
                                {loadingClaim ? 'CLAIMING...' : 'CLAIM 5,000 POINTS'}
                            </button>
                        ) : (
                            <button className="btn-neon" style={{marginTop: '20px', width: '100%', justifyContent: 'space-between', padding: '0 20px'}} onClick={handleNext}>
                                <span>{currentPage === WP_PAGES.length - 1 ? 'CLOSE ARCHIVE' : 'NEXT PAGE'}</span>
                                <ChevronRight size={20}/>
                            </button>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};