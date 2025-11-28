# EKS 클러스터 정보 조회 (issuer URL 동적 획득)
data "aws_eks_cluster" "this" {
  name = var.cluster_name
}

# OIDC Issuer의 인증서에서 thumbprint 동적 추출
data "tls_certificate" "this" {
  url = data.aws_eks_cluster.this.identity[0].oidc[0].issuer
}

# IAM OIDC Provider를 생성 (존재 가정하지 않음)
resource "aws_iam_openid_connect_provider" "eks" {
  url             = data.aws_eks_cluster.this.identity[0].oidc[0].issuer
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.this.certificates[0].sha1_fingerprint]

  tags = var.common_tags
}

# ALB Controller IAM Role
resource "aws_iam_role" "alb_controller" {
  name = "alb-controller-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.eks.arn
        }
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub": "system:serviceaccount:kube-system:aws-load-balancer-controller"
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud": "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = var.common_tags
}

# ALB Controller IAM Policy
resource "aws_iam_policy" "alb_controller" {
  name        = "alb-controller-policy-${var.environment}"
  description = "IAM policy for ALB Controller"

  policy = file("${path.module}/alb-controller-policy.json")

  tags = var.common_tags
}

# Attach ALB Controller Policy to Role
resource "aws_iam_role_policy_attachment" "alb_controller" {
  policy_arn = aws_iam_policy.alb_controller.arn
  role       = aws_iam_role.alb_controller.name
}
