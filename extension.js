const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * 翻译数据存储
 * @type {Map<string, string>}
 */
let translations = new Map();

/**
 * 强制查找模式状态
 * @type {boolean}
 */
let forceMode = false;

/**
 * 翻译文件加载错误信息
 * @type {string | null}
 */
let translationLoadError = null;

/**
 * 状态栏项
 * @type {vscode.StatusBarItem}
 */
let statusBarItem;

/**
 * 输出通道
 * @type {vscode.OutputChannel}
 */
let outputChannel;

/**
 * 日志辅助函数
 */
const logger = {
    info: (message) => {
        if (outputChannel) {
            outputChannel.appendLine(`[INFO] ${message}`);
        }
    },
    warn: (message) => {
        if (outputChannel) {
            outputChannel.appendLine(`[WARN] ${message}`);
        }
    },
    error: (message, error) => {
        if (outputChannel) {
            if (error) {
                outputChannel.appendLine(`[ERROR] ${message}: ${error}`);
            } else {
                outputChannel.appendLine(`[ERROR] ${message}`);
            }
        }
    },
    debug: (message) => {
        if (outputChannel) {
            outputChannel.appendLine(`[DEBUG] ${message}`);
        }
    }
};

/**
 * 激活扩展
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // 创建输出通道
    outputChannel = vscode.window.createOutputChannel('i18n Hover Translator');
    logger.info('i18n Hover Translator 已激活');

    // 创建状态栏项
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'i18nHover.toggleForceMode';
    updateStatusBar();
    statusBarItem.show();

    // 加载翻译文件
    loadTranslations();

    // 注册悬停提供器
    const hoverProvider = vscode.languages.registerHoverProvider(
        ['javascript', 'typescript', 'csharp', 'java', 'python'],
        {
            provideHover(document, position, token) {
                // 检查是否被取消
                if (token.isCancellationRequested) {
                    return undefined;
                }
                
                return provideTranslationHover(document, position);
            }
        }
    );

    // 注册重新加载翻译文件的命令
    const reloadCommand = vscode.commands.registerCommand(
        'i18nHover.reloadTranslations',
        () => {
            loadTranslations();
            // 根据加载结果显示不同的消息
            if (translationLoadError) {
                vscode.window.showErrorMessage(`翻译文件加载失败: ${translationLoadError}`);
            } else {
                vscode.window.showInformationMessage(`翻译文件已成功加载，共 ${translations.size} 条翻译`);
            }
        }
    );

    // 注册切换强制模式的命令
    const toggleForceModeCommand = vscode.commands.registerCommand(
        'i18nHover.toggleForceMode',
        () => {
            forceMode = !forceMode;
            updateStatusBar();
            vscode.window.showInformationMessage(
                forceMode 
                    ? '✅ 已开启强制查找模式（所有字符串都会查找翻译）' 
                    : '❌ 已关闭强制查找模式（仅查找特定函数中的字符串）'
            );
        }
    );

    // 注册替换命令（用于中文反向查找后的快速替换）
    const replaceWithKeyCommand = vscode.commands.registerCommand(
        'i18nHover.replaceWithKey',
        async (args) => {
            try {
                const { document: docUri, line, startChar, endChar, oldText, newText } = args;
                
                // 获取文档
                const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(docUri));
                const editor = await vscode.window.showTextDocument(doc);
                
                // 获取当前行的文本
                const lineText = doc.lineAt(line).text;
                
                // 重新查找字符串的实际位置（因为可能已经被替换过）
                // 从原始位置附近查找
                let actualStart = -1;
                let actualEnd = -1;
                let actualQuote = '';
                
                // 向前搜索最近的引号
                for (let i = startChar - 1; i >= 0; i--) {
                    if (lineText[i] === '"' || lineText[i] === "'") {
                        actualQuote = lineText[i];
                        actualStart = i;
                        break;
                    }
                }
                
                // 如果找到了开始引号，向后找结束引号
                if (actualStart !== -1) {
                    for (let i = actualStart + 1; i < lineText.length; i++) {
                        if (lineText[i] === actualQuote) {
                            actualEnd = i;
                            break;
                        }
                    }
                }
                
                // 验证是否找到了有效的字符串
                if (actualStart === -1 || actualEnd === -1) {
                    vscode.window.showErrorMessage('无法找到要替换的字符串位置');
                    return;
                }
                
                // 使用 editor.edit 直接编辑
                await editor.edit(editBuilder => {
                    // 替换范围：包括引号
                    const range = new vscode.Range(
                        new vscode.Position(line, actualStart),
                        new vscode.Position(line, actualEnd + 1)
                    );
                    
                    // 替换文本（保持原有的引号类型）
                    const replacementText = `${actualQuote}${newText}${actualQuote}`;
                    editBuilder.replace(range, replacementText);
                });
                
                vscode.window.showInformationMessage(`✅ 已替换为翻译key: ${newText}`);
            } catch (error) {
                logger.error('替换失败', error);
                vscode.window.showErrorMessage(`替换失败: ${error.message}`);
            }
        }
    );

    // 注册显示输出通道命令
    const showOutputCommand = vscode.commands.registerCommand(
        'i18nHover.showOutput',
        () => {
            if (outputChannel) {
                outputChannel.show();
            }
        }
    );

    // 监听配置变化
    const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('i18nHover')) {
            loadTranslations();
        }
    });

    context.subscriptions.push(
        hoverProvider, 
        reloadCommand, 
        toggleForceModeCommand, 
        replaceWithKeyCommand,  // 替换命令
        showOutputCommand,      // 显示输出通道命令
        configWatcher, 
        statusBarItem,
        outputChannel           // 输出通道
    );
}

/**
 * 加载翻译文件
 */
