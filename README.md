# i18n Hover Translator

一个智能的 VS Code 扩展，用于在鼠标悬停时显示多语言翻译，支持中文反向查找和一键快速替换。

## ✨ 功能特性

- 🎯 **智能函数识别**：只识别特定函数调用中的字符串（如 `Language.GetContent("key")`）
- 🔍 **强制查找模式**：快捷键切换，查找任意字符串的翻译（`Ctrl+Shift+H`）
- 🇨🇳 **中文反向查找**：悬停中文字符串，自动显示对应的翻译key，一键替换
- ✨ **三元表达式支持**：智能识别 `condition ? "key1" : "key2"` 中的key
- 🌐 **鼠标悬停显示**：实时显示翻译内容，支持多行文本和富文本标签
- 🔧 **高度可配置**：自定义函数列表、key匹配规则等
- 📝 **简单文件格式**：`key=value` 格式，每行一条
- 🔄 **热加载**：支持重新加载，无需重启
- 🎮 **游戏项目优化**：支持纯数字key、游戏富文本标签
- 📊 **状态栏显示**：实时显示当前工作模式和加载状态
- 🎨 **醒目显示**：翻译内容绿色高亮，清晰易读
- 🚨 **错误提示**：翻译文件加载失败时，在状态栏和悬停提示中显示明确的错误信息

## 🚀 快速开始

### 1. 安装扩展

从 VS Code 扩展市场搜索 "i18n Hover Translator" 并安装。

### 2. 准备翻译文件

创建 `translations.txt` 文件（放在项目根目录）：

```txt
# 注释行
BTN_OK=确定
BTN_CANCEL=取消
MSG_SUCCESS=操作成功
ui_main_menu=主菜单
100020=金币
account_bind_tips=该账号已绑定其他角色
```

### 3. 配置扩展（可选）

打开 VS Code 设置（`Ctrl+,`），搜索 "i18n Hover"：

- **Translation File Path**：翻译文件路径（默认自动查找根目录的 `translations.txt`）
- **Key Pattern**：key匹配规则（默认支持字母、数字、下划线、横线、点号）
- **Function Patterns**：函数匹配列表（已内置15个常用函数）

### 4. 开始使用

```javascript
// 悬停在 "BTN_OK" 上查看翻译
Language.GetContent("BTN_OK");  // 显示：确定

// 悬停在中文上查看可用的key
GameUtil.ShowTips("确定");  // 显示：BTN_OK → 确定, 101154 → 确定...
// 点击key即可快速替换
```

## 🎯 核心功能详解

### 1. 智能函数识别

只在特定函数调用中识别翻译key，避免误报。

**✅ 会显示翻译**：
```javascript
Language.GetContent("BTN_OK");        // ✅
GameUtil.ShowTips("MSG_SUCCESS");     // ✅
translate("USER_NAME");               // ✅
```

**❌ 不会显示**（不在函数中）：
```javascript
const str = "BTN_OK";                 // ❌
const message = "MSG_SUCCESS";        // ❌
```

### 2. 中文反向查找（⭐ 核心功能）

悬停在中文字符串上，自动查找对应的翻译key，并可一键替换。

**示例**：
```javascript
// 原始代码（硬编码中文）
GameUtil.ShowTips("确定");

// 悬停在"确定"上，显示：
// 🔍 中文反向查找
// 
// 中文内容： 确定
// 
// 找到 3 个匹配的翻译 key：
// 
// 1. BTN_OK → 确定
// 2. 101154 → 确定
// 3. btn-ok → 确定
// 
// 💡 点击 key 可快速替换

// 点击 BTN_OK 后，自动替换为：
GameUtil.ShowTips("BTN_OK");
```

**特点**：
- 🎯 **智能排序**：使用编辑距离算法，越相似的排在越前
- 👀 **显示翻译**：每个key后面显示对应的翻译内容，方便判断
- 🔄 **一键替换**：点击即可替换，支持连续替换
- ✅ **保留引号**：自动保持原有的引号类型

### 3. 强制查找模式

快捷键 `Ctrl+Shift+H` 切换模式，查找任意字符串的翻译。

**正常模式**（默认）：
- 只识别函数调用中的字符串
- 状态栏显示：`$(circle-outline) i18n 正常`

**强制模式**：
- 识别所有引号包起来的字符串
- 状态栏显示：`$(search) i18n 强制`（黄色背景）

```javascript
// 正常模式
Language.GetContent("BTN_OK");  // ✅ 显示翻译
const str = "BTN_OK";           // ❌ 不显示

// 强制模式（按 Ctrl+Shift+H 切换）
Language.GetContent("BTN_OK");  // ✅ 显示翻译
const str = "BTN_OK";           // ✅ 也显示翻译
```

### 4. 三元表达式支持

智能识别三元表达式中的翻译key。

```javascript
// 单行三元表达式
const msg = Language.GetContent(isSuccess ? "MSG_SUCCESS" : "MSG_FAILED");
// 悬停在两个key上都会显示翻译

// 多行三元表达式
const title = Language.GetContent(
    type === 1 ? "ui_main_menu" :
    type === 2 ? "ui_settings" :
    "ui_default"
);
// 每个key都能正常识别
```

