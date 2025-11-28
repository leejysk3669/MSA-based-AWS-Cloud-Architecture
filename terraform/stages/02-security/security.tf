# EKS 클러스터 보안 그룹
resource "aws_security_group" "eks_cluster" {
  name_prefix = "hippo-eks-cluster-${var.environment}-"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "hippo-eks-cluster-sg-${var.environment}"
  })
}

# EKS 워커 노드 보안 그룹
resource "aws_security_group" "eks_worker" {
  name_prefix = "hippo-eks-worker-${var.environment}-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  ingress {
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "hippo-eks-worker-sg-${var.environment}"
  })
}

# RDS 보안 그룹
resource "aws_security_group" "rds" {
  name_prefix = "hippo-rds-${var.environment}-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_worker.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "hippo-rds-sg-${var.environment}"
  })
}

# ALB 보안 그룹은 ALB Controller가 자동으로 생성하므로 Terraform에서 관리하지 않음
# ALB Controller가 Ingress 리소스를 기반으로 ALB와 보안 그룹을 동적으로 생성/관리함

# EKS 클러스터 엔드포인트 보안 그룹 규칙
resource "aws_security_group_rule" "eks_cluster_endpoint" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.eks_worker.id
  security_group_id        = aws_security_group.eks_cluster.id
}

# EKS 워커 노드 간 통신 허용 (Pod to Pod)
resource "aws_security_group_rule" "eks_worker_to_worker" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "-1"
  source_security_group_id = aws_security_group.eks_worker.id
  security_group_id        = aws_security_group.eks_worker.id
  description              = "Allow worker nodes to communicate with each other"
}
