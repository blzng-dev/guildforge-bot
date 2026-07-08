const fs = require('fs');

function refactorFile(filePath, commandName, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    const messages = JSON.parse(fs.readFileSync('utils/messages.json', 'utf8'));

    messages[commandName] = messages[commandName] || {};

    let modified = false;

    for (const [keyPath, stringTemplate, replaceRegex, replacementStr] of replacements) {
        // Add to messages.json
        const keys = keyPath.split('.');
        let current = messages;
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = current[keys[i]] || {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = stringTemplate;

        // Replace in file
        if (content.match(replaceRegex)) {
            content = content.replace(replaceRegex, replacementStr);
            modified = true;
        } else {
            console.warn(`Regex not matched in ${filePath}:`, replaceRegex);
        }
    }

    if (!content.includes("const { getMessage } = require(\"../../utils/messages\");")) {
        content = content.replace(
            /const \{[^\}]+\} = require\("discord\.js"\);/,
            match => match + '\nconst { getMessage } = require("../../utils/messages");'
        );
    }

    if (modified) {
        fs.writeFileSync(filePath, content);
        fs.writeFileSync('utils/messages.json', JSON.stringify(messages, null, 4));
        console.log(`Refactored ${filePath}`);
    }
}

const roleReplacements = [
    [
        'role.error_no_permission',
        'you do not have permission to manage server roles.',
        /content:\s*"you do not have permission to manage server roles\."/,
        `content: getMessage('role.error_no_permission')`
    ],
    [
        'role.create_bulk.error_no_names',
        'No valid role names provided.',
        /content:\s*"No valid role names provided\."/,
        `content: getMessage('role.create_bulk.error_no_names')`
    ],
    [
        'role.create_bulk.error_limit',
        'Please limit to 50 roles at a time.',
        /content:\s*"Please limit to 50 roles at a time\."/,
        `content: getMessage('role.create_bulk.error_limit')`
    ],
    [
        'role.create_bulk.success',
        'Successfully created {createdCount} roles.',
        /let resultMsg = `Successfully created \$\{createdCount\} roles\.`;/,
        `let resultMsg = getMessage('role.create_bulk.success', { createdCount });`
    ],
    [
        'role.create_bulk.failed',
        '\nFailed to create {failedCount} roles:\n{failedNames}',
        /resultMsg \+= `\\nFailed to create \$\{failedCount\} roles:\\n\$\{failedNames\.map\(f => `\- \$\{f\}`\)\.join\('\\n'\)\}`;/,
        `resultMsg += getMessage('role.create_bulk.failed', { failedCount, failedNames: failedNames.map(f => \`- \$\{f\}\`).join('\\n') });`
    ],
    [
        'role.create.error_invalid_color',
        'Invalid hex color format.',
        /content:\s*"Invalid hex color format\."/,
        `content: getMessage('role.create.error_invalid_color')`
    ],
    [
        'role.create.position_error_everyone',
        '\n*(Cannot position below @everyone)*',
        /positionMessage = "\\n\*\(\Cannot position below @everyone\)\*";/,
        `positionMessage = getMessage('role.create.position_error_everyone');`
    ],
    [
        'role.create.position_error_hierarchy_below',
        '\n*(Could not position below {roleName} due to hierarchy)*',
        /positionMessage = `\\n\*\(\Could not position below \$\{belowRole\.name\} due to hierarchy\)\*`;/,
        `positionMessage = getMessage('role.create.position_error_hierarchy_below', { roleName: belowRole.name });`
    ],
    [
        'role.create.position_success_below',
        '\n*(Positioned below {roleName})*',
        /positionMessage = `\\n\*\(\Positioned below \$\{belowRole\.name\}\)\*`;/,
        `positionMessage = getMessage('role.create.position_success_below', { roleName: belowRole.name });`
    ],
    [
        'role.create.position_error_hierarchy_above',
        '\n*(Could not position above {roleName} due to hierarchy)*',
        /positionMessage = `\\n\*\(\Could not position above \$\{aboveRole\.name\} due to hierarchy\)\*`;/,
        `positionMessage = getMessage('role.create.position_error_hierarchy_above', { roleName: aboveRole.name });`
    ],
    [
        'role.create.position_success_above',
        '\n*(Positioned above {roleName})*',
        /positionMessage = `\\n\*\(\Positioned above \$\{aboveRole\.name\}\)\*`;/,
        `positionMessage = getMessage('role.create.position_success_above', { roleName: aboveRole.name });`
    ],
    [
        'role.create.success',
        'Successfully created role: <@&{roleId}>{positionMessage}',
        /content: `Successfully created role: <@&\$\{targetRole\.id\}>\$\{positionMessage\}`/,
        `content: getMessage('role.create.success', { roleId: targetRole.id, positionMessage })`
    ],
    [
        'role.create.error_unknown',
        'There was an error trying to create the role.',
        /content:\s*"There was an error trying to create the role\."/,
        `content: getMessage('role.create.error_unknown')`
    ],
    [
        'role.preset.error_invalid',
        'Invalid preset selected.',
        /content:\s*"Invalid preset selected\."/,
        `content: getMessage('role.preset.error_invalid')`
    ],
    [
        'role.preset.success',
        'Successfully created role <@&{roleId}> using the "{presetName}" preset.',
        /content: `Successfully created role <@&\$\{targetRole\.id\}> using the "\$\{preset\.name\}" preset\.`/,
        `content: getMessage('role.preset.success', { roleId: targetRole.id, presetName: preset.name })`
    ],
    [
        'role.preset.error_unknown',
        'There was an error trying to create the preset role.',
        /content:\s*"There was an error trying to create the preset role\."/,
        `content: getMessage('role.preset.error_unknown')`
    ],
    [
        'role.list.error_empty',
        'There are no roles in this server (besides @everyone).',
        /content:\s*"There are no roles in this server \\(besides @everyone\\)\."/,
        `content: getMessage('role.list.error_empty')`
    ],
    [
        'role.list.success',
        '**Server Roles ({count}):**\n{roleString}',
        /content: `\*\*Server Roles \(\$\{roleList\.length\}\):\*\*\\n\$\{roleString\}`/,
        `content: getMessage('role.list.success', { count: roleList.length, roleString })`
    ],
    [
        'role.list.success_file',
        'There are too many roles ({count}) to display directly. Here is a list as a file:',
        /content: `There are too many roles \(\$\{roleList\.length\}\) to display directly\. Here is a list as a file:`/,
        `content: getMessage('role.list.success_file', { count: roleList.length })`
    ],
    [
        'role.list.error_unknown',
        'An error occurred while trying to list the roles.',
        /content:\s*"An error occurred while trying to list the roles\."/,
        `content: getMessage('role.list.error_unknown')`
    ],
    [
        'role.color.error_read',
        'Error reading/parsing `colorRoles.json`. Make sure file exists & is valid JSON.',
        /content:\s*"Error reading\/parsing `colorRoles\.json`\. Make sure file exists & is valid JSON\."/,
        `content: getMessage('role.color.error_read')`
    ],
    [
        'role.color.error_invalid_json',
        '`colorRoles.json` does not contain a valid JSON array.',
        /content:\s*"`colorRoles\.json` does not contain a valid JSON array\."/,
        `content: getMessage('role.color.error_invalid_json')`
    ],
    [
        'role.color.results',
        'Color role creation finished.\n- Created: {createdCount}\n- Existed: {skippedCount}\n- Failed: {errorCount}',
        /let replyMessage = `Color role creation finished\.\\n\- Created: \$\{createdCount\}\\n\- Existed: \$\{skippedCount\}\\n\- Failed: \$\{errorCount\}`;/,
        `let replyMessage = getMessage('role.color.results', { createdCount, skippedCount, errorCount });`
    ]
];

refactorFile('commands/slash/role.js', 'role', roleReplacements);
