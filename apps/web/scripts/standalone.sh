#!/bin/sh
# scripts/standalone.sh — Next.js 14 standalone 部署脚本
#
# Next.js 14 的 output: 'standalone' 不会自动打包 public/ 也不打包 .next/static/。
# 必须手动 copy 到 .next/standalone/apps/web/{public,.next/static} 才生效。
# 这个脚本包起来,build/start 都防忘记。
#
# 用法:
#   scripts/standalone.sh build     # pnpm build + copy public/ + copy .next/static/
#   scripts/standalone.sh start     # 补 copy(若缺失)+ 前台跑 server.js
#   scripts/standalone.sh daemon    # 后台跑,写 PID 到 /var/run/pixelbead-web.pid
#   scripts/standalone.sh stop      # 通过 PID 文件停
#   scripts/standalone.sh restart   # stop + daemon
#   scripts/standalone.sh status    # 看 PID + 端口
#
# 部署示例:
#   pnpm build:standalone           # = standalone.sh build
#   sudo scripts/standalone.sh daemon  # 起服务
#   sudo scripts/standalone.sh status  # 看状态

set -e

# 路径:这个脚本在 apps/web/scripts/,所以 ..
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$APP_DIR"

STANDALONE_DIR="$APP_DIR/.next/standalone/apps/web"
PID_FILE="/var/run/pixelbead-web.pid"
LOG_FILE="/var/log/pixelbead-web.log"

# ─── helpers ────────────────────────────────────────────────────────────────

log()  { printf '\033[1;34m[standalone]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[standalone]\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[1;31m[standalone]\033[0m %s\n' "$*" >&2; exit 1; }

ensure_standalone_built() {
  [ -d "$STANDALONE_DIR" ] || fail "standalone 未构建 — 先跑: $0 build"
  [ -f "$STANDALONE_DIR/server.js" ] || fail "server.js 缺失,build 异常"
}

copy_public() {
  if [ -d "$APP_DIR/public" ]; then
    mkdir -p "$STANDALONE_DIR/public"
    # rsync 比 cp -r 快且支持增量;--delete 保证删了的文件同步删
    rsync -a --delete "$APP_DIR/public/" "$STANDALONE_DIR/public/"
    log "public/ → standalone (含 $(find "$STANDALONE_DIR/public" -type f | wc -l) 个文件)"
  else
    warn "public/ 不存在,跳过 copy"
  fi
}

copy_static() {
  if [ -d "$APP_DIR/.next/static" ]; then
    mkdir -p "$STANDALONE_DIR/.next"
    rsync -a --delete "$APP_DIR/.next/static/" "$STANDALONE_DIR/.next/static/"
    log ".next/static/ → standalone"
  else
    warn ".next/static/ 不存在,跳过 copy"
  fi
}

# ─── commands ────────────────────────────────────────────────────────────────

cmd_build() {
  log "1/3 pnpm build"
  pnpm build

  ensure_standalone_built

  log "2/3 copy public/ → standalone"
  copy_public

  log "3/3 copy .next/static/ → standalone"
  copy_static

  log "✅ build 完成,起服务: $0 daemon"
}

cmd_start() {
  ensure_standalone_built

  # 补 copy(若缺失)— 即使 build 后,start 前也可能漏了
  [ -f "$STANDALONE_DIR/public/favicon.svg" ] || copy_public
  [ -d "$STANDALONE_DIR/.next/static" ] || copy_static

  log "启动 server.js (前台,Ctrl-C 退出)"
  cd "$STANDALONE_DIR"
  exec node server.js
}

cmd_daemon() {
  ensure_standalone_built

  # 已在跑?
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    fail "已在跑 (PID $(cat "$PID_FILE"))。先: $0 stop"
  fi

  [ -f "$STANDALONE_DIR/public/favicon.svg" ] || copy_public
  [ -d "$STANDALONE_DIR/.next/static" ] || copy_static

  cd "$STANDALONE_DIR"
  nohup node server.js > "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  sleep 1

  # 校验进程真的活了
  if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    log "✅ 已起 PID $(cat "$PID_FILE"),日志: $LOG_FILE"
  else
    fail "进程启动失败,看日志: tail -20 $LOG_FILE"
  fi
}

cmd_stop() {
  [ -f "$PID_FILE" ] || fail "无 PID 文件,服务可能没起: $0 daemon"
  pid="$(cat "$PID_FILE")"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    log "已发 SIGTERM 给 PID $pid,等 3 秒"
    sleep 3
    kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null && warn "强杀 SIGKILL"
  else
    warn "PID $pid 已经不在"
  fi
  rm -f "$PID_FILE"
}

cmd_restart() {
  cmd_stop || true
  cmd_daemon
}

cmd_status() {
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    pid="$(cat "$PID_FILE")"
    log "运行中 PID $pid"
    ss -ltnp 2>/dev/null | grep ":3000" || warn "端口 3000 没在听"
  else
    log "未运行"
    [ -f "$PID_FILE" ] && warn "PID 文件残留,可删: rm $PID_FILE"
  fi
}

# ─── dispatch ───────────────────────────────────────────────────────────────

case "${1:-}" in
  build)   cmd_build ;;
  start)   cmd_start ;;
  daemon)  cmd_daemon ;;
  stop)    cmd_stop ;;
  restart) cmd_restart ;;
  status)  cmd_status ;;
  *)       sed -n '2,20p' "$0" | sed 's/^# \?//'
           fail "未知命令: ${1:-<empty>}" ;;
esac