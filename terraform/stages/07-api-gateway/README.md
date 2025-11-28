# API Gateway

AWS API Gateway (REST API) 관리

## 📁 파일 구조

```
07-api-gateway/
├── api-gateway.tf                    # REST API 정의
├── variables.tf                      # 변수 (ALB DNS 등)
├── outputs.tf                        # 출력 값
├── backup-api-gateway-simple.ps1     # OpenAPI 백업 스크립트
├── RESTORE_GUIDE.md                  # 복원 가이드
└── backups/                          # OpenAPI 백업 파일
    └── latest-openapi.json           # 최신 백업 (복원용)
```

## 🚀 사용법

### 백업
```powershell
.\backup-api-gateway-simple.ps1
```

### 복원
[RESTORE_GUIDE.md](./RESTORE_GUIDE.md) 참고

## 📝 참고

- **ALB DNS**: EKS 재생성 시 `variables.tf`에서 `alb_dns_name` 수정 필요
- **메서드/리소스**: Terraform으로 관리되지 않음 (OpenAPI 백업으로 복원)

