variable "environment" {
  description = "환경 (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "common_tags" {
  description = "공통 태그"
  type        = map(string)
  default = {
    Project     = "Hippo"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

variable "alb_dns_name" {
  description = "EKS ALB의 DNS 이름 (EKS 재생성 시 변경 필요!)"
  type        = string
  # EKS 재생성 시 kubectl get ingress -n hippo-project 로 확인하여 업데이트
  default     = "k8s-hippo-api-5ca1d6f5bb-1000868465.ap-northeast-2.elb.amazonaws.com"
}

variable "cors_allowed_origin" {
  description = "CORS에서 허용할 Origin (고정값 - CloudFront 도메인)"
  type        = string
  default     = "https://seesun.cloud"  # 변경 불필요
}

