# Hippo Project 모니터링 상태 확인 스크립트
Write-Host "🚀 Hippo Project 모니터링 상태 확인" -ForegroundColor Green
Write-Host ""

# Pod 상태 확인
Write-Host "📊 Pod 상태:" -ForegroundColor Yellow
kubectl get pods -n monitoring
kubectl get pods -n default

Write-Host ""
Write-Host "💻 리소스 사용량:" -ForegroundColor Yellow
kubectl top pods -n monitoring
kubectl top nodes

Write-Host ""
Write-Host "🌐 서비스 상태:" -ForegroundColor Yellow
kubectl get svc -n monitoring
kubectl get ingress -n monitoring

Write-Host ""
Write-Host "📈 접속 정보:" -ForegroundColor Cyan
Write-Host "  - CloudWatch: AWS 콘솔 → CloudWatch → 대시보드" -ForegroundColor White
Write-Host "  - Grafana: http://monitoring.hippo-project.com/grafana" -ForegroundColor White
Write-Host "  - Prometheus: http://monitoring.hippo-project.com/prometheus" -ForegroundColor White











