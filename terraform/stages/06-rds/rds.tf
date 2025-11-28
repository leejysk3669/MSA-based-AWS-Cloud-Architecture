# RDS 서브넷 그룹
resource "aws_db_subnet_group" "main" {
  name       = "hippo-rds-subnet-group-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = var.common_tags
}

# RDS 파라미터 그룹
resource "aws_db_parameter_group" "main" {
  family = "postgres17"
  name   = "hippo-rds-params-${var.environment}"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = var.common_tags
}

# RDS 옵션 그룹
resource "aws_db_option_group" "main" {
  name                     = "hippo-rds-options-${var.environment}"
  engine_name              = "postgres"
  major_engine_version     = "17"
  option_group_description = "Hippo project RDS option group"

  tags = var.common_tags
}

# RDS 인스턴스 (Multi-AZ 고가용성 구성)
resource "aws_db_instance" "main" {
  identifier = var.rds_name

  engine         = "postgres"
  engine_version = "17.6"
  instance_class = var.rds_instance_class

  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "hippo_unified_db"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [var.rds_sg_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name
  option_group_name      = aws_db_option_group.main.name

  # 고가용성 설정
  multi_az               = var.environment == "prod" ? true : false  # 프로덕션에서만 Multi-AZ 활성화
  publicly_accessible    = false

  # 백업 및 유지보수
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # 스냅샷 및 삭제 보호
  skip_final_snapshot       = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment == "dev" ? null : "${var.rds_name}-final-snapshot"
  deletion_protection       = var.environment == "prod" ? true : false

  # 성능 개선
  performance_insights_enabled = true
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = var.common_tags
}
