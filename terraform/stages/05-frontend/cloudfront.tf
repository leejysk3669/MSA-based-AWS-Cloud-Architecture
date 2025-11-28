# CloudFront Origin Access Control (OAC) - 현재 AWS에서는 사용하지 않음
# resource "aws_cloudfront_origin_access_control" "frontend" {
#   name                              = "hippo-frontend-oac-${var.environment}"
#   description                       = "Origin Access Control for S3 Frontend"
#   origin_access_control_origin_type = "s3"
#   signing_behavior                  = "always"
#   signing_protocol                  = "sigv4"
# }

# CloudFront 배포
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All"  # 현재 AWS 설정과 동일

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Origin 설정 (S3 Website - 현재 AWS 설정과 동일)
  origin {
    domain_name = "${aws_s3_bucket.frontend.id}.s3-website.ap-northeast-2.amazonaws.com"
    origin_id   = "${aws_s3_bucket.frontend.id}.s3.ap-northeast-2.amazonaws.com-mewqfddt5bo"

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "http-only"
      origin_ssl_protocols     = ["SSLv3", "TLSv1", "TLSv1.1", "TLSv1.2"]
      origin_read_timeout      = 30
      origin_keepalive_timeout = 5
    }

    connection_attempts = 3
    connection_timeout  = 10
  }

  # API Gateway Origin (현재 AWS 설정과 동일)
  origin {
    domain_name = "1hboxcdau6.execute-api.ap-northeast-2.amazonaws.com"
    origin_id   = "1hboxcdau6.execute-api.ap-northeast-2.amazonaws.com"
    origin_path = "/dev"

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1.2"]
      origin_read_timeout      = 30
      origin_keepalive_timeout = 5
    }

    connection_attempts = 3
    connection_timeout  = 10
  }

  # 기본 캐시 동작 (현재 AWS 설정과 동일)
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${aws_s3_bucket.frontend.id}.s3.ap-northeast-2.amazonaws.com-mewqfddt5bo"

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"  # 현재 AWS에서 사용하는 정책
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"  # 현재 AWS에서 사용하는 정책

    viewer_protocol_policy = "https-only"  # 현재 AWS 설정과 동일
    compress               = true
  }

  # API 경로 캐시 동작 (현재 AWS 설정과 동일)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "1hboxcdau6.execute-api.ap-northeast-2.amazonaws.com"

    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"  # 현재 AWS에서 사용하는 정책
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"  # 현재 AWS에서 사용하는 정책

    viewer_protocol_policy = "https-only"  # 현재 AWS 설정과 동일
    compress               = true
  }

  # 루트 도메인 설정
  aliases = var.domain_name != "" ? [var.domain_name] : []

  # SSL 인증서 설정 (현재 AWS 설정과 동일)
  viewer_certificate {
    cloudfront_default_certificate = true
    ssl_support_method             = "vip"
    minimum_protocol_version       = "TLSv1"
  }

  # 로깅 설정 (개발 환경에서는 비활성화)
  # logging_config {
  #   include_cookies = false
  #   bucket          = aws_s3_bucket.frontend.bucket_domain_name
  #   prefix          = "cloudfront-logs/"
  # }

  # 에러 페이지 설정 (현재 AWS 설정과 동일)
  custom_error_response {
    error_code            = 403
    response_code         = "200"
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = "200"
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  # 태그
  tags = var.common_tags
}

# S3 버킷 정책은 s3.tf에서 관리 (Public Read 허용)
# 이 파일의 S3 버킷 정책은 제거

# AWS Region 데이터 소스 제거 (하드코딩으로 대체)
