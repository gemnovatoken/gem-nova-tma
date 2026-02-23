import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Tv, MessageCircle, Twitter, Youtube } from 'lucide-react';

interface DailyBountiesProps {
    setGlobalScore: (val: number | ((prev: number) => number)) => void;
}

interface CommunityTaskCardProps {
    title: string;
    desc: string;
    reward: number;
    status: 'idle' | 'pending' | 'claimed';
    isLoading: boolean;
    onGo: () => void;
    onVerify: () => void;
    icon: React.ReactNode;
    color: string;
}

export const DailyBounties: React.FC<DailyBountiesProps> = ({ setGlobalScore }) => {
    const { user } = useAuth();
    
    // Estados
    const [newsStatus, setNewsStatus] = useState<'idle' | 'pending' | 'claimed'>('idle');
    const [globalStatus, setGlobalStatus] = useState<'idle' | 'pending' | 'claimed'>('idle');
    const [twitterStatus, setTwitterStatus] = useState<'idle' | 'pending' | 'claimed'>('idle');
    const [youtubeStatus, setYoutubeStatus] = useState<'idle' | 'pending' | 'claimed'>('idle');
    const [claimingTask, setClaimingTask] = useState<string | null>(null);
    
    const clickTimestamps = useRef({ news: 0, global: 0, twitter: 0, youtube: 0 });

    const loadBountyData = useCallback(async () => {
        if(!user) return;
        const { data, error } = await supabase
            .from('user_score')
            .select('last_news_claim, last_global_claim, last_twitter_claim, last_youtube_claim')
            .eq('user_id', user.id)
            .single();
            
        if (!error && data) {
            const today = new Date().toISOString().split('T')[0];
            
            if (data.last_news_claim === today) setNewsStatus('claimed');
            if (data.last_global_claim === today) setGlobalStatus('claimed');
            if (data.last_twitter_claim === today) setTwitterStatus('claimed');
            if (data.last_youtube_claim === today) setYoutubeStatus('claimed');
        }
    }, [user]);

    useEffect(() => {
        loadBountyData();
    }, [loadBountyData]);

    const handleTaskGo = (taskType: 'news' | 'global' | 'twitter' | 'youtube', url: string) => {
        clickTimestamps.current[taskType] = Date.now();
        
        if (taskType === 'news') setNewsStatus('pending');
        else if (taskType === 'global') setGlobalStatus('pending');
        else if (taskType === 'twitter') setTwitterStatus('pending');
        else if (taskType === 'youtube') setYoutubeStatus('pending');

        // @ts-expect-error TypeScript no conoce WebApp
        if (window.Telegram?.WebApp?.openTelegramLink && !url.includes('youtube.com') && !url.includes('x.com')) {
             // @ts-expect-error Telegram API
             window.Telegram.WebApp.openTelegramLink(url);
        } else {
             window.open(url, '_blank');
        }
    };

    const handleTaskVerify = async (taskType: 'news' | 'global' | 'twitter' | 'youtube') => {
        if (!user || claimingTask) return;

        const timeSpentAway = Date.now() - clickTimestamps.current[taskType];

        if (timeSpentAway < 3000) {
            alert("⚠️ VERIFICATION FAILED!\n\nYou must engage with the content for at least 3 seconds to verify.");
            return;
        }

        setClaimingTask(taskType);
        
        try {
            const today = new Date().toISOString().split('T')[0];
            let columnToUpdate = '';
            let taskName = '';

            if (taskType === 'news') { columnToUpdate = 'last_news_claim'; taskName = 'Gnova News'; }
            else if (taskType === 'global') { columnToUpdate = 'last_global_claim'; taskName = 'Gnova Global'; }
            else if (taskType === 'twitter') { columnToUpdate = 'last_twitter_claim'; taskName = 'X (Twitter)'; }
            else if (taskType === 'youtube') { columnToUpdate = 'last_youtube_claim'; taskName = 'YouTube'; }
            
            await supabase.rpc('increment_score', { p_user_id: user.id, p_amount: 500 });
            await supabase.from('user_score').update({ [columnToUpdate]: today }).eq('user_id', user.id);
            
            if (taskType === 'news') setNewsStatus('claimed');
            else if (taskType === 'global') setGlobalStatus('claimed');
            else if (taskType === 'twitter') setTwitterStatus('claimed');
            else if (taskType === 'youtube') setYoutubeStatus('claimed');
            
            setGlobalScore(prev => prev + 500);
            
            if (window.navigator.vibrate) window.navigator.vibrate(200);
            alert(`✅ VERIFIED! +500 PTS added from ${taskName}.`);
        } catch {
            alert("Error verifying task.");
        } finally {
            setClaimingTask(null);
        }
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h2 style={{ color: '#fff', fontSize: '28px', margin: 0, textShadow: '0 0 15px rgba(0,242,254,0.3)' }}>BOUNTY BOARD</h2>
                <p style={{ color: '#00F2FE', fontSize: '12px', letterSpacing: '2px' }}>EARN POINTS EVERY 24H</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <CommunityTaskCard 
                    title="TG News" 
                    desc="@gnovaofiicialnews"
                    reward={500} status={newsStatus} isLoading={claimingTask === 'news'}
                    onGo={() => handleTaskGo('news', 'https://t.me/gnovaofiicialnews')}
                    onVerify={() => handleTaskVerify('news')}
                    icon={<Tv size={16} color="#00F2FE"/>} color="#00F2FE"
                />
                <CommunityTaskCard 
                    title="TG Global" 
                    desc="@gnovaglobal"
                    reward={500} status={globalStatus} isLoading={claimingTask === 'global'}
                    onGo={() => handleTaskGo('global', 'https://t.me/gnovaglobal')}
                    onVerify={() => handleTaskVerify('global')}
                    icon={<MessageCircle size={16} color="#E040FB"/>} color="#E040FB"
                />
                <CommunityTaskCard 
                    title="X (Twitter)" 
                    desc="@gnovatoken"
                    reward={500} status={twitterStatus} isLoading={claimingTask === 'twitter'}
                    onGo={() => handleTaskGo('twitter', 'https://x.com/gnovatoken')}
                    onVerify={() => handleTaskVerify('twitter')}
                    icon={<Twitter size={16} color="#1DA1F2"/>} color="#1DA1F2"
                />
                <CommunityTaskCard 
                    title="YouTube" 
                    desc="Anonymous"
                    reward={500} status={youtubeStatus} isLoading={claimingTask === 'youtube'}
                    onGo={() => handleTaskGo('youtube', 'https://youtube.com/')}
                    onVerify={() => handleTaskVerify('youtube')}
                    icon={<Youtube size={16} color="#FF0000"/>} color="#FF0000"
                />
            </div>
        </div>
    );
};