function loadTranslations() {
    translations.clear();
    translationLoadError = null; // 重置错误状态

    const config = vscode.workspace.getConfiguration('i18nHover');
    let filePath = config.get('translationFilePath');

    // 如果未配置，尝试在工作区根目录查找多个默认路径
    if (!filePath) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            
            // 定义多个默认查找路径
            const defaultPaths = [
                path.join(workspaceRoot, 'translations.txt'),
                path.join(workspaceRoot, 'Library', 'EditorPerssitent', 'Locale','translation.txt')
            ];
            
            // 查找第一个存在的文件
            for (const defaultPath of defaultPaths) {
                if (fs.existsSync(defaultPath)) {
                    filePath = defaultPath;
                    logger.info(`使用默认路径: ${filePath}`);
                    break;
                }
            }
            
            // 如果没有找到任何文件
            if (!filePath) {
                const pathsList = defaultPaths.join('\n  - ');
                translationLoadError = `未找到翻译文件，已尝试以下路径:\n  - ${pathsList}`;
                logger.error('翻译文件不存在，已尝试路径: ' + JSON.stringify(defaultPaths));
                vscode.window.showWarningMessage(
                    `未找到翻译文件\n\n已尝试以下路径:\n${defaultPaths.map(p => `  • ${p}`).join('\n')}\n\n请创建文件或配置 translationFilePath`
                );
                updateStatusBar();
                return;
            }
        } else {
            translationLoadError = '未打开工作区文件夹';
            logger.error('翻译文件加载失败: 未打开工作区文件夹');
            updateStatusBar();
            return;
        }
    }

    if (!filePath) {
        translationLoadError = '未配置翻译文件路径';
        logger.error('翻译文件加载失败: 未配置翻译文件路径');
        updateStatusBar();
        return;
    }

    // 检查配置的路径是否存在
    if (!fs.existsSync(filePath)) {
        translationLoadError = `文件不存在: ${filePath}`;
        logger.error(`翻译文件不存在: ${filePath}`);
        vscode.window.showWarningMessage(`翻译文件不存在: ${filePath}\n请检查文件路径配置`);
        updateStatusBar();
        return;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            line = line.trim();
            
            // 跳过空行和注释
            if (!line || line.startsWith('#') || line.startsWith('//')) {
                return;
            }

            // 解析 key=value 格式
            const equalIndex = line.indexOf('=');
            if (equalIndex > 0) {
                const key = line.substring(0, equalIndex).trim();
                const value = line.substring(equalIndex + 1).trim();
                
                if (key && value) {
                    translations.set(key, value);
                }
            }
        });

        if (translations.size === 0) {
            translationLoadError = '翻译文件为空或格式错误';
            logger.warn('翻译文件为空或无有效内容');
            vscode.window.showWarningMessage('翻译文件为空或格式错误，请检查文件内容');
        } else {
            translationLoadError = null; // 清除错误状态
            logger.info(`成功加载 ${translations.size} 条翻译`);
        }
        updateStatusBar(); // 更新状态栏
    } catch (error) {
        translationLoadError = `读取失败: ${error.message}`;
        vscode.window.showErrorMessage(`加载翻译文件失败: ${error.message}`);
        logger.error('加载翻译文件错误', error);
        updateStatusBar();
    }
}

