output "rds_endpoint" {
  description = "RDS 엔드포인트"
  value       = aws_db_instance.main.endpoint
}

output "rds_port" {
  description = "RDS 포트"
  value       = aws_db_instance.main.port
}

output "rds_database_name" {
  description = "RDS 데이터베이스 이름"
  value       = aws_db_instance.main.db_name
}

output "rds_username" {
  description = "RDS 사용자명"
  value       = aws_db_instance.main.username
  sensitive   = true
}
