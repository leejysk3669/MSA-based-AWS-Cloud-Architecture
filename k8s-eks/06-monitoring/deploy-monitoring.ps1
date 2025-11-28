# 모니터링 스택 배포 스크립트 (PowerShell)
Write-Host "🚀 Hippo Project 모니터링 스택 배포 시작..." -ForegroundColor Green

# 네임스페이스 생성
Write-Host "📁 모니터링 네임스페이스 생성..." -ForegroundColor Yellow
kubectl apply -f namespace.yaml

# Prometheus 배포
Write-Host "📊 Prometheus 배포..." -ForegroundColor Yellow
kubectl apply -f prometheus-config.yaml
kubectl apply -f prometheus-deployment.yaml

# Grafana 배포
Write-Host "📈 Grafana 배포..." -ForegroundColor Yellow
kubectl apply -f grafana-dashboard-config.yaml
kubectl apply -f grafana-notification-channels.yaml
kubectl apply -f grafana-deployment.yaml

# AlertManager 배포
Write-Host "🚨 AlertManager 배포..." -ForegroundColor Yellow
kubectl apply -f alertmanager-deployment.yaml

# CloudWatch Exporter 배포
Write-Host "☁️ CloudWatch Exporter 배포..." -ForegroundColor Yellow
kubectl apply -f cloudwatch-exporter.yaml
kubectl apply -f cloudwatch-exporter-iam.yaml

# Ingress 설정
Write-Host "🌐 모니터링 Ingress 설정..." -ForegroundColor Yellow
kubectl apply -f monitoring-ingress.yaml

# 배포 상태 확인
Write-Host "⏳ 배포 상태 확인 중..." -ForegroundColor Yellow
kubectl get pods -n monitoring

Write-Host "✅ 모니터링 스택 배포 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 접속 정보:" -ForegroundColor Cyan
Write-Host "  - Grafana: http://monitoring.hippo-project.com/grafana (admin/admin123)" -ForegroundColor White
Write-Host "  - Prometheus: http://monitoring.hippo-project.com/prometheus" -ForegroundColor White
Write-Host "  - AlertManager: http://monitoring.hippo-project.com/alertmanager" -ForegroundColor White
Write-Host ""
Write-Host "🔍 상태 확인 명령어:" -ForegroundColor Cyan
Write-Host "  kubectl get pods -n monitoring" -ForegroundColor White
Write-Host "  kubectl get svc -n monitoring" -ForegroundColor White
Write-Host "  kubectl get ingress -n monitoring" -ForegroundColor White
