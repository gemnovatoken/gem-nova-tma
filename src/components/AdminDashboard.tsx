import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { 
    ShieldAlert, TrendingUp, Users, DollarSign, 
    RefreshCw, X, PlayCircle, Gamepad2, Zap, Bot 
} from 'lucide-react';

interface AdminStats {
    total_users: number;
    new_users_today: number;
    revenue_today: number;
    points_sold_today: number;
    videos_total_today: number;
    videos_boost_today: number;
    videos_arcade_today: number;
    videos_bot_today: number;
}

interface Cheater {
    username: string;
    score: number;
    energy: number;
    limit_level: number;
}

// Interfaz para las props de la tarjeta
interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number | undefined;
    sub: string;
    color: string;
}

export const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [cheaters, setCheaters] = useState<Cheater[]>([]);
    const [loading, setLoading] = useState(false);

    // Definimos la función con useCallback para que sea estable
    const fetchData = useCallback(async () => {
        setLoading(true);
        
        // 1. Cargar Estadísticas Generales
        const { data: statsData, error } = await supabase.rpc('get_admin_stats');
        if (statsData && statsData.length > 0) setStats(statsData[0]);
        if (error) console.error("Admin Stats Error:", error);

        // 2. Cargar Posibles Tramposos
        const { data: cheatData } = await supabase.rpc('get_suspicious_users');
        if (cheatData) setCheaters(cheatData);

        setLoading(false);
    }, []);

    useEffect(() => {
        // SOLUCIÓN AL ERROR DE SETSTATE: 
        // Usamos setTimeout para que la actualización del estado ocurra en el siguiente ciclo
        const initialLoad = setTimeout(() => {
            fetchData();
        }, 0);
        
        // Intervalo de auto-refresco
        const interval = setInterval(() => {
            fetchData();
        }, 30000); 

        return () => {
            clearTimeout(initialLoad);
            clearInterval(interval);
        };
    }, [fetchData]);

    return (
        <div style={{
            minHeight: '100vh', background: '#050505', padding: '30px',
            color: '#0f0', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto'
        }}>
            {/* HEADER */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px', borderBottom:'1px solid #333', paddingBottom:'15px'}}>
                <h1 style={{margin:0, fontSize:'24px', display:'flex', alignItems:'center', gap:'10px', textShadow:'0 0 10px #0f0'}}>
                    <ShieldAlert color="#0f0"/> ADMIN COMMAND CENTER
                </h1>
                <div style={{display:'flex', gap:'15px'}}>
                    <button onClick={fetchData} style={{background:'none', border:'none', color: loading ? '#555' : '#0f0', cursor:'pointer'}}>
                        <RefreshCw size={24} className={loading ? "spin" : ""} />
                    </button>
                    <button onClick={onClose} style={{background:'none', border:'none', color:'red', cursor:'pointer'}}>
                        <X size={24}/>
                    </button>
                </div>
            </div>

            {/* SECCIÓN 1: FINANZAS Y USUARIOS */}
            <h3 style={{color:'#fff', borderLeft:'4px solid #FFD700', paddingLeft:'10px', marginBottom:'15px'}}>FINANCE & GROWTH</h3>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px', marginBottom:'40px'}}>
                <StatCard icon={<Users color="#00F2FE"/>} label="Total Miners" value={stats?.total_users} sub={`+${stats?.new_users_today} Active Today`} color="#00F2FE"/>
                <StatCard icon={<DollarSign color="#FFD700"/>} label="Revenue (TON)" value={`${stats?.revenue_today || 0} TON`} sub="Today's Sales" color="#FFD700"/>
                <StatCard icon={<TrendingUp color="#4CAF50"/>} label="Points Sold" value={stats?.points_sold_today?.toLocaleString()} sub="Via BulkBuy" color="#4CAF50"/>
            </div>

            {/* SECCIÓN 2: VIDEO ADS METRICS */}
            <h3 style={{color:'#fff', borderLeft:'4px solid #E040FB', paddingLeft:'10px', marginBottom:'15px'}}>AD REVENUE STREAM</h3>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'15px', marginBottom:'40px'}}>
                <StatCard icon={<PlayCircle color="#fff"/>} label="Total Ads Today" value={stats?.videos_total_today} sub="All Sources" color="#fff"/>
                <StatCard icon={<Bot color="#E040FB"/>} label="Bot Manager" value={stats?.videos_bot_today} sub="Manager Hire" color="#E040FB"/>
                <StatCard icon={<Zap color="#FF512F"/>} label="Boosts/Refill" value={stats?.videos_boost_today} sub="Energy & Turbo" color="#FF512F"/>
                <StatCard icon={<Gamepad2 color="#00F2FE"/>} label="Arcade Games" value={stats?.videos_arcade_today} sub="Extra Tickets" color="#00F2FE"/>
            </div>

            {/* SECCIÓN 3: SEGURIDAD */}
            <h3 style={{color:'red', borderLeft:'4px solid red', paddingLeft:'10px', marginBottom:'15px'}}>SECURITY ALERTS</h3>
            <div style={{background:'rgba(255,0,0,0.05)', border:'1px solid #333', borderRadius:'10px', padding:'15px'}}>
                {cheaters.length === 0 ? (
                    <div style={{color:'#666', fontStyle:'italic'}}>System Secure. No anomalies detected.</div>
                ) : (
                    <table style={{width:'100%', textAlign:'left', borderCollapse:'collapse'}}>
                        <thead>
                            <tr style={{color:'#666', borderBottom:'1px solid #333'}}>
                                <th style={{padding:'10px'}}>User</th>
                                <th>Lvl</th>
                                <th>Energy</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cheaters.map((c, i) => (
                                <tr key={i} style={{borderBottom:'1px solid #222', color:'#ccc'}}>
                                    <td style={{padding:'10px', fontWeight:'bold', color:'#fff'}}>{c.username}</td>
                                    <td>{c.limit_level}</td>
                                    <td style={{color:'red'}}>{Math.floor(c.energy)}</td>
                                    <td><span style={{background:'red', color:'black', padding:'2px 6px', borderRadius:'4px', fontSize:'10px', fontWeight:'bold'}}>OVERFLOW</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// Componente de Tarjeta Pequeño (SOLUCIÓN AL ERROR ANY: Usamos la interfaz StatCardProps)
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, color }) => (
    <div style={{background:'#111', padding:'20px', borderRadius:'12px', border:`1px solid ${color}30`, position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', right:-10, top:-10, opacity:0.1, transform:'scale(2.5)'}}>{icon}</div>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
            {icon}
            <span style={{fontSize:'12px', color:'#aaa', fontWeight:'bold', letterSpacing:'1px'}}>{label.toUpperCase()}</span>
        </div>
        <div style={{fontSize:'28px', fontWeight:'900', color:'#fff', marginBottom:'5px'}}>{value || 0}</div>
        <div style={{fontSize:'10px', color:color}}>{sub}</div>
    </div>
);