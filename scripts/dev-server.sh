#!/usr/bin/env bash
#
# 프론트엔드 개발 서버 관리 스크립트
# 사용법: ./scripts/dev-server.sh {start|stop|restart|status|logs}
#
set -euo pipefail

# 저장소 루트 (이 스크립트 위치 기준)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
RUN_DIR="$ROOT_DIR/.run"
PID_FILE="$RUN_DIR/dev-server.pid"
LOG_FILE="$RUN_DIR/dev-server.log"

mkdir -p "$RUN_DIR"

# 실행 중인 서버 PID를 반환 (없으면 빈 문자열)
running_pid() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE")"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "$pid"
      return 0
    fi
  fi
  echo ""
}

start() {
  local pid
  pid="$(running_pid)"
  if [[ -n "$pid" ]]; then
    echo "이미 실행 중입니다 (PID: $pid). http://localhost:5173/"
    return 0
  fi

  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    echo "의존성이 없어 설치합니다..."
    (cd "$FRONTEND_DIR" && npm install)
  fi

  echo "개발 서버를 시작합니다..."
  (cd "$FRONTEND_DIR" && nohup npm run dev >"$LOG_FILE" 2>&1 &
    echo $! >"$PID_FILE")

  sleep 1
  pid="$(running_pid)"
  if [[ -n "$pid" ]]; then
    echo "시작됨 (PID: $pid). http://localhost:5173/"
    echo "로그: $LOG_FILE"
  else
    echo "시작에 실패했습니다. 로그를 확인하세요: $LOG_FILE"
    return 1
  fi
}

stop() {
  local pid
  pid="$(running_pid)"
  if [[ -z "$pid" ]]; then
    echo "실행 중인 서버가 없습니다."
    rm -f "$PID_FILE"
    return 0
  fi

  echo "서버를 종료합니다 (PID: $pid)..."
  # 자식 프로세스(vite)까지 함께 종료
  kill "$pid" 2>/dev/null || true
  pkill -P "$pid" 2>/dev/null || true

  for _ in 1 2 3 4 5; do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 1
  done

  if kill -0 "$pid" 2>/dev/null; then
    echo "정상 종료되지 않아 강제 종료합니다..."
    kill -9 "$pid" 2>/dev/null || true
  fi

  rm -f "$PID_FILE"
  echo "종료 완료."
}

status() {
  local pid
  pid="$(running_pid)"
  if [[ -n "$pid" ]]; then
    echo "실행 중 (PID: $pid). http://localhost:5173/"
  else
    echo "중지됨."
  fi
}

logs() {
  if [[ -f "$LOG_FILE" ]]; then
    tail -n 50 -f "$LOG_FILE"
  else
    echo "로그 파일이 없습니다: $LOG_FILE"
  fi
}

case "${1:-}" in
  start)   start ;;
  stop)    stop ;;
  restart) stop; start ;;
  status)  status ;;
  logs)    logs ;;
  *)
    echo "사용법: $0 {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