/**
 * 提供翻译悬停提示
 * @param {vscode.TextDocument} document 
 * @param {vscode.Position} position 
 * @returns {vscode.Hover | null}
 */
function provideTranslationHover(document, position) {
    const config = vscode.workspace.getConfiguration('i18nHover');

    // 检查是否启用
    if (!config.get('enabled')) {
        return undefined;
    }

    // 检查翻译文件是否加载失败
    if (translationLoadError) {
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**⚠️ 翻译文件加载失败**\n\n`);
        markdown.appendMarkdown(`**错误信息：** ${translationLoadError}\n\n`);
        markdown.appendMarkdown(`请检查：\n`);
        markdown.appendMarkdown(`1. 翻译文件路径是否正确\n`);
        markdown.appendMarkdown(`2. 翻译文件是否存在\n`);
        markdown.appendMarkdown(`3. 翻译文件格式是否正确（key=value）\n\n`);
        markdown.appendMarkdown(`[点击重新加载翻译文件](command:i18nHover.reloadTranslations)`);
        markdown.isTrusted = true;
        return new vscode.Hover(markdown);
    }

    // 获取当前单词范围
    const range = document.getWordRangeAtPosition(position);
    if (!range) {
        return null;
    }

    // 扩展范围以包含引号
    const line = document.lineAt(position.line);
    const lineText = line.text;
    
    let startChar = range.start.character;
    let endChar = range.end.character;

    // 向前查找引号
    while (startChar > 0 && lineText[startChar - 1] !== '"' && lineText[startChar - 1] !== "'") {
        startChar--;
    }
    
    // 向后查找引号
    while (endChar < lineText.length && lineText[endChar] !== '"' && lineText[endChar] !== "'") {
        endChar++;
    }

    // 检查是否在引号内
    if (startChar > 0 && endChar < lineText.length) {
        const beforeChar = lineText[startChar - 1];
        const afterChar = lineText[endChar];
        
        if ((beforeChar === '"' && afterChar === '"') || (beforeChar === "'" && afterChar === "'")) {
            const key = lineText.substring(startChar, endChar);
            
            // 🔑 强制模式：跳过函数匹配和key格式检查
            if (forceMode) {
                // 先检查是否是中文字符串，如果是则进行反向查找
                if (isChineseString(key)) {
                    const matchedKeys = findKeysByValue(key);
                    
                    if (matchedKeys.length > 0) {
                        // 找到匹配的key，显示可替换的选项
                        const markdown = new vscode.MarkdownString();
                        markdown.supportHtml = true;
                        markdown.isTrusted = true;
                        
                        markdown.appendMarkdown(`**🔍 中文反向查找** （强制模式）\n\n`);
                        if (matchedKeys.length > maxResults) {
                            markdown.appendMarkdown(`**${key} 有${matchedKeys.length}个匹配的翻译 key(显示前${maxResults}个):** \n\n`);
                        }
                        else{
                            markdown.appendMarkdown(`**${key} 有${matchedKeys.length}个匹配的翻译 key：**\n\n`);
                        }
                        
                        // 获取配置的最大显示数量
                        const maxResults = config.get('maxReverseResults', 5);
                        const keysToShow = matchedKeys.slice(0, maxResults);
                        
                        for (let i = 0; i < keysToShow.length; i++) {
                            const matchedKey = keysToShow[i];
                            const matchedValue = translations.get(matchedKey);
                            
                            // 截断过长的翻译（超过50字符）
                            let displayValue = matchedValue || '';
                            if (displayValue.length > 50) {
                                displayValue = displayValue.substring(0, 50) + '...';
                            }
                            // 转义特殊字符
                            displayValue = displayValue
                                .replace(/\\/g, '\\\\')
                                .replace(/\n/g, ' ')
                                .replace(/\r/g, '');
                            
                            // 创建可点击的命令链接
                            const args = encodeURIComponent(JSON.stringify({
                                document: document.uri.toString(),
                                line: position.line,
                                startChar: startChar,
                                endChar: endChar,
                                oldText: key,
                                newText: matchedKey,
                                quoteChar: beforeChar
                            }));
                            const commandUri = `command:i18nHover.replaceWithKey?${args}`;
                            
                            markdown.appendMarkdown(`${i + 1}. [\`${matchedKey}\`](${commandUri}) → *${displayValue}*\n`);
                        }
                        
                        markdown.appendMarkdown(`\n---\n\n`);
                        markdown.appendMarkdown(`💡 *点击 key 可快速替换当前中文字符串*`);
                        
                        return new vscode.Hover(markdown);
                    }
                }
                
                // 如果不是中文，则正常查找翻译
                // 直接查找翻译
                const translation = translations.get(key);
                
                if (translation) {
                    // 处理换行符：将 \n 转换为 Markdown 换行
                    let displayValue = translation.replace(/\\n/g, '  \n');
                    
                    // 转义 HTML 特殊字符，防止干扰我们的 span 标签
                    displayValue = displayValue
                        .replace(/&/g, '&amp;')   // 先转义 &
                        .replace(/</g, '&lt;')    // 转义 <
                        .replace(/>/g, '&gt;');   // 转义 >
                    
                    // 创建醒目的美化内容
                    const markdown = new vscode.MarkdownString();
                    markdown.supportHtml = true;  // 启用 HTML，允许彩色样式
                    markdown.isTrusted = true;    // 标记为可信
                    
                    markdown.appendMarkdown(`**🌐 多语言预览** （强制模式）\n\n`);
                    markdown.appendMarkdown(`**Key : ${key}**\n\n`);
                    markdown.appendMarkdown(`**Value :**\n\n`);
                    markdown.appendMarkdown(`<span style="color: rgb(78, 201, 80); font-size: 14px; font-weight: 600;">${displayValue}</span>\n\n`);
                    markdown.appendMarkdown(`---\n\n`);
                    
                    return new vscode.Hover(markdown);
                } else {
                    // 找不到翻译，也显示提示
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown(`**🌐 多语言预览** （强制模式）\n\n`);
                    markdown.appendMarkdown(`**Key : ${key}**\n\n`);
                    markdown.appendMarkdown(`**⚠️ 无此字符串对应的多语言翻译**\n\n`);
                    markdown.appendMarkdown(`---\n\n`);
                    
                    return new vscode.Hover(markdown);
                }
            }
            
            // 正常模式：检查字符串前面是否有特定的函数调用
            const textBeforeString = lineText.substring(0, startChar - 1);
            const functionPatterns = config.get('functionPatterns');
            
            // 如果没有配置函数模式，则不处理
            if (!functionPatterns || functionPatterns.length === 0) {
                return undefined;  // 返回 undefined 表示不处理，避免 VS Code 等待
            }
            
            // 检查是否匹配任意一个函数模式
            let isFunctionMatched = false;
            for (const pattern of functionPatterns) {
                try {
                    const regex = new RegExp(pattern);
                    if (regex.test(textBeforeString)) {
                        isFunctionMatched = true;
                        break;
                    }
                } catch (error) {
                    logger.error(`无效的函数匹配正则表达式: ${pattern}`, error);
                }
            }
            
            // 如果不在特定函数调用中，不处理
            if (!isFunctionMatched) {
                return undefined;  // 正常模式下，不在函数中的字符串不处理
            }
            
            // 在函数调用中，检查key是否匹配正则表达式
            const keyPattern = config.get('keyPattern');
            const additionalPatterns = config.get('additionalPatterns') || [];
            
            // 将主要模式和额外模式合并
            const allPatterns = [keyPattern, ...additionalPatterns];
            
            // 检查是否匹配任意一个模式
            let isMatched = false;
            for (const pattern of allPatterns) {
                try {
                    const regex = new RegExp(pattern);
                    if (regex.test(key)) {
                        isMatched = true;
                        break;
                    }
                } catch (error) {
                    logger.error(`无效的正则表达式: ${pattern}`, error);
                }
            }
            
            if (isMatched) {
                // 匹配key规则，查找翻译
                const translation = translations.get(key);
                
                if (translation) {
                    // 处理换行符：将 \n 转换为 Markdown 换行
                    let displayValue = translation.replace(/\\n/g, '  \n');
                    
                    // 转义 HTML 特殊字符，防止干扰我们的 span 标签
                    displayValue = displayValue
                        .replace(/&/g, '&amp;')   // 先转义 &
                        .replace(/</g, '&lt;')    // 转义 <
                        .replace(/>/g, '&gt;');   // 转义 >
                    
                    // 创建醒目的美化内容
                    const markdown = new vscode.MarkdownString();
                    markdown.supportHtml = true;  // 启用 HTML，允许彩色样式
                    markdown.isTrusted = true;    // 标记为可信
                    
                    markdown.appendMarkdown(`**🌐 多语言预览** \n\n`);
                    
                    markdown.appendMarkdown(`**Key : ${key}**\n\n`);
                    // 使用醒目的绿色显示翻译内容
                    markdown.appendMarkdown(`**Value :**\n\n`);
                    markdown.appendMarkdown(`<span style="color: rgb(78, 201, 80); font-size: 14px; font-weight: 600;">${displayValue}</span>\n\n`);
                    
                    markdown.appendMarkdown(`---\n\n`);
                    
                    return new vscode.Hover(markdown);
                } else {
                    // 匹配key规则，但找不到翻译
                    const markdown = new vscode.MarkdownString();
                    markdown.supportHtml = true;
                    markdown.isTrusted = true;
                    
                    markdown.appendMarkdown(`**🌐 多语言预览** \n\n`);
                    markdown.appendMarkdown(`**Key : ${key}**\n\n`);
                    markdown.appendMarkdown(`**⚠️ 未找到对应的翻译**\n\n`);
                    markdown.appendMarkdown(`---\n\n`);
                    markdown.appendMarkdown(`*该key不存在于翻译文件中*`);
                    
                    return new vscode.Hover(markdown);
                }
            } else {
                // 不匹配key规则，但在函数调用中 - 检查是否为中文字符串
                if (isChineseString(key)) {
                    const matchedKeys = findKeysByValue(key);
                    
                    if (matchedKeys.length > 0) {
                        // 找到匹配的key，显示可替换的选项
                        const markdown = new vscode.MarkdownString();
                        markdown.supportHtml = true;
                        markdown.isTrusted = true;
                        
                        markdown.appendMarkdown(`**🔍 中文反向查找**（在函数调用中）\n\n`);
                        
                        // 获取配置的最大显示数量
                        const maxResults = config.get('maxReverseResults', 5);
                        const keysToShow = matchedKeys.slice(0, maxResults);
                        
                        if (matchedKeys.length > maxResults) {
                            markdown.appendMarkdown(`**${key} 有${matchedKeys.length}个匹配的翻译 key(显示前${maxResults}个):** \n\n`);
                        }
                        else{
                            markdown.appendMarkdown(`**${key} 有${matchedKeys.length}个匹配的翻译 key：**\n\n`);
                        }
                        
                        for (let i = 0; i < keysToShow.length; i++) {
                            const matchedKey = keysToShow[i];
                            const matchedValue = translations.get(matchedKey);
                            
                            // 截断过长的翻译（超过50字符）
                            let displayValue = matchedValue || '';
                            if (displayValue.length > 50) {
                                displayValue = displayValue.substring(0, 50) + '...';
                            }
                            // 转义特殊字符
                            displayValue = displayValue
                                .replace(/\\/g, '\\\\')
                                .replace(/\n/g, ' ')
                                .replace(/\r/g, '');
                            
                            // 创建可点击的命令链接
                            const args = encodeURIComponent(JSON.stringify({
                                document: document.uri.toString(),
                                line: position.line,
                                startChar: startChar,
                                endChar: endChar,
                                oldText: key,
                                newText: matchedKey,
                                quoteChar: beforeChar
                            }));
                            const commandUri = `command:i18nHover.replaceWithKey?${args}`;
                            
                            markdown.appendMarkdown(`${i + 1}. [\`${matchedKey}\`](${commandUri}) → *${displayValue}*\n`);
                        }
                        
                        markdown.appendMarkdown(`\n---\n\n`);
                        markdown.appendMarkdown(`💡 *点击 key 可快速替换当前中文字符串*`);
                        
                        return new vscode.Hover(markdown);
                    }
                }
            }
        }
    }

    // 返回 undefined 表示不处理，避免 VS Code 等待其他 Provider
    return undefined;
}

