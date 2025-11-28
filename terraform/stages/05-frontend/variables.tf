variable "environment" {
  description = "환경 (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "환경은 dev, staging, prod 중 하나여야 합니다."
  }
}

variable "s3_name" {
  description = "S3 버킷 이름"
  type        = string
  default     = "hippo-community-frontend"  # 현재 운영 중인 버킷 이름
}

variable "domain_name" {
  description = "도메인 이름 (선택사항)"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "SSL 인증서 ARN (선택사항)"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "공통 태그"
  type        = map(string)
  default     = {}
}

# CloudFront 관련 변수 추가
variable "cloudfront_domain_name" {
  description = "CloudFront 도메인 이름"
  type        = string
  default     = "d12so42486otqg.cloudfront.net"  # 현재 운영 중인 CloudFront 도메인
}
