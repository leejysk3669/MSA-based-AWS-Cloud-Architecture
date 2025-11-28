output "oidc_provider_arn" {
  description = "OIDC Provider ARN"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "oidc_provider_url" {
  description = "OIDC Provider URL"
  value       = aws_iam_openid_connect_provider.eks.url
}

output "alb_controller_role_arn" {
  description = "ALB Controller IAM Role ARN"
  value       = aws_iam_role.alb_controller.arn
}

output "alb_controller_role_name" {
  description = "ALB Controller IAM Role Name"
  value       = aws_iam_role.alb_controller.name
}
