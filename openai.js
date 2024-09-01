import OpenAI from "openai";


const ApiKey = process.env.ApiKey;
const orgId = process.env.orgId;


async function generateText(prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150, // ajuste conforme necessário
        });

        const text = response.choices[0].message.content;
        return text;
    } catch (error) {
        console.error('Erro ao gerar texto:', error);
        throw error;
    }
}

// Exemplo de uso da função
(async () => {
    const prompt = 'Qual é o impacto das mudanças climáticas?';
    const generatedText = await generateText(prompt);
    console.log('Texto gerado:', generatedText);
})();