#!/bin/bash

# 모니터링 스택 배포 스크립트
echo "🚀 Hippo Project 모니터링 스택 배포 시작..."

# 네임스페이스 생성
echo "📁 모니터링 네임스페이스 생성..."
kubectl apply -f namespace.yaml

# Prometheus 배포
echo "📊 Prometheus 배포..."
kubectl apply -f prometheus-config.yaml
kubectl apply -f prometheus-deployment.yaml

# Grafana 배포
echo "📈 Grafana 배포..."
kubectl apply -f grafana-dashboard-config.yaml
kubectl apply -f grafana-notification-channels.yaml
kubectl apply -f grafana-deployment.yaml

# AlertManager 배포
echo "🚨 AlertManager 배포..."
kubectl apply -f alertmanager-deployment.yaml

# CloudWatch Exporter 배포
echo "☁️ CloudWatch Exporter 배포..."
kubectl apply -f cloudwatch-exporter.yaml
kubectl apply -f cloudwatch-exporter-iam.yaml

# Ingress 설정
echo "🌐 모니터링 Ingress 설정..."
kubectl apply -f monitoring-ingress.yaml

# 배포 상태 확인
echo "⏳ 배포 상태 확인 중..."
kubectl get pods -n monitoring

echo "✅ 모니터링 스택 배포 완료!"
echo ""
echo "📋 접속 정보:"
echo "  - Grafana: http://monitoring.hippo-project.com/grafana (admin/admin123)"
echo "  - Prometheus: http://monitoring.hippo-project.com/prometheus"
echo "  - AlertManager: http://monitoring.hippo-project.com/alertmanager"
echo ""
echo "🔍 상태 확인 명령어:"
echo "  kubectl get pods -n monitoring"
echo "  kubectl get svc -n monitoring"
echo "  kubectl get ingress -n monitoring"











