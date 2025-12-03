// ================================================================================
// i18n Hover Translator - 完整测试用例
// ================================================================================

// ============================================================================
// 1. 基础功能测试
// ============================================================================

// ✅ 测试：基础key查找
Language.GetContent("BTN_OK");           // 悬停应显示：确定
Language.GetContent("BTN_CANCEL");       // 悬停应显示：取消
Language.GetContent("MSG_SUCCESS");      // 悬停应显示：操作成功

// ✅ 测试：不同的函数名
GameUtil.ShowTips("gp_network_error");  // 悬停应显示：网络连接失败
Localization.Get("USER_NAME");          // 悬停应显示：用户名
translate("MSG_FAILED");                // 悬停应显示：操作失败

// ❌ 测试：不在函数中的字符串（正常模式不显示）
const str1 = "BTN_OK";                  // 不显示
const str2 = "MSG_SUCCESS";             // 不显示
let message = "USER_NAME";              // 不显示

// ============================================================================
// 2. 数字key和特殊格式测试
// ============================================================================

// ✅ 测试：纯数字key（游戏项目常见）
Language.GetContent("100020");          // 悬停应显示：金币
Language.GetContent("100022");          // 悬停应显示：战力
Language.GetContent("100148");          // 悬停应显示：您的钻石不足。

// ✅ 测试：数字+下划线
Language.GetContent("1013_default_key");      // 悬停应显示：输入广播内容…
Language.GetContent("4_king_cross_server");   // 悬停应显示：联赛进程

// ✅ 测试：包含横线的key
Language.GetContent("btn-ok");          // 悬停应显示：确定
translate("msg-success");               // 悬停应显示：成功

// ✅ 测试：包含点号的key
i18n.get("ui.main.menu");              // 悬停应显示：主菜单
Localization.Get("config.app.name");    // 悬停应显示：应用名称

// ============================================================================
// 3. 三元表达式测试
// ============================================================================

// ✅ 测试：单行三元表达式
const msg = Language.GetContent(isSuccess ? "MSG_SUCCESS" : "MSG_FAILED");
// 悬停在两个key上都应该显示对应翻译

// ✅ 测试：多行三元表达式
const title = Language.GetContent(
    type === 1 ? "mobilization_dedicated_task" :
    type === 2 ? "mobilization_alliance_task_title" :
    "ui_main_menu"
);
// 每个key都应该正常识别

// ✅ 测试：嵌套三元表达式
const status = "success";
const message = translate(
    status === "success" ? "MSG_SUCCESS" :
    status === "failed" ? "MSG_FAILED" :
    "MSG_LOADING"
);

// ✅ 测试：三元表达式中使用数字key
const vo = { ownerType: 1 };
title.text = Language.GetContent(vo.ownerType === 1 ? "100020" : "100022");
// 悬停在两个数字key上都应该显示

// ============================================================================
// 4. 多行文本测试
// ============================================================================

// ✅ 测试：包含换行符的翻译
Language.GetContent("account_manage_tips_003");
// 应显示多行文本：
// 确定要切到新的服务器{0}吗？
// 切换后，老的角色不会消失，可以随时切换到原来的服务器。

GameUtil.ShowTips("activity_basezp_shuoming");
// 应显示多行文本（包含 \n）

// ============================================================================
// 5. 中文反向查找测试（⭐ 核心功能）
// ============================================================================

// ✅ 测试：在函数调用中的中文字符串（应显示反向查找）
GameUtil.ShowTips("确定");              // 应显示匹配的key列表：BTN_OK, 101154, btn-ok
Language.GetContent("网络连接失败");    // 应显示：ERROR_NETWORK, gp_network_error
translate("操作成功");                  // 应显示：MSG_SUCCESS

// ✅ 测试：包含标点的中文
GameUtil.ShowTips("你好，世界！");
Language.GetContent("您的钻石不足。");

// ✅ 测试：完全匹配vs模糊匹配
GameUtil.ShowTips("获取失败");
// 应按相似度排序，完全匹配的在前面

// ❌ 测试：不在函数中的中文（正常模式不显示）
const chinese1 = "确定";                // 不显示
let chinese2 = "网络连接失败";          // 不显示

