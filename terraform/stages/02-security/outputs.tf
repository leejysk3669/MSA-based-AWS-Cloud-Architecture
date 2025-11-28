output "eks_cluster_sg_id" {
  description = "EKS 클러스터 보안 그룹 ID"
  value       = aws_security_group.eks_cluster.id
}

output "eks_worker_sg_id" {
  description = "EKS 워커 노드 보안 그룹 ID"
  value       = aws_security_group.eks_worker.id
}

output "rds_sg_id" {
  description = "RDS 보안 그룹 ID"
  value       = aws_security_group.rds.id
}

# ALB 보안 그룹은 ALB Controller가 자동 생성하므로 output에서 제거
# 필요 시 kubectl get ingress -n hippo-project 명령어로 ALB 주소 확인 후
# AWS Console이나 CLI로 보안 그룹 확인 가능
