const fs = require('fs');
const path = require('path');

const messagesPath = path.join(__dirname, 'messages.json');
let messagesData = {};
let botClient = null;

function setClient(client) {
    botClient = client;
    // Pre-fetch application emojis so they are cached
    if (client.application && typeof client.application.emojis.fetch === 'function') {
        client.application.emojis.fetch().catch(console.error);
    }
}

function loadMessages() {
    try {
        const data = fs.readFileSync(messagesPath, 'utf8');
        messagesData = JSON.parse(data);
    } catch (e) {
        console.error('Failed to load messages.json:', e);
    }
}

// Initial load
loadMessages();

/**
 * Get a formatted message from messages.json
 * @param {string} keyPath - The path to the message (e.g., 'emoji.add.success')
 * @param {object} variables - Variables to inject into the message { count: 5 }
 * @returns {string} The formatted message
 */
function getMessage(keyPath, variables = {}) {
    const keys = keyPath.split('.');
    let result = messagesData;
    
    for (const key of keys) {
        if (result[key] === undefined) {
            console.warn(`Missing message key: ${keyPath}`);
            return `[Missing String: ${keyPath}]`;
        }
        result = result[key];
    }
    
    if (typeof result !== 'string') {
        console.warn(`Message key does not resolve to string: ${keyPath}`);
        return `[Invalid String: ${keyPath}]`;
    }
    
    let formatted = result;
    for (const [vKey, vVal] of Object.entries(variables)) {
        // Replace all occurrences of {key}
        const regex = new RegExp(`\\{${vKey}\\}`, 'g');
        formatted = formatted.replace(regex, vVal);
    }
    
    if (botClient) {
        formatted = formatted.replace(/:([a-zA-Z0-9_]+):/g, (match, emojiName) => {
            // Check application emojis first
            let emoji = botClient.application?.emojis?.cache?.find(e => e.name === emojiName);
            if (!emoji) {
                // Fallback to all guilds' cached emojis
                emoji = botClient.emojis?.cache?.find(e => e.name === emojiName);
            }
            if (emoji) {
                return emoji.toString(); // outputs <:name:id>
            }
            return match;
        });
    }

    return formatted;
}

module.exports = {
    getMessage,
    reloadMessages: loadMessages,
    setClient
};
