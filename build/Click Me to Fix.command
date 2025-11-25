#!/bin/bash

# [Omni Video Downloader 설치 도우미]
# 이 스크립트는 앱 실행 시 발생하는 '앱이 손상되었습니다' 경고를 해결합니다.
# 사용자의 개인정보나 다른 시스템 파일은 건드리지 않습니다.

# 1. 앱 이름 정의
APP_NAME="Omni Video Downloader.app"
APP_PATH="/Applications/$APP_NAME"

# 터미널 창 제목 설정
echo -n -e "\033]0;Omni Video Downloader 설치 도우미\007"

echo "========================================================"
echo "   Omni Video Downloader 실행 문제 해결 도우미"
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

# 3. 격리 속성 제거 (Gatekeeper 우회)
echo "🔧 보안 설정을 업데이트하는 중입니다..."
echo "비밀번호를 물어보면 맥북 로그인 비밀번호를 입력하고 엔터를 눌러주세요."
echo "(보안을 위해 비밀번호는 화면에 보이지 않습니다)"
echo ""

# sudo를 사용하여 확실하게 권한 획득 (xattr -cr 사용)
sudo xattr -cr "$APP_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 성공! 모든 설정이 완료되었습니다."
    echo "이제 응용 프로그램 폴더에서 앱을 실행할 수 있습니다."
    echo ""
    echo "앱을 실행합니다..."
    open "$APP_PATH"
else
    echo ""
    echo "⚠️ 설정 중 오류가 발생했습니다. 다시 시도하거나 개발자에게 문의하세요."
fi

echo ""
read -p "엔터 키를 누르면 창이 닫힙니다..."
exit 0