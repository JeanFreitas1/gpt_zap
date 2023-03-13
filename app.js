require('dotenv').config()
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal')
const axios = require("axios")
const users = require("./users.json")

const api_key = process.env.GPT_KEY

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'browser_client',
    }),
    puppeteer: {
        headless: true,
        timeout: 90000,
        executablePath: '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu',
        ],
    },
});

client.initialize()

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});


client.on('ready', () => {
    console.log('GPT Zap iniciado com sucesso!');
    console.log(`Version: ${process.env.npm_package_version}`);
})

console.log(users)

const checkNumber = (number) => {
    const processedNumber = number.split('@')[0];

    const realUser = users.find(
        (user) => user.number === processedNumber,
    );
    return realUser ? true : false;
}

client.on('message', async (message) => {
    const isGroup = (await message.getChat()).isGroup;
    if (isGroup === true) {
        return;
    }

    const isAllowed = checkNumber(message.from)
    if (!isAllowed) {
        return;
    }

    const msg = message.body

    const body = {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: msg }],
        user: "GPT-Zap"
    }
    const { data } = await axios.post("https://api.openai.com/v1/chat/completions", body, { headers: { Authorization: `Bearer ${api_key}` } })
    const content = data.choices[0].message.content
    const response = content.slice(2)

    await client.sendMessage(message.from, response)

})
