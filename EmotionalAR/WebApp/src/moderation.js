/**
 * Utility to check if text is appropriate using Groq API.
 */
export async function checkModeration(text) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        console.warn('[Moderation] No API key found. Skipping check.');
        return true;
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a content moderator. Analyze the user text and respond with ONLY "TRUE" if the content is appropriate for a public space (no hate speech, explicit content, or severe toxicity) and "FALSE" if it is inappropriate. No other words.'
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0,
                max_tokens: 10
            })
        });

        const data = await response.json();
        const result = data.choices[0].message.content.trim().toUpperCase();
        console.log('[Moderation] Result:', result);
        return result.includes('TRUE');
    } catch (err) {
        console.error('[Moderation] API error:', err);
        return true;
    }
}

/**
 * Extracts a structured "Day in the Life" summary from user text.
 */
export async function extractLifeSummary(text) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) return text;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'Convert the following description of a person\'s life into a structured, chronological "Day in the Life" routine. Use bullet points and focus on time or sequence. Be concise.'
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.5,
                max_tokens: 300
            })
        });

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (err) {
        console.error('[LifeSummary] error:', err);
        return text;
    }
}
