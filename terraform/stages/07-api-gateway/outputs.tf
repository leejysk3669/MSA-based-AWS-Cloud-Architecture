output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_root_resource_id" {
  description = "API Gateway Root Resource ID"
  value       = aws_api_gateway_rest_api.main.root_resource_id
}

output "api_gateway_execution_arn" {
  description = "API Gateway Execution ARN"
  value       = aws_api_gateway_rest_api.main.execution_arn
}

output "api_gateway_invoke_url" {
  description = "API Gateway 호출 URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_stage_name" {
  description = "API Gateway Stage 이름"
  value       = aws_api_gateway_stage.main.stage_name
}

output "cloudwatch_log_group_name" {
  description = "API Gateway CloudWatch Log Group 이름"
  value       = aws_cloudwatch_log_group.api_gateway.name
}

