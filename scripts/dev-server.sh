#!/usr/bin/env bash
#
# 개발 서버 관리 스크립트 (프론트엔드 + 백엔드)
# 사용법: ./scripts/dev-server.sh {start|stop|restart|status|logs} [front|back|all]
#   - 두 번째 인자를 생략하면 all(프론트+백엔드)을 대상으로 한다.
#   예) ./scripts/dev-server.sh start          # 프론트+백엔드 모두 시작
#       ./scripts/dev-server.sh logs back      # 백엔드 로그만 tail
#       ./scripts/dev-server.sh restart front  # 프론트만 재시작
#
set -euo pipefail

# 저장소 루트 (이 스크립트 위치 기준)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
RUN_DIR="$ROOT_DIR/.run"

mkdir -p "$RUN_DIR"

# ---- 서비스 정의 -----------------------------------------------------------
# 각 서비스의 디렉터리/URL/라벨을 조회하는 헬퍼 (bash 3.2 호환).
svc_dir() {
  case "$1" in
    front) echo "$FRONTEND_DIR" ;;
    back)  echo "$BACKEND_DIR" ;;
  esac
}
svc_url() {
  case "$1" in
    front) echo "http://localhost:5173/" ;;
    back)  echo "http://localhost:4000/" ;;
  esac
}
svc_label() {
  case "$1" in
    front) echo "프론트엔드" ;;
    back)  echo "백엔드" ;;
  esac
}
pid_file() { echo "$RUN_DIR/dev-$1.pid"; }
log_file() { echo "$RUN_DIR/dev-$1.log"; }

# 실행 중인 서비스 PID를 반환 (없으면 빈 문자열)
running_pid() {
  local svc="$1" file pid
  file="$(pid_file "$svc")"
  if [[ -f "$file" ]]; then
    pid="$(cat "$file")"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "$pid"
      return 0
    fi
  fi
  echo ""
}

start_one() {
  local svc="$1" dir url log pid
  dir="$(svc_dir "$svc")"
  url="$(svc_url "$svc")"
  log="$(log_file "$svc")"

  pid="$(running_pid "$svc")"
  if [[ -n "$pid" ]]; then
    echo "[$(svc_label "$svc")] 이미 실행 중입니다 (PID: $pid). $url"
    return 0
  fi

  if [[ ! -d "$dir/node_modules" ]]; then
    echo "[$(svc_label "$svc")] 의존성이 없어 설치합니다..."
    (cd "$dir" && npm install)
  fi

  echo "[$(svc_label "$svc")] 개발 서버를 시작합니다..."
  (cd "$dir" && nohup npm run dev >"$log" 2>&1 &
    echo $! >"$(pid_file "$svc")")

  sleep 1
  pid="$(running_pid "$svc")"
  if [[ -n "$pid" ]]; then
    echo "[$(svc_label "$svc")] 시작됨 (PID: $pid). $url"
    echo "[$(svc_label "$svc")] 로그: $log"
  else
    echo "[$(svc_label "$svc")] 시작에 실패했습니다. 로그를 확인하세요: $log"
    return 1
  fi
}

stop_one() {
  local svc="$1" pid
  pid="$(running_pid "$svc")"
  if [[ -z "$pid" ]]; then
    echo "[$(svc_label "$svc")] 실행 중인 서버가 없습니다."
    rm -f "$(pid_file "$svc")"
    return 0
  fi

  echo "[$(svc_label "$svc")] 서버를 종료합니다 (PID: $pid)..."
  # 자식 프로세스(vite/tsx)까지 함께 종료
  kill "$pid" 2>/dev/null || true
  pkill -P "$pid" 2>/dev/null || true

  for _ in 1 2 3 4 5; do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 1
  done

  if kill -0 "$pid" 2>/dev/null; then
    echo "[$(svc_label "$svc")] 정상 종료되지 않아 강제 종료합니다..."
    kill -9 "$pid" 2>/dev/null || true
  fi

  rm -f "$(pid_file "$svc")"
  echo "[$(svc_label "$svc")] 종료 완료."
}

status_one() {
  local svc="$1" pid
  pid="$(running_pid "$svc")"
  if [[ -n "$pid" ]]; then
    echo "[$(svc_label "$svc")] 실행 중 (PID: $pid). $(svc_url "$svc")"
  else
    echo "[$(svc_label "$svc")] 중지됨."
  fi
}

logs_one() {
  local svc="$1" log
  log="$(log_file "$svc")"
  if [[ -f "$log" ]]; then
    tail -n 50 -f "$log"
  else
    echo "[$(svc_label "$svc")] 로그 파일이 없습니다: $log"
  fi
}

# 대상 서비스 목록을 인자에서 해석 (기본: all)
resolve_targets() {
  case "${1:-all}" in
    front) echo "front" ;;
    back)  echo "back" ;;
    all)   echo "back front" ;;  # 백엔드 먼저 띄워 프론트 요청 실패를 줄임
    *)
      echo "알 수 없는 대상: $1 (front|back|all 중 선택)" >&2
      exit 1
      ;;
  esac
}

ACTION="${1:-}"
TARGET_ARG="${2:-all}"

case "$ACTION" in
  start)
    for svc in $(resolve_targets "$TARGET_ARG"); do start_one "$svc"; done
    ;;
  stop)
    for svc in $(resolve_targets "$TARGET_ARG"); do stop_one "$svc"; done
    ;;
  restart)
    for svc in $(resolve_targets "$TARGET_ARG"); do stop_one "$svc"; done
    for svc in $(resolve_targets "$TARGET_ARG"); do start_one "$svc"; done
    ;;
  status)
    for svc in $(resolve_targets "$TARGET_ARG"); do status_one "$svc"; done
    ;;
  logs)
    # logs는 단일 대상만 tail (여러 로그 동시 follow는 혼란스러움)
    if [[ "$TARGET_ARG" == "all" ]]; then
      echo "logs는 대상을 지정하세요: $0 logs {front|back}"
      exit 1
    fi
    logs_one "$TARGET_ARG"
    ;;
  *)
    echo "사용법: $0 {start|stop|restart|status|logs} [front|back|all]"
    exit 1
    ;;
esac
