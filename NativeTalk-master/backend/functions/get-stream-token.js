// Edge Function: get-stream-token
// Gera tokens do GetStream Chat para usuários autenticados

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

module.exports = async function (request) {
    // Preflight CORS
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), {
                status: 401, headers: CORS_HEADERS
            });
        }

        const token = authHeader.replace('Bearer ', '');
        let userId;
        try {
            // Fix: Base64Url decoding (JWT payload uses - and _ instead of + and /)
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const padding = '='.repeat((4 - (base64.length % 4)) % 4);
            const decoded = atob(base64 + padding);
            const payload = JSON.parse(decoded);
            userId = payload.sub;
        } catch (e) {
            console.error('Erro ao decodificar token:', e);
            return new Response(JSON.stringify({ error: 'Token inválido', details: e.message }), {
                status: 401, headers: CORS_HEADERS
            });
        }

        if (!userId) {
            return new Response(JSON.stringify({ error: 'User ID não encontrado' }), {
                status: 400, headers: CORS_HEADERS
            });
        }

        const apiKey = 'qqq782vgbvwx';
        const apiSecret = 'vqcjdey2uetvbq7jqgqt8q33dtaxxfvhjndwkpb24kfd6jcktu9exbx9ksd5ahy7';

        const header = { alg: 'HS256', typ: 'JWT' };
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            user_id: userId.toString(),
            iat: now,
            exp: now + (60 * 60 * 24)
        };

        function base64url(str) {
            return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }

        const encodedHeader = base64url(JSON.stringify(header));
        const encodedPayload = base64url(JSON.stringify(payload));
        const signingInput = encodedHeader + '.' + encodedPayload;

        const encoder = new TextEncoder();
        const keyData = encoder.encode(apiSecret);
        const msgData = encoder.encode(signingInput);

        const cryptoKey = await crypto.subtle.importKey(
            'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
        const sigArray = new Uint8Array(signature);
        let sigStr = '';
        for (let i = 0; i < sigArray.length; i++) {
            sigStr += String.fromCharCode(sigArray[i]);
        }
        const encodedSignature = base64url(sigStr);

        const streamToken = signingInput + '.' + encodedSignature;

        return new Response(JSON.stringify({ token: streamToken }), {
            status: 200, headers: CORS_HEADERS
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: CORS_HEADERS
        });
    }
};
