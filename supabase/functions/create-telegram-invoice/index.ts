// 🔥 SOLUCIÓN NIVEL DIOS: Mapeo de tipos estricto para Deno (Cero 'any')
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Manejar la petición OPTIONS de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { packageId, packageName, starsCost, userId } = await req.json();

    // 1. Obtener el Token del Bot
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) throw new Error('Bot token is not set in environment variables.');

    // 2. Construir la factura 
    const invoicePayload = {
      title: `Gem Nova - ${packageName}`,
      description: `Unlock premium features in Gem Nova with ${packageName}.`,
      payload: JSON.stringify({ userId, packageId, starsCost }), 
      provider_token: "", // OBLIGATORIO: Para Stars, este campo debe ir vacío
      currency: "XTR",
      prices: [{ label: packageName, amount: starsCost }] 
    };

    // 3. Llamar a la API oficial de Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoicePayload)
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Telegram API Error:", data.description);
      throw new Error(`Telegram API rejected the request: ${data.description}`);
    }

    // 4. Devolver el link mágico a tu frontend
    return new Response(
      JSON.stringify({ success: true, invoiceLink: data.result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) errorMessage = error.message;
    else if (error && typeof error === 'object' && 'message' in error) errorMessage = String((error as Record<string, unknown>).message);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});