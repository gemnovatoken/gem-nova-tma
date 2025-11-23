import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

interface DebugState {
    env: 'pending' | 'success' | 'error' | 'warning';
    db: 'pending' | 'success' | 'error' | 'warning';
    edge: 'pending' | 'success' | 'error' | 'warning';
}

export const DebugScreen: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<DebugState>({
        env: 'pending',
        db: 'pending',
        edge: 'pending'
    });

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev, `> ${msg}`]);
    }, []);

    const runTests = useCallback(async () => {
        setLogs([]); // Limpiar logs anteriores
        
        // --- PRUEBA 1: VARIABLES DE ENTORNO ---
        addLog("1. Verificando Variables...");
        const url = import.meta.env.VITE_SUPABASE_URL as string;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
        
        if (url && key) {
            addLog(`✅ URL: ${url}`);
            addLog(`✅ Key: ${key.substring(0, 10)}...`);
            setStatus(prev => ({ ...prev, env: 'success' }));
        } else {
            addLog("❌ Faltan variables en Vercel.");
            setStatus(prev => ({ ...prev, env: 'error' }));
            return;
        }

        // --- PRUEBA 2: CONEXIÓN BASE DE DATOS ---
        addLog("2. Probando Supabase DB...");
        const { error } = await supabase.from('global_stats').select('*').limit(1);
        
        if (error) {
            addLog(`❌ Error DB: ${error.message} (${error.code})`);
            addLog("⚠️ Si es 401: Tus llaves están mal o desactivadas.");
            setStatus(prev => ({ ...prev, db: 'error' }));
        } else {
            addLog("✅ Conexión DB Exitosa.");
            setStatus(prev => ({ ...prev, db: 'success' }));
        }

        // --- PRUEBA 3: EDGE FUNCTION ---
        addLog("3. Probando Edge Function (tg-auth)...");
        const cleanUrl = url.replace(/\/$/, '');
        const funcUrl = `${cleanUrl}/functions/v1/tg-auth`;
        
        try {
            const res = await fetch(funcUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({}) 
            });

            const text = await res.text();
            addLog(`Respuesta HTTP: ${res.status}`);

            if (res.status === 404) {
                addLog("❌ Error 404: Función no encontrada.");
                setStatus(prev => ({ ...prev, edge: 'error' }));
            } else if (res.status === 500) {
                addLog("❌ Error 500: Fallo interno (Service Role Key).");
                setStatus(prev => ({ ...prev, edge: 'error' }));
            } else if (res.status === 400 || res.status === 200) {
                addLog("✅ Función Viva y Respondiendo.");
                setStatus(prev => ({ ...prev, edge: 'success' }));
            } else if (res.status === 401) {
                 addLog("❌ Error 401: Llave Anon rechazada.");
                 setStatus(prev => ({ ...prev, edge: 'error' }));
            } else {
                addLog(`⚠️ Estado: ${res.status} - ${text.substring(0, 50)}`);
                setStatus(prev => ({ ...prev, edge: 'warning' }));
            }
        } catch (e: unknown) { 
            const errorMessage = e instanceof Error ? e.message : String(e);
            addLog(`❌ Error de Red: ${errorMessage}`);
            setStatus(prev => ({ ...prev, edge: 'error' }));
        }
    }, [addLog]);

    // 4. SOLUCIÓN AL ERROR: Usamos setTimeout para evitar la actualización síncrona
    useEffect(() => {
        const timer = setTimeout(() => {
            runTests();
        }, 0);
        return () => clearTimeout(timer);
    }, [runTests]);

    return (
        <div style={{ padding: '20px', color: 'white', fontFamily: 'monospace', fontSize: '12px' }}>
            <h2>🔍 SISTEMA DE DIAGNÓSTICO</h2>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <StatusBadge label="ENV" status={status.env} />
                <StatusBadge label="DB" status={status.db} />
                <StatusBadge label="EDGE" status={status.edge} />
            </div>

            <div className="glass-card" style={{ background: '#111', padding: '15px', borderRadius: '10px', minHeight: '200px' }}>
                {logs.map((log, i) => <div key={i} style={{ marginBottom: '5px', color: log.includes('❌') ? '#FF5252' : (log.includes('✅') ? '#4CAF50' : '#ccc') }}>{log}</div>)}
            </div>

            <button onClick={runTests} className="btn-neon" style={{ marginTop: '20px', width: '100%' }}>RE-EJECUTAR TEST</button>
        </div>
    );
};

interface StatusBadgeProps {
    label: string;
    status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, status }) => {
    const color = status === 'success' ? '#4CAF50' : (status === 'error' ? '#FF5252' : '#FFD700');
    return (
        <div style={{ border: `1px solid ${color}`, color: color, padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold' }}>
            {label}
        </div>
    );
};