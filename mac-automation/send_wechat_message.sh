#!/usr/bin/env bash

# Shell 封装：给微信联系人发送消息
# 用法：
#   bash send_wechat_message.sh "联系人名" "消息内容"
# 或（加入 PATH 后）：
#   send_wechat_message "联系人名" "消息内容"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPLESCRIPT="${SCRIPT_DIR}/wechat_send_message.applescript"

if [[ ! -f "${APPLESCRIPT}" ]]; then
  echo "错误：找不到 AppleScript 文件：${APPLESCRIPT}" >&2
  exit 1
fi

if [[ "$#" -lt 1 ]]; then
  echo "用法：$0 \"联系人名\" \"消息内容\"  或  $0 \"联系人名 消息内容\"" >&2
  exit 1
fi

if [[ "$#" -ge 2 ]]; then
  # 标准形式：第一个参数是联系人，其余是消息
  contact="$1"
  shift
  message="$*"
else
  # 兼容形式：只有一个参数，尝试从中拆分“联系人 + 消息”
  raw="$1"
  if [[ "${raw}" =~ ^([^[:space:]:：]+)[[:space:]:：]+(.+)$ ]]; then
    contact="${BASH_REMATCH[1]}"
    message="${BASH_REMATCH[2]}"
  else
    echo "无法从参数中解析出联系人和消息，请至少提供联系人和消息两个部分。" >&2
    echo "示例：$0 \"健健\" \"你好\"  或  $0 \"健健 你好\"" >&2
    exit 1
  fi
fi

osascript "${APPLESCRIPT}" "${contact}" "${message}"