### 5. 缺失翻译提示

当key不存在时，显示警告提示。

```javascript
Language.GetContent("unknown_key_123");

// 显示：
// 🌐 多语言预览
// 
// Key : unknown_key_123
// 
// ⚠️ 未找到对应的翻译
// 
// 该key不存在于翻译文件中
```

### 6. 加载错误提示 🚨

当翻译文件加载失败时，会在**状态栏**和**悬停提示**中显示明确的错误信息。

#### 状态栏显示

**加载失败时**：
```
🔴 $(error) i18n 加载错误
```
- 红色背景，醒目提示
- 悬停显示详细错误信息
- 点击状态栏可重新加载翻译文件

**加载成功时**：
```
✅ $(check) i18n 正常模式
已加载 1234 条翻译
```

#### 悬停提示

当翻译文件加载失败时，悬停在任意字符串上都会显示：

```
⚠️ 翻译文件加载失败

错误信息： 文件不存在: C:\Work\myproject\translations.txt

请检查：
1. 翻译文件路径是否正确
2. 翻译文件是否存在
3. 翻译文件格式是否正确（key=value）

[点击重新加载翻译文件]
```

#### 常见错误类型

| 错误类型 | 错误信息 | 解决方法 |
|---------|---------|---------|
| 文件不存在 | `文件不存在: ...` | 创建文件或修改路径配置 |
| 文件为空 | `翻译文件为空或格式错误` | 添加有效的翻译内容 |
| 未打开工作区 | `未打开工作区文件夹` | 使用"打开文件夹"而不是"打开文件" |
| 读取失败 | `读取失败: ...` | 检查文件权限和编码 |

#### 快速恢复

三种方式重新加载翻译文件：

1. **点击状态栏**（推荐）：直接点击红色错误状态栏
2. **命令面板**：`Ctrl+Shift+P` → "重新加载翻译文件"
3. **悬停链接**：点击悬停提示中的链接

重新加载后会显示结果：
- ✅ 成功：`翻译文件已成功加载，共 1234 条翻译`
- ❌ 失败：`翻译文件加载失败: ...`

## ⚙️ 配置说明

### 翻译文件路径

```json
{
  "i18nHover.translationFilePath": "D:/project/i18n/translations.txt"
}
```

**默认自动查找规则**（未配置时按顺序查找，使用第一个存在的文件）：
1. `<工作区>/translations.txt`
2. `<工作区>/Library/EditorPerssitent/Locale/translation.txt`

### Key 匹配规则

```json
{
  "i18nHover.keyPattern": "^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$"
}
```

默认支持：
- 字母、数字、下划线、横线、点号
- 可以数字开头（如 `100020`）
- 示例：`BTN_OK`, `ui_main_menu`, `btn-ok`, `ui.main.menu`, `100020`

### 函数匹配列表

```json
{
  "i18nHover.functionPatterns": [
    "Language\\.GetContent\\s*\\([^\"']*$",
    "GameUtil\\.ShowTips\\s*\\([^\"']*$",
    "translate\\s*\\([^\"']*$",
    ...
  ]
}
```

内置15个常用函数模式，支持自定义添加。

### 反向查找结果数量

```json
{
  "i18nHover.maxReverseResults": 5  // 默认显示5个匹配结果
}
```

控制中文反向查找时显示的最大结果数量（1-20）。
- **推荐值**：3-5（快速查看最匹配的结果）
- **较大值**：6-10（需要查看更多可能的匹配）

## 🎮 支持的语言

- JavaScript / TypeScript
- C#
- Java
- Python

## 📖 翻译文件格式

```txt
# 注释行（以 # 或 // 开头）

# 基础格式
key=value

# 支持数字开头
100020=金币
100022=战力

# 支持横线和点号
btn-ok=确定
ui.main.menu=主菜单

# 支持换行符（\n）
multi_line=第一行\n第二行\n第三行

# 支持游戏富文本标签
colored_text=获得<color=#fcac41>传说装备</color>等奖励

# 支持参数占位符
notice_9=通知信息：{0}
```

## 🔥 实际使用场景

### 场景 1：查看翻译

```javascript
// 开发时，悬停查看翻译内容
Language.GetContent("account_bind_tips");
// 显示：该账号已绑定其他角色
```

### 场景 2：重构硬编码中文

```javascript
// 旧代码（硬编码）
function showMessage() {
    alert("操作成功");
    console.log("网络连接失败");
}

// 悬停在中文上 → 点击对应的key → 自动替换

// 重构后
function showMessage() {
    alert("MSG_SUCCESS");
    console.log("ERROR_NETWORK");
}
```

### 场景 3：检查翻译覆盖率

```javascript
// 开启强制模式（Ctrl+Shift+H）
// 逐个检查代码中的字符串
const list = [
    "BTN_OK",           // ✅ 有翻译
    "BTN_CANCEL",       // ✅ 有翻译
    "unknown_key"       // ⚠️ 无翻译，需要添加
];
```

