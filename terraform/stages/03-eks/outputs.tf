output "cluster_name" {
  description = "EKS 클러스터 이름"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "EKS 클러스터 엔드포인트"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "EKS 클러스터 인증서 데이터"
  value       = aws_eks_cluster.main.certificate_authority[0].data
}

output "cluster_oidc_issuer_url" {
  description = "EKS 클러스터 OIDC 발급자 URL"
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

# 백엔드 노드 그룹 정보
output "backend_node_group_name" {
  description = "백엔드 노드 그룹 이름"
  value       = aws_eks_node_group.backend.node_group_name
}

output "backend_node_group_arn" {
  description = "백엔드 노드 그룹 ARN"
  value       = aws_eks_node_group.backend.arn
}

# 모니터링 노드 그룹 정보
output "monitoring_node_group_name" {
  description = "모니터링 노드 그룹 이름"
  value       = aws_eks_node_group.monitoring.node_group_name
}

output "monitoring_node_group_arn" {
  description = "모니터링 노드 그룹 ARN"
  value       = aws_eks_node_group.monitoring.arn
}
