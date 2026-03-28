# ARETON.id — Cloud Migration Guide
## VPS → AWS/GCP Production Setup

---

## Overview

Current deployment runs on a single VPS (72.61.143.92) with PM2, Nginx, PostgreSQL 16, and Redis 8. This guide covers migration to managed cloud services for production scalability.

---

## Architecture Comparison

### Current (VPS)
```
Client → CloudFlare → Nginx (VPS) → PM2/Node.js → PostgreSQL (local) + Redis (local)
```

### Target (AWS)
```
Client → CloudFlare → ALB → ECS Fargate (auto-scale 2-10) → Aurora PostgreSQL Serverless + ElastiCache Redis
                                                          → S3 (uploads) + CloudWatch (logs)
```

---

## AWS Infrastructure Components

| Component | Service | Spec | Est. Cost/mo |
|-----------|---------|------|-------------|
| API Server | ECS Fargate | 0.5 vCPU, 1GB RAM, 2 tasks | ~$30 |
| Database | Aurora PostgreSQL Serverless v2 | 0.5-4 ACU | ~$50 |
| Cache | ElastiCache Redis | cache.t4g.micro | ~$15 |
| Load Balancer | ALB | Standard | ~$20 |
| Storage | S3 | Standard, lifecycle to Glacier | ~$5 |
| Container Registry | ECR | 10 images retained | ~$1 |
| Networking | VPC + NAT Gateway | Single NAT | ~$35 |
| Monitoring | CloudWatch | Basic | ~$10 |
| SSL | ACM | Free | $0 |
| **Total** | | | **~$166/mo** |

### Cost Optimization Options
- Use **Spot Fargate** for non-critical tasks (40-60% savings)
- Use **Aurora Serverless v2** auto-pause for dev/staging
- Single NAT gateway (vs per-AZ)
- Reserved instances for predictable load

---

## Migration Steps

### Phase 1: Infrastructure Setup (Day 1-2)

```bash
# 1. Install Terraform
brew install terraform  # or apt/yum

# 2. Configure AWS CLI
aws configure --profile areton
# Region: ap-southeast-1 (Singapore)

# 3. Create Terraform state bucket
aws s3 mb s3://areton-terraform-state --region ap-southeast-1
aws dynamodb create-table \
  --table-name areton-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# 4. Create terraform.tfvars (DO NOT COMMIT)
cat > infra/aws/terraform.tfvars << 'EOF'
db_password        = "YOUR_STRONG_DB_PASSWORD"
jwt_access_secret  = "YOUR_JWT_ACCESS_SECRET"
jwt_refresh_secret = "YOUR_JWT_REFRESH_SECRET"
domain             = "areton.id"
aws_region         = "ap-southeast-1"
environment        = "production"
EOF

# 5. Initialize and plan
cd infra/aws
terraform init
terraform plan -out=plan.tfplan

# 6. Apply (review carefully!)
terraform apply plan.tfplan
```

### Phase 2: Docker Build & Push (Day 2)

```bash
# 1. Build production Docker image
docker build -f docker/Dockerfile.api -t areton-api .

# 2. Login to ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin \
  $(terraform -chdir=infra/aws output -raw ecr_repository_url | cut -d/ -f1)

# 3. Tag and push
ECR_URL=$(terraform -chdir=infra/aws output -raw ecr_repository_url)
docker tag areton-api:latest $ECR_URL:latest
docker push $ECR_URL:latest

# 4. Update ECS service
aws ecs update-service \
  --cluster areton-cluster \
  --service areton-api \
  --force-new-deployment
```

### Phase 3: Database Migration (Day 2-3)

```bash
# 1. Export from VPS PostgreSQL
pg_dump -h localhost -U areton -d areton_db \
  --format=custom --no-owner --no-privileges \
  -f areton_db_export.dump

# 2. Transfer to S3
aws s3 cp areton_db_export.dump s3://areton-terraform-state/migration/

# 3. Import to Aurora (from a bastion host in VPC)
AURORA_HOST=$(terraform -chdir=infra/aws output -raw rds_endpoint)
pg_restore -h $AURORA_HOST -U areton -d areton_db \
  --no-owner --no-privileges \
  areton_db_export.dump

# 4. Verify data
psql -h $AURORA_HOST -U areton -d areton_db -c "SELECT COUNT(*) FROM users;"

# 5. Install extensions
psql -h $AURORA_HOST -U areton -d areton_db -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

### Phase 4: DNS Cutover (Day 3)

```bash
# 1. Point CloudFlare to ALB
ALB_DNS=$(terraform -chdir=infra/aws output -raw alb_dns)
echo "Update CloudFlare DNS:"
echo "  api.areton.id → CNAME → $ALB_DNS"

# 2. Verify SSL (ACM certificate must be validated first)
curl -I https://api.areton.id/api/health

# 3. Smoke test
./scripts/uat-test.sh

# 4. Monitor for 24 hours before decommissioning VPS
```

### Phase 5: Upload Migration (Day 3)

```bash
# 1. Sync uploads to S3
S3_BUCKET=$(terraform -chdir=infra/aws output -raw s3_bucket)
aws s3 sync ./uploads/ s3://$S3_BUCKET/ \
  --exclude ".gitkeep" \
  --storage-class STANDARD

# 2. Update API_BASE_URL to use CloudFront/S3 for uploads
# (requires code change in UploadService to use S3 SDK)
```

---

## GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

env:
  AWS_REGION: ap-southeast-1
  ECR_REPOSITORY: areton/api
  ECS_CLUSTER: areton-cluster
  ECS_SERVICE: areton-api

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push image
        env:
          ECR_REGISTRY: ${{ steps.ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -f docker/Dockerfile.api -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE \
            --force-new-deployment
```

---

## GCP Alternative

If using GCP instead of AWS:

| AWS Service | GCP Equivalent |
|------------|----------------|
| ECS Fargate | Cloud Run |
| Aurora PostgreSQL | Cloud SQL PostgreSQL |
| ElastiCache | Memorystore Redis |
| ALB | Cloud Load Balancing |
| S3 | Cloud Storage |
| ECR | Artifact Registry |
| CloudWatch | Cloud Logging + Monitoring |
| ACM | Managed SSL (auto) |

GCP Cloud Run is simpler and often cheaper for similar workloads (~$100-130/mo).

---

## Rollback Plan

If migration fails:
1. Revert CloudFlare DNS to VPS IP (72.61.143.92)
2. VPS PM2 processes auto-restart — API available within seconds
3. VPS database has latest data (stop writes to AWS before reverting)
4. No data loss — VPS stays online during migration window (48h)

---

## Files Created

| File | Purpose |
|------|---------|
| `docker/Dockerfile.api` | Multi-stage production Docker image |
| `docker/docker-compose.production.yml` | Full production stack |
| `docker/nginx/nginx.conf` | Production Nginx config |
| `docker/nginx/conf.d/api.conf` | API reverse proxy config |
| `infra/aws/main.tf` | Terraform AWS infrastructure |
| `infra/CLOUD_MIGRATION.md` | This migration guide |