### 场景 4：多语言key快速切换

```javascript
// 测试不同的翻译key
GameUtil.ShowTips("MSG_SUCCESS");

// 悬停 → 点击 MSG_FAILED
GameUtil.ShowTips("MSG_FAILED");

// 再点击 MSG_LOADING
GameUtil.ShowTips("MSG_LOADING");

// 快速切换，实时查看效果
```

## ⌨️ 快捷键

| 功能 | Windows/Linux | macOS |
|------|--------------|-------|
| 切换强制查找模式 | `Ctrl+Shift+H` | `Cmd+Shift+H` |
| 重新加载翻译文件 | `Ctrl+Shift+P` → "重新加载翻译文件" | `Cmd+Shift+P` → "重新加载翻译文件" |

可在 VS Code 快捷键设置中自定义（`Ctrl+K, Ctrl+S`）。

## 🎨 界面展示

### 正常翻译显示

```
🌐 多语言预览

Key : BTN_OK

Value :

确定          ← 绿色高亮显示

─────────────
```

### 中文反向查找

```
🔍 中文反向查找（在函数调用中）

中文内容： 确定

找到 3 个匹配的翻译 key：

1. BTN_OK → 确定
2. 101154 → 确定
3. btn-ok → 确定

─────────────

💡 点击 key 可快速替换当前中文字符串
```

### 缺失翻译提示

```
🌐 多语言预览

Key : unknown_key_123

⚠️ 未找到对应的翻译

─────────────

该key不存在于翻译文件中
```

## 🔧 高级配置

### 自定义函数模式

添加你项目中的自定义函数：

```json
{
  "i18nHover.functionPatterns": [
    "MyLocalization\\.Get\\s*\\([^\"']*$",
    "i18n\\.getString\\s*\\([^\"']*$",
    "T\\s*\\([^\"']*$"
  ]
}
```

### 禁用扩展

```json
{
  "i18nHover.enabled": false
}
```

### 工作区配置

在 `.vscode/settings.json` 中配置项目特定设置：

```json
{
  "i18nHover.translationFilePath": "${workspaceFolder}/locales/zh_CN.txt",
  "i18nHover.functionPatterns": [
    "Language\\.GetContent\\s*\\([^\"']*$",
    "GameUtil\\.ShowTips\\s*\\([^\"']*$"
  ]
}
```

## 📚 相关文档

- **[快速上手](./docs/快速上手.md)** - 5 分钟快速入门
- **[配置指南](./docs/配置指南.md)** - 详细配置说明
- **[功能指南](./docs/功能指南.md)** - 完整功能使用说明
- **[完整文档目录](./docs/README.md)** - 查看所有文档

## 🐛 常见问题

### Q: 为什么悬停没有显示翻译？

**A**: 检查以下几点：
1. 确保翻译文件已加载（查看状态栏）
2. 确认字符串在支持的函数中
3. 检查key是否匹配配置的规则
4. 尝试重新加载翻译文件（`Ctrl+Shift+P` → "重新加载翻译文件"）

### Q: 中文反向查找没有显示？

**A**: 确保：
1. 在正常模式（不是强制模式）
2. 中文字符串在支持的函数调用中
3. 翻译文件包含该中文的翻译

### Q: 如何添加自定义函数？

**A**: 在设置中添加正则表达式：
```json
{
  "i18nHover.functionPatterns": [
    "YourFunction\\.Get\\s*\\([^\"']*$"
  ]
}
```

### Q: 悬停时显示 "Loading..."？

**A**: 这通常是其他扩展（如C#扩展）导致的，不影响我们的翻译显示。如果想去除，可以禁用C#扩展。

### Q: 如何查看扩展日志？

**A**: 有两种方式：

**方式 1（推荐）**：
1. 按 `Ctrl + Shift + U` 打开输出面板
2. 在右上角下拉菜单中选择 `i18n Hover Translator`
3. 查看所有扩展日志

**方式 2**：
1. 按 `Ctrl + Shift + P` 打开命令面板
2. 输入并选择 `显示日志输出`
3. 自动打开日志面板

查看日志可以帮助您：
- ✅ 确认翻译文件是否加载成功
- ✅ 查看加载了多少条翻译
- ✅ 诊断加载失败的原因
- ✅ 了解扩展的运行状态

## 🎉 更新日志

### v1.0.0 (当前版本)

**核心功能**：
- ✅ 智能函数识别
- ✅ 中文反向查找和一键替换
- ✅ 强制查找模式（快捷键切换）
- ✅ 三元表达式支持
- ✅ 缺失翻译提示
- ✅ 编辑距离智能排序
- ✅ 状态栏实时显示

**优化改进**：
- 🎨 翻译内容绿色高亮显示
- 🔄 支持连续点击替换
- 📊 显示完整翻译内容便于判断
- ⚡ 动态位置查找，确保替换准确

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👨‍💻 作者

flameshark

---

**如果觉得有用，请给个⭐Star！**
