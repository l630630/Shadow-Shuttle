#!/usr/bin/env bash

# Shell 封装：在 QQ 中搜索联系人“健健”（不自动发消息）
# 用法：
#   bash send_qq_message.sh
# 或（加入 PATH 后）：
#   send_qq_message

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPLESCRIPT="${SCRIPT_DIR}/qq_send_message.applescript"

if [[ ! -f "${APPLESCRIPT}" ]]; then
  echo "错误：找不到 AppleScript 文件：${APPLESCRIPT}" >&2
  exit 1
fi

# 不需要参数，直接调用 AppleScript 执行搜索
osascript "${APPLESCRIPT}"

