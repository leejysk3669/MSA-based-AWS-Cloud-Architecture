# S3 버킷 (프론트엔드 정적 파일 호스팅)
resource "aws_s3_bucket" "frontend" {
  bucket = var.s3_name

  tags = var.common_tags
}

# S3 버킷 버전 관리 (현재 AWS에서는 비활성화되어 있음)
# resource "aws_s3_bucket_versioning" "frontend" {
#   bucket = aws_s3_bucket.frontend.id
#   versioning_configuration {
#     status = "Enabled"
#   }
# }

# S3 버킷 서버 사이드 암호화
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 버킷 퍼블릭 액세스 차단 (현재 AWS 설정과 동일하게)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 버킷 웹사이트 설정 (CloudFront Origin용)
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # SPA 라우팅을 위해 모든 에러를 index.html로 리다이렉트
  }
}

# S3 버킷 CORS 설정
resource "aws_s3_bucket_cors_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 버킷 정책 (현재 AWS 설정과 동일하게 - Public Read 허용)
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

# S3 버킷 수명 주기 정책 (현재 AWS에서는 설정되어 있지 않음)
# resource "aws_s3_bucket_lifecycle_configuration" "frontend" {
#   bucket = aws_s3_bucket.frontend.id

#   rule {
#     id     = "cleanup_old_versions"
#     status = "Enabled"
    
#     filter {
#       prefix = ""  # 모든 객체에 적용
#     }

#     noncurrent_version_expiration {
#       noncurrent_days = 30
#     }
#   }
# }

# S3 버킷 로깅 (개발 환경에서는 비활성화 - 무한 루프 방지)
# resource "aws_s3_bucket_logging" "frontend" {
#   bucket = aws_s3_bucket.frontend.id
#   target_bucket = aws_s3_bucket_logs.id  # 별도 로그 버킷 필요
#   target_prefix = "frontend-logs/"
# }
