# Kubernetes Provider 설정
terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

provider "kubernetes" {
  host                   = aws_eks_cluster.main.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", aws_eks_cluster.main.name]
  }
}

# EKS 클러스터 IAM 역할
resource "aws_iam_role" "eks_cluster" {
  name = "hippo-eks-cluster-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# EKS 클러스터 정책 연결
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

# EKS 클러스터
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = concat(var.public_subnet_ids, var.private_subnet_ids)
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [var.eks_cluster_sg_id]
  }

  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]

  tags = var.common_tags
}

# EKS 노드 그룹 IAM 역할
resource "aws_iam_role" "eks_node_group" {
  name = "hippo-eks-node-group-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# EKS 노드 그룹 정책 연결
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

# 백엔드 전용 노드 그룹
resource "aws_eks_node_group" "backend" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "backend-nodes"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = var.private_subnet_ids
  version         = aws_eks_cluster.main.version

  scaling_config {
    desired_size = var.backend_node_group.desired_size
    max_size     = var.backend_node_group.max_size
    min_size     = var.backend_node_group.min_size
  }

  instance_types = var.backend_node_group.instance_types

  labels = {
    node-type = "backend"
  }

  taint {
    key    = "node-type"
    value  = "backend"
    effect = "NO_SCHEDULE"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.ecr_read_only
  ]

  tags = var.common_tags
}

# 모니터링 전용 노드 그룹
resource "aws_eks_node_group" "monitoring" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "monitoring-nodes"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = var.private_subnet_ids
  version         = aws_eks_cluster.main.version

  scaling_config {
    desired_size = var.monitoring_node_group.desired_size
    max_size     = var.monitoring_node_group.max_size
    min_size     = var.monitoring_node_group.min_size
  }

  instance_types = var.monitoring_node_group.instance_types

  labels = {
    node-type = "monitoring"
  }

  taint {
    key    = "node-type"
    value  = "monitoring"
    effect = "NO_SCHEDULE"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.ecr_read_only
  ]

  tags = var.common_tags
}

# CoreDNS는 EKS에서 자동으로 생성되므로 Terraform으로 관리하지 않음
# 필요시 수동으로 patch: kubectl patch deployment coredns -n kube-system --type='json' -p='[{"op": "add", "path": "/spec/template/spec/tolerations/-", "value": {"key": "node-type", "operator": "Exists", "effect": "NoSchedule"}}]'