/**
 * 更新状态栏显示
 */
function updateStatusBar() {
    // 优先显示翻译文件加载错误
    if (translationLoadError) {
        statusBarItem.text = "$(error) i18n 加载错误";
        statusBarItem.tooltip = `翻译文件加载失败\n错误: ${translationLoadError}\n\n点击重新加载翻译文件`;
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        statusBarItem.command = 'i18nHover.reloadTranslations'; // 点击重新加载
        return;
    }

    // 恢复正常的命令
    statusBarItem.command = 'i18nHover.toggleForceMode';

    if (forceMode) {
        statusBarItem.text = "$(search) i18n 强制模式";
        statusBarItem.tooltip = "多语言强制查找模式已开启\n点击或按快捷键关闭";
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
        statusBarItem.text = "$(check) i18n 正常模式";
        statusBarItem.tooltip = `多语言正常模式\n已加载 ${translations.size} 条翻译\n\n点击或按快捷键开启强制查找`;
        statusBarItem.backgroundColor = undefined;
    }
}

/**
 * 检查字符串是否为纯中文（可包含标点符号）
 * @param {string} str 
 * @returns {boolean}
 */
function isChineseString(str) {
    if (!str || str.length === 0) return false;
    
    // 中文字符范围：\u4e00-\u9fff（常用汉字）
    // 中英文标点：\u3000-\u303f（中文标点）、常见英文标点
    // 允许空格、数字、字母占少部分
    const chineseRegex = /[\u4e00-\u9fff]/;
    const hasChinesechars = chineseRegex.test(str);
    
    if (!hasChinesechars) return false;
    
    // 至少包含中文，且主要是中文、标点、空格
    // 允许混合一些英文、数字（如：获得<color=#fcac41>传说装备</color>）
    const validCharsRegex = /^[\u4e00-\u9fff\u3000-\u303fa-zA-Z0-9\s\.,!?;:'"()（）【】《》""''、。，！？；：…—\-_/\\<>=&#\{\}\[\]]*$/;
    return validCharsRegex.test(str);
}

/**
 * 根据翻译值反向查找对应的key（模糊匹配）
 * @param {string} value 翻译值
 * @returns {string[]} 匹配的key列表（按相似度排序）
 */
function findKeysByValue(value) {
    const matchedKeys = [];
    const normalizedValue = value.toLowerCase().trim();
    
    for (const [key, translation] of translations.entries()) {
        const normalizedTranslation = translation.toLowerCase().trim();
        
        // 完全匹配或包含匹配
        if (normalizedTranslation === normalizedValue || 
            normalizedTranslation.includes(normalizedValue) ||
            normalizedValue.includes(normalizedTranslation)) {
            
            // 计算编辑距离（相似度）
            const distance = levenshteinDistance(normalizedValue, normalizedTranslation);
            matchedKeys.push({ key, distance, translation });
        }
    }
    
    // 按相似度排序：距离越小越相似
    matchedKeys.sort((a, b) => {
        // 首先按编辑距离排序
        if (a.distance !== b.distance) {
            return a.distance - b.distance;
        }
        // 编辑距离相同，按key长度排序（短的在前）
        return a.key.length - b.key.length;
    });
    
    // 只返回key列表
    return matchedKeys.map(item => item.key);
}

/**
 * 计算两个字符串的编辑距离（Levenshtein距离）
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} 编辑距离
 */
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    
    // 创建二维数组
    const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
    
    // 初始化
    for (let i = 0; i <= len1; i++) dp[i][0] = i;
    for (let j = 0; j <= len2; j++) dp[0][j] = j;
    
    // 动态规划
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,      // 删除
                    dp[i][j - 1] + 1,      // 插入
                    dp[i - 1][j - 1] + 1   // 替换
                );
            }
        }
    }
    
    return dp[len1][len2];
}



/**
 * 停用扩展
 */
function deactivate() {
    translations.clear();
    if (outputChannel) {
        outputChannel.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};


