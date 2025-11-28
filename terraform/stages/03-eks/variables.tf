variable "environment" {
  description = "환경 (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "환경은 dev, staging, prod 중 하나여야 합니다."
  }
}

variable "cluster_name" {
  description = "EKS 클러스터 이름"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "퍼블릭 서브넷 ID 목록"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "프라이빗 서브넷 ID 목록"
  type        = list(string)
}

variable "eks_cluster_sg_id" {
  description = "EKS 클러스터 보안 그룹 ID"
  type        = string
}

# 백엔드 전용 노드 그룹 설정 (프로덕션: 각 AZ에 1개씩, 총 2개)
variable "backend_node_group" {
  description = "백엔드 전용 노드 그룹 설정"
  type = object({
    instance_types = list(string)
    desired_size   = number
    max_size       = number
    min_size       = number
  })
  default = {
    instance_types = ["t3.medium"]
    desired_size   = 2  # 각 AZ에 1개씩 (총 2개)
    max_size       = 4  # 스케일아웃 고려
    min_size       = 2  # 최소 2개 유지 (고가용성)
  }
}

# 모니터링 전용 노드 그룹 설정
variable "monitoring_node_group" {
  description = "모니터링 전용 노드 그룹 설정"
  type = object({
    instance_types = list(string)
    desired_size   = number
    max_size       = number
    min_size       = number
  })
  default = {
    instance_types = ["t3.large"]
    desired_size   = 1
    max_size       = 2
    min_size       = 1
  }
}

variable "common_tags" {
  description = "공통 태그"
  type        = map(string)
  default     = {}
}