// ✅ 测试：点击key快速替换
function testReplace() {
    // 1. 悬停在"确定"上
    // 2. 点击列表中的某个key（如 BTN_OK）
    // 3. 字符串应该自动替换为该key
    GameUtil.ShowTips("确定");  
}

// ✅ 测试：连续点击替换
function testMultipleReplace() {
    // 1. 悬停在"确定"上，点击 BTN_OK
    // 2. 再次悬停，点击 101154
    // 3. 应该完全替换，不留残留
    GameUtil.ShowTips("确定");
}

// ============================================================================
// 6. 缺失翻译测试
// ============================================================================

// ✅ 测试：key不存在于翻译文件
Language.GetContent("unknown_key_123");         // 应显示：⚠️ 未找到对应的翻译
GameUtil.ShowTips("alliance_fort_1033");        // 应显示：⚠️ 未找到对应的翻译
translate("this_key_does_not_exist");           // 应显示：⚠️ 未找到对应的翻译

// ============================================================================
// 7. 不同语言测试
// ============================================================================

// ✅ JavaScript/TypeScript
const i18n = {
    get: (key) => Language.GetContent(key)
};
i18n.get("BTN_OK");
i18n.t("MSG_SUCCESS");

// ✅ 多参数函数
String.Format(Language.GetContent("notice_9"), 0);

// ✅ 嵌套调用
console.log(translate("USER_NAME"));

// ============================================================================
// 8. 强制模式测试
// ============================================================================

// 说明：按 Ctrl+Shift+H 切换到强制模式

// 在强制模式下，以下字符串也会显示翻译查找：
const test1 = "BTN_OK";                         // 强制模式：显示翻译
const test2 = "确定";                            // 强制模式：显示反向查找
let test3 = "100020";                           // 强制模式：显示翻译

// ============================================================================
// 9. 边界情况测试
// ============================================================================

// ✅ 空字符串
Language.GetContent("");                        // 不处理

// ✅ 单引号
Language.GetContent('BTN_OK');                  // 应正常显示
GameUtil.ShowTips('确定');                       // 应显示反向查找

// ✅ 混合引号（不同行）
Language.GetContent("BTN_OK");
Language.GetContent('BTN_CANCEL');

// ✅ 同一行多个字符串
const obj = { a: "BTN_OK", b: "BTN_CANCEL" };   // 各自独立识别

// ✅ 字符串拼接（只识别第一个字符串）
const combined = Language.GetContent("BTN_" + "OK");  // 只识别 "BTN_"

// ============================================================================
// 10. 实际场景模拟
// ============================================================================

// 场景1：按钮文本
function createButton() {
    return {
        text: Language.GetContent("BTN_OK"),
        onClick: () => {
            GameUtil.ShowTips("MSG_SUCCESS");
        }
    };
}

// 场景2：错误处理
function handleError(error) {
    if (error.type === "network") {
        GameUtil.ShowTips("ERROR_NETWORK");
    } else {
        GameUtil.ShowTips("ERROR_REQUIRED_FIELD");
    }
}

// 场景3：动态key选择
function getMessage(type) {
    return Language.GetContent(
        type === "success" ? "MSG_SUCCESS" :
        type === "failed" ? "MSG_FAILED" :
        "MSG_LOADING"
    );
}

// 场景4：游戏数值显示
function showReward(amount) {
    const text = String.Format(
        Language.GetContent("100020"),  // "金币"
        amount
    );
    return text;
}

// ============================================================================
// 测试清单 ✓
// ============================================================================

// 基础功能：
// [ ] 基础key查找
// [ ] 不同函数名支持
// [ ] 不在函数中的字符串不显示（正常模式）

// 特殊格式：
// [ ] 纯数字key
// [ ] 数字+下划线
// [ ] 包含横线
// [ ] 包含点号

// 高级功能：
// [ ] 三元表达式识别
// [ ] 多行文本显示
// [ ] 中文反向查找
// [ ] 点击key快速替换
// [ ] 连续替换不出错

// 异常处理：
// [ ] 缺失翻译提示
// [ ] 空字符串处理
// [ ] 单引号支持

// 模式切换：
// [ ] 强制模式开关（Ctrl+Shift+H）
// [ ] 状态栏显示正确

// ============================================================================
// 结束
// ============================================================================
