#!/bin/bash

# Docker Hub 사용자명 설정 (실제 사용 시 변경 필요)
DOCKER_USERNAME="your-dockerhub-username"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Docker Hub 빌드 및 푸시 스크립트 시작${NC}"

# Docker Hub 로그인 확인
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker가 실행되지 않고 있습니다. Docker를 시작해주세요.${NC}"
    exit 1
fi

# Docker Hub 로그인
echo -e "${YELLOW}🔐 Docker Hub 로그인 중...${NC}"
docker login

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker Hub 로그인에 실패했습니다.${NC}"
    exit 1
fi

# 서비스 목록
SERVICES=(
    "jobs-news-api:3004"
    "community-board-api:3002"
    "study-group-api:3003"
)

# 각 서비스 빌드 및 푸시
for service in "${SERVICES[@]}"; do
    IFS=':' read -r service_name port <<< "$service"
    
    echo -e "${BLUE}📦 ${service_name} 빌드 중...${NC}"
    
    # 서비스 디렉토리로 이동
    cd "$service_name"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ ${service_name} 디렉토리를 찾을 수 없습니다.${NC}"
        continue
    fi
    
    # Docker 이미지 빌드
    echo -e "${YELLOW}🔨 Docker 이미지 빌드 중: ${DOCKER_USERNAME}/${service_name}:latest${NC}"
    docker build -t "${DOCKER_USERNAME}/${service_name}:latest" .
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ ${service_name} 빌드에 실패했습니다.${NC}"
        cd ..
        continue
    fi
    
    # Docker Hub에 푸시
    echo -e "${YELLOW}📤 Docker Hub에 푸시 중: ${DOCKER_USERNAME}/${service_name}:latest${NC}"
    docker push "${DOCKER_USERNAME}/${service_name}:latest"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${service_name} 빌드 및 푸시 완료!${NC}"
        echo -e "${GREEN}   📍 이미지: ${DOCKER_USERNAME}/${service_name}:latest${NC}"
        echo -e "${GREEN}   🌐 포트: ${port}${NC}"
    else
        echo -e "${RED}❌ ${service_name} 푸시에 실패했습니다.${NC}"
    fi
    
    # 상위 디렉토리로 이동
    cd ..
    
    echo ""
done

echo -e "${GREEN}🎉 모든 서비스 빌드 및 푸시 완료!${NC}"
echo ""
echo -e "${BLUE}📋 다음 단계:${NC}"
echo -e "${YELLOW}1. 쿠버네티스 매니페스트에서 이미지 경로 업데이트${NC}"
echo -e "${YELLOW}2. Docker Hub 사용자명을 실제 사용자명으로 변경${NC}"
echo -e "${YELLOW}3. 쿠버네티스에 배포${NC}"
echo ""
echo -e "${BLUE}🔗 Docker Hub 이미지 목록:${NC}"
for service in "${SERVICES[@]}"; do
    IFS=':' read -r service_name port <<< "$service"
    echo -e "${GREEN}   • ${DOCKER_USERNAME}/${service_name}:latest${NC}"
done
