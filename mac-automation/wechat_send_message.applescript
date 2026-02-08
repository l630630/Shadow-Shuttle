-- 给微信联系人发送消息
-- 用法（Shell）：osascript wechat_send_message.applescript "联系人名" "消息内容"

on run {targetName, msgText}
  -- 兼容两种进程名：先尝试 WeChat，如果不存在再尝试“微信”
  try
    tell application "WeChat"
      activate
    end tell
  on error
    tell application "微信"
      activate
    end tell
  end try

  tell application "System Events"
    -- WeChat 的进程名通常是 "WeChat"，即使 Dock 图标显示为“微信”
    tell process "WeChat"
      -- 聚焦窗口
      set frontmost to true
      delay 0.2

      -- 打开搜索框（默认 Cmd+F）
      keystroke "f" using {command down}
      delay 0.3

      -- 输入联系人名
      keystroke targetName
      delay 0.6

      -- 由于搜索结果里第一个是“630%”，第二个才是“630”
      -- 这里先按一次 ↓ 选中第二个结果，再回车进入与 630 的聊天
      key code 125 -- ↓
      delay 0.2
      key code 36 -- 回车
      delay 0.4

      -- 确保光标在聊天输入框内，而不是还停留在搜索框
      try
        set winBounds to bounds of window 1
        set {leftPos, topPos, rightPos, bottomPos} to winBounds
        set winWidth to rightPos - leftPos
        -- 在窗口下方偏上的位置点击一下，基本可以命中输入框
        set clickX to leftPos + (winWidth / 2)
        set clickY to bottomPos - 80
        click at {clickX, clickY}
        delay 0.2
      end try

      -- 清空当前输入框内容，避免残留老文本
      keystroke "a" using {command down}
      delay 0.1
      key code 51 -- Delete 键，清空选中内容
      delay 0.1

      -- 输入消息内容并发送
      keystroke msgText
      delay 0.1
      key code 36 -- 回车发送
    end tell
  end tell
end run

