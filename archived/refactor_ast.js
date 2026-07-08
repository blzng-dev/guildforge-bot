const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const filePath = process.argv[2];
const commandName = process.argv[3];
if (!filePath || !commandName) {
    console.error("Usage: node refactor_ast.js <filepath> <commandName>");
    process.exit(1);
}

let code = fs.readFileSync(filePath, 'utf8');
const messagesPath = './utils/messages.json';
const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));

if (!messages[commandName]) {
    messages[commandName] = {};
}

let counter = 1;

function addMessage(key, templateString) {
    let current = messages;
    const keys = key.split('.');
    for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = current[keys[i]] || {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = templateString;
}

const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: []
});

let modified = false;
let hasGetMessageImport = false;

traverse(ast, {
    VariableDeclarator(path) {
        if (path.node.id.type === 'ObjectPattern') {
            const properties = path.node.id.properties;
            const hasGetMessage = properties.some(p => p.key && p.key.name === 'getMessage');
            if (hasGetMessage) {
                hasGetMessageImport = true;
            }
        } else if (path.node.id.type === 'Identifier' && path.node.id.name === 'getMessage') {
            hasGetMessageImport = true;
        }
    },
    CallExpression(path) {
        // Find interaction.reply, interaction.editReply, interaction.followUp, progressManager.finish, progressManager.update, reporter.finish
        const callee = path.node.callee;
        let isTarget = false;
        if (callee.type === 'MemberExpression') {
            if (callee.property.type === 'Identifier') {
                const propName = callee.property.name;
                if (['reply', 'editReply', 'followUp', 'finish'].includes(propName)) {
                    isTarget = true;
                }
            }
        }

        if (isTarget) {
            // Usually argument 0 is an object { content: "..." } or just a string
            const arg = path.node.arguments[0];
            if (!arg) return;

            let stringNode = null;
            let objectPropertyPath = null;

            if (arg.type === 'ObjectExpression') {
                const contentPropPath = path.get('arguments.0.properties').find(p => p.node.key && p.node.key.name === 'content');
                if (contentPropPath) {
                    stringNode = contentPropPath.node.value;
                    objectPropertyPath = contentPropPath.get('value');
                }
            } else if (arg.type === 'StringLiteral' || arg.type === 'TemplateLiteral') {
                stringNode = arg;
                objectPropertyPath = path.get('arguments.0');
            }

            if (stringNode && (stringNode.type === 'StringLiteral' || stringNode.type === 'TemplateLiteral')) {
                // Ignore if already getMessage()
                if (stringNode.type === 'CallExpression' && stringNode.callee.name === 'getMessage') return;

                let templateString = '';
                let variables = [];

                if (stringNode.type === 'StringLiteral') {
                    templateString = stringNode.value;
                } else if (stringNode.type === 'TemplateLiteral') {
                    // Reconstruct template string to standard format {varName}
                    for (let i = 0; i < stringNode.quasis.length; i++) {
                        templateString += stringNode.quasis[i].value.raw;
                        if (i < stringNode.expressions.length) {
                            const expr = stringNode.expressions[i];
                            let varName = `var${i + 1}`;
                            if (expr.type === 'Identifier') varName = expr.name;
                            else if (expr.type === 'MemberExpression' && expr.property.type === 'Identifier') varName = expr.property.name;
                            
                            // Prevent empty or weird variable names
                            varName = varName.replace(/[^a-zA-Z0-9_]/g, '');
                            if (!varName) varName = `var${i+1}`;

                            templateString += `{${varName}}`;
                            variables.push(t.objectProperty(t.identifier(varName), expr));
                        }
                    }
                }

                // Skip very short or non-user facing strings
                if (templateString.length < 3 || templateString === 'Success') return;

                // Create a key
                const key = `${commandName}.msg_${counter++}`;
                addMessage(key, templateString);

                // Create getMessage AST node
                let callArgs = [t.stringLiteral(key)];
                if (variables.length > 0) {
                    callArgs.push(t.objectExpression(variables));
                }
                const newCall = t.callExpression(t.identifier('getMessage'), callArgs);
                
                objectPropertyPath.replaceWith(newCall);
                modified = true;
            }
        }
    }
});

if (modified) {
    let outputCode = generate(ast, {}, code).code;
    
    if (!hasGetMessageImport) {
        outputCode = 'const { getMessage } = require("../../utils/messages");\n' + outputCode;
    }

    fs.writeFileSync(filePath, outputCode);
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 4));
    console.log(`Refactored ${filePath}`);
} else {
    console.log(`No modifications for ${filePath}`);
}
