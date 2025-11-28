FROM node:18-alpine

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치 (개발 의존성 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# 프로덕션 의존성만 유지
RUN npm prune --production

# 포트 노출
EXPOSE 3004

# 서버 실행
CMD ["npm", "start"]
