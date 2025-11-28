# API Gateway 복원 가이드

AWS 리소스를 삭제했다가 다시 만들 때 API Gateway를 완전히 복원하는 방법입니다.

## 📦 백업된 것

### Terraform State
- API Gateway 기본 설정 (REST API)
- Deployment
- Stage

### OpenAPI 백업 (backups/ 폴더)
- **51개 리소스** (`/api/board`, `/api/study-groups` 등)
- **119개 메서드** (GET, POST, PUT, DELETE, OPTIONS)
- **Integration 설정** (ALB 연결)
- **CORS 설정**

---

## 🔄 복원 절차

### 1단계: Terraform으로 기본 구조 생성

```powershell
cd terraform\stages\07-api-gateway
terraform init
terraform apply
```

**생성되는 것:**
- API Gateway (새 ID 생성됨)
- Deployment
- Stage (dev)

**새 API ID 확인:**
```powershell
terraform output api_gateway_id
```

---

### 2단계: OpenAPI Import로 리소스/메서드 복원

```powershell
# 새 API ID 가져오기
$NEW_API_ID = terraform output -raw api_gateway_id

# OpenAPI Import
aws apigateway put-rest-api `
  --rest-api-id $NEW_API_ID `
  --mode merge `
  --body fileb://backups/latest-openapi.json `
  --region ap-northeast-2
```

---

### 3단계: ALB DNS 업데이트

**방법 A: 자동 업데이트 (권장)**

```powershell
# 새 ALB DNS 확인
$NEW_ALB_DNS = kubectl get ingress -n hippo-project -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}'

# OpenAPI 파일에서 ALB DNS 일괄 교체
$content = Get-Content backups/latest-openapi.json -Raw
$OLD_ALB = "k8s-hippo-api-5ca1d6f5bb-1000868465.ap-northeast-2.elb.amazonaws.com"
$newContent = $content -replace [regex]::Escape($OLD_ALB), $NEW_ALB_DNS
$newContent | Set-Content backups/latest-openapi-updated.json

# 업데이트된 OpenAPI로 다시 Import
aws apigateway put-rest-api `
  --rest-api-id $NEW_API_ID `
  --mode overwrite `
  --body fileb://backups/latest-openapi-updated.json `
  --region ap-northeast-2
```

**방법 B: variables.tf 수정 (간단)**

새 EKS/ALB를 만들 때 `variables.tf`의 `alb_dns_name`을 먼저 업데이트하고 Terraform Apply

---

### 4단계: Deployment 생성

```powershell
aws apigateway create-deployment `
  --rest-api-id $NEW_API_ID `
  --stage-name dev `
  --description "복원 후 배포" `
  --region ap-northeast-2
```

---

### 5단계: 테스트

```powershell
# API Gateway URL 확인
$API_URL = terraform output -raw api_gateway_invoke_url
Write-Host "API Gateway URL: $API_URL"

# 엔드포인트 테스트
curl $API_URL/api/board/posts
```

---

## 📋 복원 체크리스트

### 백업 확인 (삭제 전)
- [ ] `terraform.tfstate` 파일 존재
- [ ] `backups/latest-openapi.json` 파일 존재 (61KB)
- [ ] 현재 ALB DNS 기록

### 복원 단계 (재생성 후)
- [ ] Terraform Apply 완료
- [ ] 새 API ID 확인
- [ ] OpenAPI Import 완료
- [ ] ALB DNS 업데이트 완료
- [ ] Deployment 생성
- [ ] API 엔드포인트 테스트

---

## 🚨 주의사항

### API ID 변경됨
- **Before**: `7d1opsumn9`
- **After**: `abc123xyz` (새로 생성됨)
- **영향**: 프론트엔드 API URL 수정 필요 (또는 도메인 사용)

### ALB DNS 변경됨
- EKS 재생성 시 ALB DNS도 변경됨
- OpenAPI Import 후 반드시 ALB DNS 업데이트 필요

---

## 💡 백업 실행

리소스 삭제 전에 백업 실행:

```powershell
cd terraform\stages\07-api-gateway
.\backup-api-gateway-simple.ps1
```

백업 파일이 `backups/` 폴더에 생성됩니다.

---

**작성일:** 2025-10-13
