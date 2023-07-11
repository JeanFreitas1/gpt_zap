require("dotenv").config();

const axios = require("axios");

const openAIKey = process.env.GPT_KEY;

(async () => {
    const msg = "Defina pra mim ESG por favor?";

    const body = {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: "Você é um assistente muito prestativo.",
            },
            { role: "user", content: msg },
        ],
        user: "GPT-Zap",
    };

    try {
        const { data } = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            body,
            { headers: { Authorization: `Bearer ${openAIKey}` } }
        );
        const content = data.choices[0].message.content;
        console.log(content);
    } catch (error) {
        console.log(
            `Error: ${error.response.data.error.message}, Status: ${error.response.status}`
        );
    }
})();
