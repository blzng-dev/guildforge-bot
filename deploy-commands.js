require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const token = process.env.TOKEN;
const clientId = process.env.CLIENTID;
const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

const EPHEMERAL_OPTION = {
    type: 5, // Boolean option type
    name: "ephemeral",
    description: "Whether the response should be ephemeral (default: true)",
    required: false,
};

function ensureEphemeralInOptions(optionsArray) {
    if (!Array.isArray(optionsArray)) return;
    const hasSubcommands = optionsArray.some(opt => opt.type === 1 || opt.type === 2);
    if (hasSubcommands) {
        for (const opt of optionsArray) {
            if (opt.type === 1) {
                if (!Array.isArray(opt.options)) opt.options = [];
                ensureEphemeralInOptions(opt.options);
            } else if (opt.type === 2) {
                if (Array.isArray(opt.options)) {
                    for (const subOpt of opt.options) {
                        if (subOpt.type === 1) {
                            if (!Array.isArray(subOpt.options)) subOpt.options = [];
                            ensureEphemeralInOptions(subOpt.options);
                        }
                    }
                }
            }
        }
    } else {
        if (!optionsArray.some(opt => opt.name === "ephemeral")) {
            optionsArray.push(EPHEMERAL_OPTION);
        }
    }
}

function processCommandJson(cmdJson) {
    if (cmdJson.type && cmdJson.type !== 1) {
        return cmdJson;
    }
    if (!Array.isArray(cmdJson.options)) cmdJson.options = [];
    ensureEphemeralInOptions(cmdJson.options);
    return cmdJson;
}

for (const folder of commandFolders) {
    const currentPath = path.join(foldersPath, folder);
    // Check if the item is a directory before proceeding
    if (fs.statSync(currentPath).isDirectory()) {
        // Grab all the command files from the commands directory you created earlier
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs
            .readdirSync(commandsPath)
            .filter((file) => file.endsWith(".js"));
        // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ("data" in command && "execute" in command) {
                commands.push(processCommandJson(command.data.toJSON()));
            } else {
                console.log(
                    `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
                );
            }
        }
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
    try {
        console.log(
            `Started refreshing ${commands.length} application (/) commands.`
        );

        // Clear any orphaned test guild commands that were causing duplicates
        await rest.put(Routes.applicationGuildCommands(clientId, '1019267320285237249'), {
            body: [],
        });
        
        // The put method is used to fully refresh all commands globally with the current set
        const data = await rest.put(Routes.applicationCommands(clientId), {
            body: commands,
        });

        console.log(
            `Successfully reloaded ${data.length} application (/) commands.`
        );
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();
