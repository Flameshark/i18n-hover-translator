// C# String.Format 测试示例
using System;

namespace I18nTest
{
    public class StringFormatTest
    {
        public void TestStringFormat()
        {
            // ✅ 应该显示翻译的情况
            
            // String.Format 中的 Language.GetContent
            string msg1 = String.Format(Language.GetContent("account_manage_tips_003"), "服务器123");
            // 悬停 "account_manage_tips_003" 应该显示两行文本（包含换行符）
            
            string msg2 = string.Format(Language.GetContent("100020"));
            // 悬停 "100020" 应该显示：金币
            
            string msg3 = String.Format("{0}: {1}", 
                Language.GetContent("USER_NAME"), "Admin");
            // 悬停 "USER_NAME" 应该显示：用户名
            
            // 其他支持的函数
            string text1 = Localization.Get("BTN_OK");
            // 悬停 "BTN_OK" 应该显示：确定
            
            string text2 = I18n.Translate("MSG_SUCCESS");
            // 悬停 "MSG_SUCCESS" 应该显示：操作成功
            
            // ❌ 不应该显示翻译的情况
            
            // 普通字符串变量
            string normalVar = "BTN_OK";
            // 悬停不显示（不在特定函数中）
            
            // String.Format 但不在 Language.GetContent 中
            string formatted = String.Format("Hello {0}", "World");
            // 悬停 "Hello {0}" 和 "World" 都不显示
            
            // Console.WriteLine（不在支持的函数列表中）
            Console.WriteLine("MSG_SUCCESS");
            // 悬停不显示
        }
        
        public void TestComplexCases()
        {
            // 嵌套调用
            ShowMessage(Language.GetContent("gp_network_error"));
            // 悬停 "gp_network_error" 应该显示：网络连接失败
            
            // 条件表达式中
            string msg = isSuccess ? 
                Language.GetContent("MSG_SUCCESS") : 
                Language.GetContent("MSG_FAILED");
            // 两个key都应该显示翻译
            
            // 数组初始化
            string[] messages = new string[] {
                Language.GetContent("BTN_OK"),
                Language.GetContent("BTN_CANCEL"),
                Language.GetContent("BTN_SAVE")
            };
            // 三个key都应该显示翻译
        }
        
        private void ShowMessage(string message)
        {
            // ...
        }
    }
}

