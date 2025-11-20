import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Users, Copy, Share2, Trophy } from 'lucide-react';

// 1. 👇 INTERFAZ PARA ELIMINAR EL "ANY"
// Definimos qué datos tiene un miembro del equipo
interface SquadMember {
    user_id: string; // O 'id' dependiendo de tu base de datos
    score: number;
    username?: string; // Opcional, por si no tenemos el nombre
}

export const SquadZone: React.FC = () => {
    const { user } = useAuth();
    
    // 2. 👇 Usamos la interfaz aquí
    const [friends, setFriends] = useState<SquadMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Link de invitación (Usamos el ID del usuario como ref)
    const inviteLink = `https://t.me/GemNovaBot/start?startapp=${user?.id}`;

    useEffect(() => {
        if (!user) return;

        const fetchSquad = async () => {
            // Buscamos usuarios que hayan sido referidos por mí
            // Nota: Esto asume que tienes una columna 'referred_by' en user_score
            // Si no la tienes aún, esto devolverá una lista vacía sin errores.
            const { data, error } = await supabase
                .from('user_score')
                .select('user_id, score') // Seleccionamos columnas específicas
                .eq('referred_by', user.id)
                .order('score', { ascending: false })
                .limit(10);

            if (error) {
                console.error("Error loading squad", error);
            } else if (data) {
                // 3. 👇 Casting seguro para TypeScript
                setFriends(data as unknown as SquadMember[]);
            }
            setLoading(false);
        };

        fetchSquad();
    }, [user]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px', textAlign: 'center' }}>
            
            {/* Encabezado */}
            <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '10px', display:'flex', justifyContent:'center', alignItems:'center', gap:'10px' }}>
                <Users size={32} /> SQUAD ZONE
            </h1>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '30px' }}>
                Invite friends and earn 10% of their earnings!
            </p>

            {/* Caja de Invitación */}
            <div className="glass-card" style={{ padding: '20px', border: '1px solid #00F2FE' }}>
                <div style={{ marginBottom: '10px', fontSize: '12px', color: '#00F2FE', fontWeight: 'bold' }}>YOUR INVITE LINK</div>
                
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', alignItems: 'center' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#fff', flex: 1 }}>
                        {inviteLink}
                    </div>
                    <button onClick={copyToClipboard} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#4CAF50' : '#fff' }}>
                        {copied ? 'COPIED!' : <Copy size={18} />}
                    </button>
                </div>

                <button className="btn-neon" style={{ width: '100%', marginTop: '15px', padding: '12px' }} onClick={() => window.open(`https://t.me/share/url?url=${inviteLink}&text=Join Gem Nova and earn crypto!`, '_blank')}>
                    <Share2 size={18} style={{ marginRight: '8px' }} /> SHARE LINK
                </button>
            </div>

            {/* Lista de Amigos */}
            <h3 style={{ textAlign: 'left', marginTop: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trophy size={20} color="#FFD700" /> YOUR RECRUITS
            </h3>

            <div className="glass-card" style={{ minHeight: '150px' }}>
                {loading ? (
                    <p style={{ marginTop: '50px', color: '#666' }}>Loading recruits...</p>
                ) : friends.length === 0 ? (
                    <div style={{ padding: '30px 0', opacity: 0.5 }}>
                        <Users size={40} color="#555" />
                        <p>No recruits yet. Share your link!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {friends.map((friend, index) => (
                            <div key={friend.user_id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                        {index + 1}
                                    </div>
                                    <div style={{ fontSize: '14px' }}>
                                        User {friend.user_id.slice(0, 4)}...
                                    </div>
                                </div>
                                <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '14px' }}>
                                    {friend.score.toLocaleString()} pts
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};