module.exports = async function (request) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        const body = await request.json();
        const { text, source, target } = body;

        if (!text) {
            return new Response(JSON.stringify({ error: "Text is required" }), {
                status: 400,
                headers
            });
        }

        // Simple default if same lang
        if (source === target) {
            return new Response(JSON.stringify({
                translation: {
                    text: text,
                    language: target
                }
            }), {
                status: 200,
                headers
            });
        }

        // Usando MyMemory API (gratuita, sem chave, rate-limited)
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
        const resp = await fetch(url);

        if (!resp.ok) {
            throw new Error("Translation API failed");
        }

        const data = await resp.json();
        const translated = data?.responseData?.translatedText || text;

        return new Response(JSON.stringify({
            translation: {
                text: translated,
                language: target
            }
        }), {
            status: 200,
            headers
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers
        });
    }
};

