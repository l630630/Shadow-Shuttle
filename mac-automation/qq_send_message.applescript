-- 给固定联系人“健健”发送 QQ 消息
-- 当前版本：只负责在 QQ 中搜索联系人“健健”，不再自动输入消息
-- 用法（Shell）：osascript qq_send_message.applescript
-- 注意：QQ 客户端版本较多，如快捷键 / UI 有变化，可按需微调。

on run
  set targetName to "健健"
  tell application "QQ"
    activate
  end tell

  tell application "System Events"
    -- 先把 QQ 放到前台
    tell process "QQ"
      set frontmost to true
    end tell
    delay 0.3

    -- 打开搜索框（Cmd+F）
    keystroke "f" using {command down}
    delay 0.4

    -- 清空搜索框
    keystroke "a" using {command down}
    delay 0.2
    key code 51 -- delete
    delay 0.2

    -- 输入联系人名“健健”
    keystroke targetName
    delay 0.6

    -- 保持在搜索结果界面，由你手动选择联系人并发送消息
  end tell
end run

