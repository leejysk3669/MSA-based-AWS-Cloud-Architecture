# Node.js 18 Alpine 이미지 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (개발 의존성 포함)
RUN npm install

# TypeScript 소스 코드 복사
COPY src/ ./src/
COPY tsconfig.json ./

# TypeScript 컴파일
RUN npm run build

# 프로덕션 의존성만 유지하고 개발 의존성 제거
RUN npm prune --production

# 포트 노출
EXPOSE 3003

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 애플리케이션 실행
CMD ["npm", "start"]
