const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    try {
        const appEmojis = await client.application.emojis.fetch();
        console.log("Application Emojis:", appEmojis.map(e => e.name));
        
        const guildEmojis = client.emojis.cache;
        console.log("Guild Emojis:", guildEmojis.map(e => e.name).filter(name => name === 'x'));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});

client.login(process.env.TOKEN);
