output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR 블록"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "퍼블릭 서브넷 ID 목록"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "프라이빗 서브넷 ID 목록"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "인터넷 게이트웨이 ID"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "NAT 게이트웨이 ID 목록 (각 AZ마다 1개)"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_eip_addresses" {
  description = "NAT 게이트웨이의 Elastic IP 주소 목록"
  value       = aws_eip.nat[*].public_ip
}
