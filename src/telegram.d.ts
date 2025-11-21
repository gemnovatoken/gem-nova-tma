// src/telegram.d.ts (Contenido Corregido)

interface TelegramWebApp {
    initData: string;
    
    // 👇 SOLUCIÓN: Agregamos la directiva de supresión para este 'any'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any 
    initDataUnsafe: any; 
    
    version: string;
    isClosingConfirmationEnabled: boolean;
    ready: () => void;
    expand: () => void;
    close: () => void;
}

interface Window {
    Telegram: {
        WebApp: TelegramWebApp;
    };
}