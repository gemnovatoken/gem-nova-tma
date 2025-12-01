import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { X, Video, Gift } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

interface LuckyWheelProps {
    onClose: () => void;
    onUpdateScore: Dispatch<SetStateAction<number>>;
}

export const LuckyWheel: React.FC<LuckyWheelProps> = ({ onClose, onUpdateScore }) => {
    const { user } = useAuth();
    const [spinning, setSpinning] = useState(false);
    
    // Estado real de tickets
    const [tickets, setTickets] = useState(3); // Empezamos asumiendo 3
    const [rotation, setRotation] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const checkDaily = async () => {
                // Consultar tickets reales
                const { data } = await supabase.from('user_score')
                    .select('tickets, last_ticket_reset')
                    .eq('user_id', user.id)
                    .single();
                
                if (data) {
                    const today = new Date().toISOString().split('T')[0];
                    // Si es un día nuevo, reiniciamos visualmente a 3 (el backend lo hará al gastar)
                    if (data.last_ticket_reset !== today) setTickets(3);
                    else setTickets(data.tickets);
                }
                setLoading(false);
            };
            checkDaily();
        }
    }, [user]);

    const handleSpin = async (useTicket: boolean) => {
        if (spinning || !user) return;

        // 1. Si NO usa ticket (es por video), mostrar confirmación
        if (!useTicket) {
            if(!window.confirm("📺 Watch Ad to Spin?")) return;
            console.log("Showing Ad...");
            await new Promise(resolve => setTimeout(resolve, 2000)); 
        }

        setSpinning(true);
        
        // 2. Animación
        const newRotation = rotation + 1800 + Math.floor(Math.random() * 360);
        setRotation(newRotation);

        // 3. Llamada al Backend
        // is_free = TRUE significa "Gastar Ticket". FALSE significa "Por Video"
        const { data, error } = await supabase.rpc('spin_wheel', { user_id_in: user.id, is_free: useTicket });

        setTimeout(() => {
            setSpinning(false);
            if (!error && data !== null) {
                const reward = data;
                alert(`🎉 YOU WON ${reward.toLocaleString()} POINTS!`);
                onUpdateScore(s => s + reward);
                
                // Actualizar contador localmente
                if (useTicket) setTickets(prev => Math.max(0, prev - 1));
            } else {
                console.error(error);
                alert("❌ Connection Error. Try again.");
            }
        }, 3000);
    };

    const canSpinFree = tickets > 0;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 5000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{position:'absolute', top:20, right:20, cursor:'pointer', color:'#fff'}} onClick={onClose}>
                <X size={30} />
            </div>

            <h2 style={{color:'#E040FB', textShadow:'0 0 20px #E040FB', fontSize:'32px', marginBottom:'20px'}}>
                LUCKY SPIN
            </h2>

            {/* RUEDA VISUAL */}
            <div style={{
                width: '300px', height: '300px', borderRadius: '50%', border: '5px solid #fff',
                position: 'relative', overflow: 'hidden', transition: 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                transform: `rotate(${rotation}deg)`,
                background: 'conic-gradient(#FF512F 0% 25%, #00F2FE 25% 50%, #E040FB 50% 75%, #FFD700 75% 100%)',
                boxShadow: '0 0 50px rgba(224, 64, 251, 0.4)'
            }}>
                <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', width:'20px', height:'20px', background:'#fff', borderRadius:'50%', zIndex:10}}></div>
            </div>

            <div style={{
                width: 0, height: 0, borderLeft: '15px solid transparent', borderRight: '15px solid transparent',
                borderTop: '30px solid #fff', marginTop: '-10px', marginBottom:'30px', zIndex: 10
            }}></div>

            {/* BOTÓN DE ACCIÓN */}
            {loading ? (
                <div style={{color:'#fff'}}>Loading...</div>
            ) : (
                <button 
                    className="btn-neon"
                    disabled={spinning}
                    // Si tiene tickets, usa ticket (true). Si no, usa video (false).
                    onClick={() => handleSpin(canSpinFree)}
                    style={{
                        width: '80%', padding: '15px', fontSize: '18px', 
                        background: canSpinFree ? '#4CAF50' : '#E040FB', 
                        color: '#fff', border: 'none', fontWeight:'bold',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                    }}
                >
                    {spinning ? "SPINNING..." : (
                        canSpinFree ? (
                            <><Gift /> USE TICKET ({tickets})</>
                        ) : (
                            <><Video /> WATCH AD TO SPIN</>
                        )
                    )}
                </button>
            )}
        </div>
    );
};