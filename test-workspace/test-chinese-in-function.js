// 测试：中文反向查找在函数调用中的表现

// ✅ 应该显示中文反向查找（在函数调用中，但是中文）
GameUtil.ShowTips("确定");           // 应该显示匹配的key列表
Language.GetContent("网络连接失败");  // 应该显示匹配的key列表
Localization.Get("操作成功");        // 应该显示匹配的key列表

// ❌ 不应该显示（不在函数调用中）
const message = "确定";              // 不显示
var tip = "网络连接失败";            // 不显示
let text = "操作成功";               // 不显示

// ✅ 应该显示正常翻译（在函数调用中，且是合法的key）
Language.GetContent("BTN_OK");       // 显示翻译：确定
GameUtil.ShowTips("gp_network_error"); // 显示翻译：网络连接失败
Localization.Get("MSG_SUCCESS");     // 显示翻译：操作成功

// ✅ 函数调用中的中文（复杂场景）
function test1() {
    return GameUtil.ShowTips("用户名");  // 应该显示反向查找
}

function test2() {
    if (error) {
        alert(Language.GetContent("密码"));  // 应该显示反向查找
    }
}

// ✅ 三元表达式中的中文
const msg = Language.GetContent(
    isSuccess ? "操作成功" : "操作失败"
);  // 两个中文都应该显示反向查找

// ✅ 多参数函数中的中文
String.Format(Language.GetContent("通知信息"), 100);  // 应该显示反向查找

// ✅ 嵌套调用中的中文
console.log(translate("取消"));  // 应该显示反向查找

// ❌ 不在支持的函数列表中
console.log("确定");             // 不显示（不在函数列表中）
alert("网络连接失败");            // 不显示（不在函数列表中）

// ✅ 测试边界情况
GameUtil.ShowTips("确定取消");    // 如果有匹配应该显示
Language.GetContent("这是一段很长的中文测试文本");  // 如果有匹配应该显示
translate("");                   // 空字符串，不显示

