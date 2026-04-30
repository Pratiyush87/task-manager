pipeline {
    agent any
    
    environment {
        ECR_REGISTRY = '988698481528.dkr.ecr.ap-south-1.amazonaws.com'
        AWS_REGION = 'ap-south-1'
        RDS_HOST = credentials('rds-host')
        RDS_USER = credentials('rds-username')
        RDS_PASSWORD = credentials('rds-password')
        DB_NAME = 'taskdb'
    }
    
    stages {
        stage('Login to ECR') {
            steps {
                sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
            }
        }
        
        stage('Build Node.js') {
            steps {
                sh """
                    cd backend/nodejs
                    docker build -t ${ECR_REGISTRY}/task-manager-nodejs:latest .
                    docker push ${ECR_REGISTRY}/task-manager-nodejs:latest
                """
            }
        }
        
        stage('Build FastAPI') {
            steps {
                sh """
                    cd backend/fastapi
                    docker build -t ${ECR_REGISTRY}/task-manager-fastapi:latest .
                    docker push ${ECR_REGISTRY}/task-manager-fastapi:latest
                """
            }
        }
        
        stage('Build Spring Boot') {
            steps {
                sh """
                    cd backend/springboot
                    docker build -t ${ECR_REGISTRY}/task-manager-springboot:latest .
                    docker push ${ECR_REGISTRY}/task-manager-springboot:latest
                """
            }
        }
        
        stage('Build .NET') {
            steps {
                sh """
                    cd backend/dotnet
                    docker build -t ${ECR_REGISTRY}/task-manager-dotnet:latest .
                    docker push ${ECR_REGISTRY}/task-manager-dotnet:latest
                """
            }
        }
        
        stage('Build Nginx') {
            steps {
                sh """
                    cd nginx
                    docker build -t ${ECR_REGISTRY}/task-manager-nginx:latest .
                    docker push ${ECR_REGISTRY}/task-manager-nginx:latest
                """
            }
        }
        
        stage('Deploy') {
            steps {
                sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@10.0.2.242 << 'EOF'
                        aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        docker pull ${ECR_REGISTRY}/task-manager-nodejs:latest
                        docker pull ${ECR_REGISTRY}/task-manager-fastapi:latest
                        docker pull ${ECR_REGISTRY}/task-manager-springboot:latest
                        docker pull ${ECR_REGISTRY}/task-manager-dotnet:latest
                        docker pull ${ECR_REGISTRY}/task-manager-nginx:latest
                        docker stop task-nodejs task-fastapi task-springboot task-dotnet task-nginx 2>/dev/null || true
                        docker rm task-nodejs task-fastapi task-springboot task-dotnet task-nginx 2>/dev/null || true
                        docker run -d --name task-nodejs -p 3001:3001 ${ECR_REGISTRY}/task-manager-nodejs:latest
                        docker run -d --name task-fastapi -p 8000:8000 ${ECR_REGISTRY}/task-manager-fastapi:latest
                        docker run -d --name task-springboot -p 8080:8080 ${ECR_REGISTRY}/task-manager-springboot:latest
                        docker run -d --name task-dotnet -p 5000:5000 ${ECR_REGISTRY}/task-manager-dotnet:latest
                        sleep 5
                        docker run -d --name task-nginx -p 80:80 ${ECR_REGISTRY}/task-manager-nginx:latest
                        docker ps
                    EOF
                """
            }
        }
    }
}
