# API Gateway 백업 스크립트 (Simple Version)

$API_ID = "7d1opsumn9"
$STAGE_NAME = "dev"
$REGION = "ap-northeast-2"
$BACKUP_DIR = "backups"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "========================================"
Write-Host "API Gateway 백업 시작"
Write-Host "========================================"
Write-Host "API ID: $API_ID"
Write-Host "Stage: $STAGE_NAME"
Write-Host "Region: $REGION"
Write-Host "========================================"
Write-Host ""

# 백업 디렉토리 생성
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# 1. OpenAPI 3.0 (YAML)
Write-Host "[1/6] OpenAPI 3.0 YAML Export..."
$yamlFile = "$BACKUP_DIR\api-gateway-openapi30-$DATE.yaml"
aws apigateway get-export --rest-api-id $API_ID --stage-name $STAGE_NAME --export-type oas30 --accepts application/yaml --region $REGION $yamlFile
if ($?) {
    Write-Host "   [OK] $yamlFile"
} else {
    Write-Host "   [ERROR] Failed"
}

# 2. OpenAPI 3.0 (JSON)
Write-Host "[2/6] OpenAPI 3.0 JSON Export..."
$jsonFile = "$BACKUP_DIR\api-gateway-openapi30-$DATE.json"
aws apigateway get-export --rest-api-id $API_ID --stage-name $STAGE_NAME --export-type oas30 --accepts application/json --region $REGION $jsonFile
if ($?) {
    Write-Host "   [OK] $jsonFile"
} else {
    Write-Host "   [ERROR] Failed"
}

# 3. Swagger 2.0 (JSON)
Write-Host "[3/6] Swagger 2.0 JSON Export..."
$swaggerFile = "$BACKUP_DIR\api-gateway-swagger-$DATE.json"
aws apigateway get-export --rest-api-id $API_ID --stage-name $STAGE_NAME --export-type swagger --accepts application/json --region $REGION $swaggerFile
if ($?) {
    Write-Host "   [OK] $swaggerFile"
} else {
    Write-Host "   [ERROR] Failed"
}

# 4. REST API 메타데이터
Write-Host "[4/6] REST API Metadata..."
$metadataFile = "$BACKUP_DIR\api-gateway-metadata-$DATE.json"
aws apigateway get-rest-api --rest-api-id $API_ID --region $REGION > $metadataFile
if ($?) {
    Write-Host "   [OK] $metadataFile"
} else {
    Write-Host "   [ERROR] Failed"
}

# 5. Stage 설정
Write-Host "[5/6] Stage Configuration..."
$stageFile = "$BACKUP_DIR\api-gateway-stage-$DATE.json"
aws apigateway get-stage --rest-api-id $API_ID --stage-name $STAGE_NAME --region $REGION > $stageFile
if ($?) {
    Write-Host "   [OK] $stageFile"
} else {
    Write-Host "   [ERROR] Failed"
}

# 6. 리소스 목록
Write-Host "[6/6] Resources List..."
$resourcesFile = "$BACKUP_DIR\api-gateway-resources-$DATE.json"
aws apigateway get-resources --rest-api-id $API_ID --region $REGION > $resourcesFile
if ($?) {
    Write-Host "   [OK] $resourcesFile"
} else {
    Write-Host "   [ERROR] Failed"
}

# 최신 백업 복사
Copy-Item $jsonFile "$BACKUP_DIR\latest-openapi.json" -Force
Copy-Item $yamlFile "$BACKUP_DIR\latest-openapi.yaml" -Force

Write-Host ""
Write-Host "========================================"
Write-Host "Backup Complete!"
Write-Host "========================================"
Write-Host ""
Write-Host "Backup Location: $BACKUP_DIR\"
Get-ChildItem $BACKUP_DIR\*-$DATE.* | Format-Table Name, Length, LastWriteTime
Write-Host ""
Write-Host "========================================"
Write-Host ""
Write-Host "To Restore:"
Write-Host ""
Write-Host "[1] Terraform Apply:"
Write-Host "   cd terraform\stages\07-api-gateway"
Write-Host "   terraform init"
Write-Host "   terraform apply"
Write-Host ""
Write-Host "[2] OpenAPI Import:"
Write-Host "   `$NEW_API_ID = terraform output -raw api_gateway_id"
Write-Host "   aws apigateway put-rest-api --rest-api-id `$NEW_API_ID --mode merge --body file://$BACKUP_DIR\latest-openapi.json --region $REGION"
Write-Host ""
Write-Host "[3] Create Deployment:"
Write-Host "   aws apigateway create-deployment --rest-api-id `$NEW_API_ID --stage-name $STAGE_NAME --region $REGION"
Write-Host ""
Write-Host "========================================"

