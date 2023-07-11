require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const users = require("./users.json");
const os = require("os");

const openAIKey = process.env.GPT_KEY;

const puppeteerConfiguration = {
    headless: true,
    timeout: 90000,
    executablePath: os.platform() == "win32" ? "" : "/usr/bin/chromium-browser",
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // <- this one doesn't works in Windows
        "--disable-gpu",
    ],
};

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "browser_client",
    }),
    puppeteer: puppeteerConfiguration,
});

client.initialize();

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("GPT Zap iniciado com sucesso!");
    console.log(`Version: 1.1`);
});

// console.log(users)

const checkNumber = (number) => {
    const processedNumber = number.split("@")[0];

    const realUser = users.find((user) => user.number === processedNumber);
    return realUser ? true : false;
};

client.on("message", async (message) => {
    const isGroup = (await message.getChat()).isGroup;
    if (isGroup === true) {
        return;
    }

    const isAllowed = checkNumber(message.from);
    if (!isAllowed) {
        return;
    }

    const msg = message.body;

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
        await client.sendMessage(message.from, content);
        console.log(
            `${new Date()} - ${message.from}: ${msg.slice(0, 40) + "..."}`
        );
    } catch (error) {
        const errorMsg = `Error: ${error.response.data.error.message}, Status: ${error.response.status}`;
        await client.sendMessage(message.from, errorMsg);
        console.log(errorMsg);
    }
});
