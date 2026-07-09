#!/usr/bin/env pwsh
#
# 프론트엔드 개발 서버 관리 스크립트 (Windows/PowerShell용)
# 사용법: .\scripts\dev-server.ps1 {start|stop|restart|status|logs}
#
param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'logs')]
    [string]$Action
)

$ErrorActionPreference = 'Stop'

# 저장소 루트 (이 스크립트 위치 기준)
$RootDir = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $RootDir 'frontend'
$RunDir = Join-Path $RootDir '.run'
$PidFile = Join-Path $RunDir 'dev-server.pid'
$LogFile = Join-Path $RunDir 'dev-server.log'

New-Item -ItemType Directory -Force -Path $RunDir | Out-Null

# 실행 중인 서버 PID를 반환 (없으면 $null)
function Get-RunningPid {
    if (Test-Path $PidFile) {
        $pid_ = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($pid_ -and (Get-Process -Id $pid_ -ErrorAction SilentlyContinue)) {
            return $pid_
        }
    }
    return $null
}

# 지정한 PID와 그 하위(자식/손자...) 프로세스를 모두 종료
function Stop-ProcessTree {
    param([int]$RootPid)

    $childProcesses = Get-CimInstance Win32_Process -Filter "ParentProcessId = $RootPid" -ErrorAction SilentlyContinue
    foreach ($child in $childProcesses) {
        Stop-ProcessTree -RootPid $child.ProcessId
    }

    Stop-Process -Id $RootPid -Force -ErrorAction SilentlyContinue
}

function Start-DevServer {
    $existingPid = Get-RunningPid
    if ($existingPid) {
        Write-Host "이미 실행 중입니다 (PID: $existingPid). http://localhost:5173/"
        return
    }

    if (-not (Test-Path (Join-Path $FrontendDir 'node_modules'))) {
        Write-Host '의존성이 없어 설치합니다...'
        Push-Location $FrontendDir
        try {
            npm install
        } finally {
            Pop-Location
        }
    }

    Write-Host '개발 서버를 시작합니다...'
    $process = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev' `
        -WorkingDirectory $FrontendDir `
        -RedirectStandardOutput $LogFile `
        -RedirectStandardError "$LogFile.err" `
        -WindowStyle Hidden `
        -PassThru

    Set-Content -Path $PidFile -Value $process.Id

    Start-Sleep -Seconds 1
    $runningPid = Get-RunningPid
    if ($runningPid) {
        Write-Host "시작됨 (PID: $runningPid). http://localhost:5173/"
        Write-Host "로그: $LogFile"
    } else {
        Write-Host "시작에 실패했습니다. 로그를 확인하세요: $LogFile"
        exit 1
    }
}

function Stop-DevServer {
    $targetPid = Get-RunningPid
    if (-not $targetPid) {
        Write-Host '실행 중인 서버가 없습니다.'
        Remove-Item -Path $PidFile -ErrorAction SilentlyContinue
        return
    }

    Write-Host "서버를 종료합니다 (PID: $targetPid)..."
    # 자식/손자 프로세스(npm/node/vite)까지 재귀적으로 함께 종료
    Stop-ProcessTree -RootPid $targetPid

    Remove-Item -Path $PidFile -ErrorAction SilentlyContinue
    Write-Host '종료 완료.'
}

function Get-DevServerStatus {
    $runningPid = Get-RunningPid
    if ($runningPid) {
        Write-Host "실행 중 (PID: $runningPid). http://localhost:5173/"
    } else {
        Write-Host '중지됨.'
    }
}

function Show-DevServerLogs {
    if (Test-Path $LogFile) {
        Get-Content -Path $LogFile -Tail 50 -Wait
    } else {
        Write-Host "로그 파일이 없습니다: $LogFile"
    }
}

switch ($Action) {
    'start'   { Start-DevServer }
    'stop'    { Stop-DevServer }
    'restart' { Stop-DevServer; Start-DevServer }
    'status'  { Get-DevServerStatus }
    'logs'    { Show-DevServerLogs }
    default {
        Write-Host "사용법: $($MyInvocation.MyCommand.Name) {start|stop|restart|status|logs}"
        exit 1
    }
}
