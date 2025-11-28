# AWS에 수동으로 생성된 API Gateway를 Terraform으로 관리
# Import 명령어: terraform import aws_api_gateway_rest_api.main 7d1opsumn9

resource "aws_api_gateway_rest_api" "main" {
  name        = "hippo-api-gateway-${var.environment}"
  description = "Hippo Community API Gateway"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  # 현재 AWS에 있는 API Gateway의 Policy
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = "execute-api:Invoke"
        Resource  = "arn:aws:execute-api:ap-northeast-2:495547542579:*/${var.environment}/*/*"
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "hippo-api-gateway-${var.environment}"
    }
  )
}

# API Gateway Deployment
# Import 명령어: terraform import aws_api_gateway_deployment.main 7d1opsumn9/h0qgtq
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  # 리소스나 메서드가 변경될 때마다 새로운 배포 생성
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_rest_api.main.body,
      timestamp()
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_rest_api.main
  ]
}

# API Gateway Stage
# Import 명령어: terraform import aws_api_gateway_stage.main 7d1opsumn9/dev
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  # Stage 설정
  cache_cluster_enabled = false
  xray_tracing_enabled  = false

  # 로깅 및 모니터링 설정
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  # Method 설정
  variables = {
    backend_url = var.alb_dns_name
  }

  tags = merge(
    var.common_tags,
    {
      Name = "hippo-api-gateway-stage-${var.environment}"
    }
  )
}

# CloudWatch Logs for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/hippo-${var.environment}"
  retention_in_days = 7

  tags = var.common_tags
}

# API Gateway Account (CloudWatch Logs 권한)
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# IAM Role for API Gateway CloudWatch Logs
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "api-gateway-cloudwatch-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# IAM Policy Attachment
resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

