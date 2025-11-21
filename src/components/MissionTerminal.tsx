import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Terminal, ShieldAlert, FileText, X, ChevronRight, CheckCircle2, Circle, Gift, ArrowRightLeft, PieChart, Flame, RefreshCcw } from 'lucide-react';

const WP_PAGES = [
    {
        title: "1.0 THE MISSION",
        content: (
            <>
                <p className="wp-text">The universe of Telegram Mini Apps is cluttered with empty promises. <strong>Gem Nova Token</strong> changes the paradigm.</p>
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #00F2FE', color: '#00F2FE', textAlign:'center', fontWeight:'bold'}}>
                    "We do not measure progress in Days.<br/>
                    We measure progress in REVENUE %.<br/>
                    YOU control the launch date."
                </div>
            </>
        )
    },
    {
        title: "2.0 POINTS vs TOKENS",
        content: (
            <>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px', color:'#FFD700'}}>
                    <ArrowRightLeft /> <strong>THE CONVERSION PROTOCOL</strong>
                </div>
                <p className="wp-text">To avoid confusion, understand the vital difference:</p>
                <ul style={{fontSize: '12px', paddingLeft: '15px', color: '#aaa', lineHeight:'1.8'}}>
                    <li>🪨 <strong>GEM POINTS (Now):</strong> Raw ore mined in-game. Infinite supply. Used to upgrade your account. **Has NO monetary value yet.**</li>
                    <li>📀 <strong>$GNOVA (Future):</strong> The on-chain token. Fixed supply. Valuable and tradable on exchanges.</li>
                </ul>
                <p className="wp-text" style={{marginTop:'15px', padding:'10px', background:'rgba(255,0,0,0.1)', borderLeft:'3px solid #FF0055'}}>
                    <strong>CRITICAL:</strong> 1 Point does NOT equal 1 Token. At the TGE, points convert to Tokens based on your **Account Level**. Higher levels get significantly better ratios.
                </p>
            </>
        )
    },
    // 👇 PÁGINA 3 ACTUALIZADA: NUEVOS % Y BUYBACK
    {
        title: "3.0 TOKENOMICS PROTOCOL",
        content: (
            <>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px', color:'#bd00ff'}}>
                    <PieChart /> <strong>DEFLATIONARY & SUSTAINABLE</strong>
                </div>
                
                <div style={{background:'rgba(0,0,0,0.5)', padding:'15px', borderRadius:'8px', border:'1px solid #bd00ff', marginBottom:'20px'}}>
                    <div style={{textAlign:'center', fontWeight:'bold', color:'#fff', marginBottom:'15px', fontSize:'16px'}}>
                        TOTAL SUPPLY: <span style={{color:'#00F2FE'}}>1,000,000,000 $GNOVA</span>
                    </div>
                    <table style={{width:'100%', fontSize:'12px', borderCollapse:'collapse'}}>
                        <tbody>
                            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                                <td style={{padding:'8px', color:'#00F2FE'}}>Community (Mining/Games/Bulk)</td>
                                <td style={{padding:'8px', textAlign:'right', fontWeight:'bold'}}>70%</td>
                                <td style={{padding:'8px', textAlign:'right', color:'#aaa'}}>700M</td>
                            </tr>
                            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                                <td style={{padding:'8px', color:'#FFD700'}}>Liquidity (Listing)</td>
                                <td style={{padding:'8px', textAlign:'right', fontWeight:'bold'}}>15%</td>
                                <td style={{padding:'8px', textAlign:'right', color:'#aaa'}}>150M</td>
                            </tr>
                            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                                <td style={{padding:'8px', color:'#FF0055'}}>Partnerships</td>
                                <td style={{padding:'8px', textAlign:'right', fontWeight:'bold'}}>10%</td>
                                <td style={{padding:'8px', textAlign:'right', color:'#aaa'}}>100M</td>
                            </tr>
                            <tr>
                                <td style={{padding:'8px', color:'#888'}}>Team (Vested)</td>
                                <td style={{padding:'8px', textAlign:'right', fontWeight:'bold'}}>5%</td>
                                <td style={{padding:'8px', textAlign:'right', color:'#aaa'}}>50M</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px', color:'#4CAF50'}}>
                    <RefreshCcw /> <strong>REVENUE BUYBACKS</strong>
                </div>
                 <p className="wp-text" style={{marginBottom:'15px'}}>
                    We pledge to use a portion of App Revenue (Ads/Bulk) to buy $GNOVA from the open market post-launch. These buybacks will occur at strategic, unannounced intervals to defend the price floor.
                </p>

                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px', color:'#FF5722'}}>
                    <Flame /> <strong>THE BLACK HOLE</strong>
                </div>
                 <p className="wp-text">
                    Points spent in-game are permanently burned, reducing inflation before the launch.
                </p>
            </>
        )
    },
    {
        title: "4.0 DYNAMIC ROADMAP",
        content: (
            <>
                <p className="wp-text">This Roadmap is bound by <strong>REVENUE MILESTONES</strong>, not dates.</p>
                <ul style={{listStyle: 'none', padding: 0, fontSize: '12px', lineHeight:'2'}}>
                    <li>🌑 <strong>PHASE 1: EXTRACTION (Current)</strong><br/><span style={{color:'#888'}}>- Mine Raw Points & Build Liquidity base.</span></li>
                    <li>🌓 <strong>PHASE 2 & 3: REFINEMENT</strong><br/><span style={{color:'#888'}}>- Burn Points on NFTs to secure high-tier allocation.</span></li>
                    <li>🌕 <strong>PHASE 4: TRANSMUTATION (Launch)</strong><br/><span style={{color:'#00F2FE'}}>- TGE. Points convert to $GNOVA based on Level.</span></li>
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
    const [hasClaimed, setHasClaimed] = useState(false);
    const [loadingClaim, setLoadingClaim] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (modalRef.current) modalRef.current.scrollTop = 0;
    }, [currentPage, isReading]);

    const handleNext = () => {
        if (currentPage < WP_PAGES.length - 1) {
            setCurrentPage(curr => curr + 1);
        } else {
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
            <h2 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                <Terminal size={24} color="#00F2FE" /> MISSION LOG
            </h2>

            <div className="glass-card">
                <h3 style={{color: '#fff', fontSize: '16px', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px'}}>
                    🚀 CURRENT TRAJECTORY
                </h3>
                <div style={{position: 'relative', paddingLeft: '20px', borderLeft: '2px solid #333'}}>
                    <div style={{marginBottom: '20px', position: 'relative'}}>
                        <div style={{position:'absolute', left:'-26px', background:'#0B0E14', padding:'2px'}}><CheckCircle2 size={16} color="#00F2FE"/></div>
                        <div style={{color: '#00F2FE', fontWeight: 'bold', fontSize: '14px'}}>PHASE 1: EXTRACTION</div>
                        <div style={{fontSize: '11px', color: '#aaa'}}>Mine Points (Raw Ore)</div>
                    </div>
                    <div style={{marginBottom: '20px', position: 'relative'}}>
                        <div style={{position:'absolute', left:'-26px', background:'#0B0E14', padding:'2px'}}><Circle size={16} color="#555"/></div>
                        <div style={{color: '#888', fontWeight: 'bold', fontSize: '14px'}}>PHASE 2: REFINEMENT</div>
                        <div style={{fontSize: '11px', color: '#666'}}>Upgrade Account & NFTs</div>
                    </div>
                    <div style={{position: 'relative'}}>
                        <div style={{position:'absolute', left:'-26px', background:'#0B0E14', padding:'2px'}}><Circle size={16} color="#555"/></div>
                        <div style={{color: '#888', fontWeight: 'bold', fontSize: '14px'}}>PHASE 4: TRANSMUTATION</div>
                        <div style={{fontSize: '11px', color: '#666'}}>Points → $GNOVA Token</div>
                    </div>
                </div>

                <div style={{marginTop: '30px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', textAlign: 'center'}}>
                    <p style={{fontSize: '12px', color: '#aaa', marginBottom: '15px'}}>
                        {hasClaimed ? "Archive accessed. Information retained." : "Read the classified Tokenomics to unlock a reward."}
                    </p>
                    <button className="btn-neon" style={{width: '100%', gap: '10px'}} onClick={() => setIsReading(true)}>
                        <FileText size={18}/> {hasClaimed ? "REVIEW ARCHIVE" : "READ & EARN 5,000 PTS"}
                    </button>
                </div>
            </div>

            {isReading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.95)', zIndex: 5000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div ref={modalRef} className="glass-card" style={{
                        width: '100%', maxWidth: '500px', height: '75vh',
                        border: '1px solid #00F2FE', boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)',
                        display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto'
                    }}>
                        <div style={{borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontFamily: 'monospace', fontSize: '12px', color: '#00F2FE'}}>
                                // CLASSIFIED_DOC :: PAGE {currentPage + 1}/{WP_PAGES.length}
                            </div>
                            <div style={{display: 'flex', gap: '5px'}}>
                                {WP_PAGES.map((_, idx) => (
                                    <div key={idx} style={{width: '8px', height: '8px', borderRadius: '50%', background: idx <= currentPage ? '#00F2FE' : '#333', transition: 'background 0.3s'}}/>
                                ))}
                            </div>
                            <button onClick={() => {setIsReading(false); setCurrentPage(0);}} style={{background:'none', border:'none', color:'#fff'}}><X size={20}/></button>
                        </div>
                        <div style={{flex: 1}}>
                            <h2 style={{color: '#fff', fontSize: '22px', marginTop: 0}}>{WP_PAGES[currentPage].title}</h2>
                            <div style={{color: '#ccc', fontSize: '14px', lineHeight: '1.6'}}>
                                {WP_PAGES[currentPage].content}
                            </div>
                        </div>
                        {currentPage === WP_PAGES.length - 1 && !hasClaimed ? (
                            <button className="btn-neon" style={{marginTop: '20px', width: '100%', background: 'linear-gradient(90deg, #FFD700, #FFA500)', color: '#000'}} onClick={handleClaim} disabled={loadingClaim}>
                                <Gift size={20} style={{marginRight:'8px'}}/>{loadingClaim ? 'CLAIMING...' : 'CLAIM 5,000 POINTS'}
                            </button>
                        ) : (
                            <button className="btn-neon" style={{marginTop: '20px', width: '100%', justifyContent: 'space-between', padding: '0 20px'}} onClick={handleNext}>
                                <span>{currentPage === WP_PAGES.length - 1 ? 'CLOSE ARCHIVE' : 'NEXT PAGE'}</span><ChevronRight size={20}/>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};