const CommunityTaskCard: React.FC<CommunityTaskCardProps> = ({ title, desc, reward, status, isLoading, onGo, onVerify, icon, color }) => {
    const renderButton = () => {
        if (isLoading) return <button disabled style={btnStyle('#555', 'transparent', '#555')}>...</button>;
        if (status === 'claimed') return <button disabled style={btnStyle('#4CAF50', 'transparent', '#4CAF50')}>DONE</button>;
        if (status === 'pending') return <button onClick={onVerify} className="btn-neon" style={btnStyle('#000', '#00F2FE', 'none', '0 0 5px rgba(0, 242, 254, 0.4)')}>VERIFY</button>;
        return <button onClick={onGo} className="btn-neon" style={btnStyle('#000', '#FFD700', 'none', '0 0 5px rgba(255, 215, 0, 0.4)')}>GO</button>;
    };

    const btnStyle = (textColor: string, bgColor: string, border: string, shadow: string = 'none'): React.CSSProperties => ({
        padding: '6px 0', width: '100%', fontSize: '10px', borderRadius: '6px', fontWeight: 'bold',
        color: textColor, background: bgColor, border: border !== 'none' ? `1px solid ${border}` : 'none',
        boxShadow: shadow, cursor: status === 'claimed' ? 'default' : 'pointer', display: 'flex', justifyContent: 'center', marginTop: '8px'
    });

    return (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '10px', background: status === 'claimed' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(255,255,255,0.03)', border: status === 'claimed' ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid #333', opacity: status === 'claimed' ? 0.6 : 1, transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ background: `rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.1)`, padding: '6px', borderRadius: '8px' }}>{icon}</div>
                <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                    <div style={{ fontSize: '9px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</div>
                </div>
            </div>
            <div style={{ fontSize: '10px', color: '#FFD700', textAlign: 'center', fontWeight: 'bold' }}>+{reward} PTS</div>
            {renderButton()}
        </div>
    );
};