# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "hippo-vpc-${var.environment}"
  })
}

# 인터넷 게이트웨이
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "hippo-igw-${var.environment}"
  })
}

# 퍼블릭 서브넷
resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "hippo-public-subnet-${var.availability_zones[count.index]}-${var.environment}"
    "kubernetes.io/cluster/hippo-eks-${var.environment}" = "shared"
    "kubernetes.io/role/elb"                            = "1"
  })
}

# 프라이빗 서브넷
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.common_tags, {
    Name = "hippo-private-subnet-${var.availability_zones[count.index]}-${var.environment}"
    "kubernetes.io/cluster/hippo-eks-${var.environment}" = "shared"
    "kubernetes.io/role/internal-elb"                   = "1"
  })
}

# EIP (NAT Gateway용) - 각 AZ마다 1개씩
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "hippo-nat-eip-${var.availability_zones[count.index]}-${var.environment}"
  })
}

# NAT Gateway - 각 AZ의 퍼블릭 서브넷에 1개씩 배치 (고가용성)
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.common_tags, {
    Name = "hippo-nat-gateway-${var.availability_zones[count.index]}-${var.environment}"
  })

  depends_on = [aws_internet_gateway.main]
}

# 퍼블릭 라우팅 테이블
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name = "hippo-public-rt-${var.environment}"
  })
}

# 프라이빗 라우팅 테이블 - 각 AZ마다 독립적으로 생성
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id  # 같은 AZ의 NAT Gateway 사용
  }

  tags = merge(var.common_tags, {
    Name = "hippo-private-rt-${var.availability_zones[count.index]}-${var.environment}"
  })
}

# 퍼블릭 서브넷 라우팅 테이블 연결
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# 프라이빗 서브넷 라우팅 테이블 연결
resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
