const fs = require('fs');
const file = '/Users/ysf/Desktop/Code/Discord Bots/guildforge/commands/utility/channel.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the builder part
const builderStart = content.indexOf('// --- CLONE SUBCOMMAND GROUP ---');
const builderEndStr = '// --- Manage Subcommand ---';
const builderEnd = content.indexOf(builderEndStr);
if (builderStart !== -1 && builderEnd !== -1) {
    content = content.substring(0, builderStart) + content.substring(builderEnd);
}

// 2. Remove execute block
const execStart = content.indexOf('// === CLONE Subcommand Group =');
const execEndStr = '// === PRESET Subcommand ====';
const execEnd = content.indexOf(execEndStr);
if (execStart !== -1 && execEnd !== -1) {
    // Find the start of the comment block above execStart
    const actualStart = content.lastIndexOf('// ============================', execStart);
    const actualEnd = content.lastIndexOf('// ============================', execEnd);
    if (actualStart !== -1 && actualEnd !== -1) {
        content = content.substring(0, actualStart) + content.substring(actualEnd);
    }
}

// 3. Remove cloneChannel function
const funcStart = content.indexOf('/**\n * A helper function to clone a single channel');
const endOfFileStr = 'module.exports = {\n    data,\n    execute,\n};';
// find where cloneChannel ends, it's the last function in the file before module.exports
const funcEnd = content.indexOf('module.exports = {', funcStart);
if (funcStart !== -1 && funcEnd !== -1) {
    content = content.substring(0, funcStart) + content.substring(funcEnd);
}

fs.writeFileSync(file, content);
console.log("Done removing clone logic");
