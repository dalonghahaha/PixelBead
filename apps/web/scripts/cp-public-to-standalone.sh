#!/bin/sh
# scripts/cp-public-to-standalone.sh — Next.js 14 standalone 部署的 postbuild hook
#
# Next.js 14 配置 output: 'standalone' 时,build 产物在 .next/standalone/apps/web/
# 但 standalone 不会自动打包:
#   1. public/                 → 必须手动 cp
#   2. .next/static/           → 必须手动 cp
#
# 没这两个目录,生产部署 favicon / examples / chunk JS 全 404。
# 这个脚本是 postbuild,每次 build 后自动跑,避免忘。
#
# 用法:
#   直接: ./scripts/cp-public-to-standalone.sh
#   作为 hook: package.json 里 "postbuild": "bash scripts/cp-public-to-standalone.sh"
#
# 退出码:
#   0 = 成功(或 standalone 未启用,跳过)
#   1 = 错误(standalone 启用了但 copy 失败)

set -e

# 这个脚本在 apps/web/scripts/,所以 ..
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$APP_DIR"

STANDALONE_DIR="$APP_DIR/.next/standalone/apps/web"

# 没启用 standalone output,跳过(常见情况:dev build / Docker)
if [ ! -d "$STANDALONE_DIR" ]; then
  echo "[postbuild] standalone 目录不存在 — 跳过(可能未启用 output: 'standalone',或 build 在 Docker 里跑)"
  exit 0
fi

echo "[postbuild] 检测到 standalone 目录,补 copy public/ + .next/static/"

# public/
if [ -d "$APP_DIR/public" ]; then
  mkdir -p "$STANDALONE_DIR/public"
  # cp -r 不带 --delete,避免删 public/ 里临时放的调试文件
  cp -r "$APP_DIR/public/." "$STANDALONE_DIR/public/"
  count=$(find "$STANDALONE_DIR/public" -type f 2>/dev/null | wc -l)
  echo "[postbuild] ✅ public/ → standalone ($count 个文件)"
else
  echo "[postbuild] ⚠ public/ 不存在,跳过"
fi

# .next/static/
if [ -d "$APP_DIR/.next/static" ]; then
  mkdir -p "$STANDALONE_DIR/.next"
  cp -r "$APP_DIR/.next/static/." "$STANDALONE_DIR/.next/static/"
  echo "[postbuild] ✅ .next/static/ → standalone"
else
  echo "[postbuild] ⚠ .next/static/ 不存在,跳过"
fi

# 验证关键文件
if [ ! -f "$STANDALONE_DIR/public/favicon.svg" ]; then
  echo "[postbuild] ❌ 严重:standalone/public/favicon.svg 缺失,build 可能坏掉"
  exit 1
fi

echo "[postbuild] 完成 — 启动服务: pnpm start:standalone"