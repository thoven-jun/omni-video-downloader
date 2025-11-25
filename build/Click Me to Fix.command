#!/bin/bash

# [Omni Video Downloader 설치 도우미 v1.1]
# 이 스크립트는 앱 실행 시 발생하는 '앱 손상' 경고 및 '다운로드 오류(EACCES)'를 해결합니다.

# 1. 앱 이름 및 경로 정의
APP_NAME="Omni Video Downloader.app"
APP_PATH="/Applications/$APP_NAME"
BINARY_PATH="$APP_PATH/Contents/Resources/binaries"

# 터미널 창 제목 설정
echo -n -e "\033]0;Omni Video Downloader 설치 도우미\007"

echo "========================================================"
echo "   Omni Video Downloader 설치 및 권한 복구 도우미"
echo "========================================================"
echo ""

# 2. 앱이 응용 프로그램 폴더에 있는지 확인
if [ ! -d "$APP_PATH" ]; then
    echo "❌ 오류: 앱을 찾을 수 없습니다."
    echo "먼저 '$APP_NAME'을 'Applications(응용 프로그램)' 폴더로 드래그해서 넣어주세요."
    echo ""
    read -p "엔터 키를 누르면 종료됩니다..."
    exit 1
fi

echo "🔧 보안 설정 및 실행 권한을 복구합니다..."
echo "비밀번호를 물어보면 맥북 로그인 비밀번호를 입력하고 엔터를 눌러주세요."
echo "(보안을 위해 비밀번호는 화면에 보이지 않습니다)"
echo ""

# 3. [핵심] 격리 속성 제거 (Gatekeeper 우회)
sudo xattr -cr "$APP_PATH"

# 4. [추가됨] 내부 다운로드 엔진(yt-dlp, ffmpeg)에 실행 권한 강제 부여
if [ -d "$BINARY_PATH" ]; then
    echo "⚙️ 다운로드 엔진 권한 복구 중..."
    sudo chmod +x "$BINARY_PATH/yt-dlp"
    sudo chmod +x "$BINARY_PATH/ffmpeg"
else
    echo "⚠️ 경고: 내부 바이너리 폴더를 찾을 수 없습니다. (경로 확인 필요)"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 성공! 모든 설정이 완료되었습니다."
    echo "이제 응용 프로그램 폴더에서 앱을 실행하여 다운로드를 시도해보세요."
    echo ""
    echo "앱을 실행합니다..."
    open "$APP_PATH"
else
    echo ""
    echo "⚠️ 설정 중 오류가 발생했습니다. 비밀번호가 틀렸거나 권한 문제일 수 있습니다."
fi

echo ""
read -p "엔터 키를 누르면 창이 닫힙니다..."
exit 0