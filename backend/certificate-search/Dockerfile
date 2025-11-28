# 1. 빌드 스테이지
FROM node:18-alpine AS builder

# 2. 작업 디렉토리 설정
WORKDIR /usr/src/app

# 3. package.json 및 package-lock.json 복사
COPY package*.json ./

# 4. 모든 의존성 설치 (개발 의존성 포함)
RUN npm ci && npm cache clean --force

# 5. 프로덕션 스테이지
FROM node:18-alpine AS production

# 6. 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 7. 작업 디렉토리 설정
WORKDIR /usr/src/app

# 8. 빌드 스테이지에서 필요한 파일들 복사
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# 9. 애플리케이션이 사용할 포트 노출
EXPOSE 5000

# 10. 사용자 변경
USER nodejs

# 11. 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 12. 컨테이너 시작 시 실행할 명령어
CMD [ "node", "server.js" ]
