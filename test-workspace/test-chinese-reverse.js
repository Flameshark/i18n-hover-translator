// 中文反向查找测试文件

// ✅ 应该显示反向查找结果的示例
const msg1 = "确定";          // 应该找到: BTN_OK, 101154, btn-ok
const msg2 = "网络连接失败";   // 应该找到: ERROR_NETWORK, gp_network_error
const msg3 = "获取失败";       // 应该找到多个匹配项
const msg4 = "主菜单";         // 应该找到: ui.main.menu, ui_main_menu
const msg5 = "金币";           // 应该找到: 100020

// ✅ 包含标点符号的中文
const msg6 = "你好，世界！";
const msg7 = "确定要切到新的服务器吗？";

// ✅ 混合内容（中文+符号）
const msg8 = "您的钻石不足。";
const msg9 = "输入广播内容…";

// ❌ 不应该触发反向查找的示例（这些是key，不是纯中文）
const key1 = "BTN_OK";        // 不是纯中文
const key2 = "ui_main_menu";  // 不是纯中文
const key3 = "100020";        // 不是纯中文

// ❌ 英文字符串不应该触发
const english = "Hello World";
const mixed = "Hello 世界";   // 混合但英文占主导

// ✅ 测试点击替换功能
// 1. 悬停在下面的中文字符串上
// 2. 点击弹出的key选项
// 3. 字符串应该被替换为对应的key

function testReplace() {
    console.log("操作成功");    // 尝试替换为 MSG_SUCCESS
    alert("取消");              // 尝试替换为 BTN_CANCEL
    return "用户名";            // 尝试替换为 USER_NAME
}

// ✅ 在不同位置的中文字符串
if (status === "success") {
    showMessage("操作成功");
}

const user = {
    name: "用户名",
    pwd: "密码"
};

// ✅ 数组中的中文
const messages = [
    "确定",
    "取消",
    "操作成功"
];

