pipeline {
    agent any
    
    environment {
        ECR_REGISTRY = '988698481528.dkr.ecr.ap-south-1.amazonaws.com'
        AWS_REGION = 'ap-south-1'
        IMAGE_TAG = "${BUILD_NUMBER}"   // Unique tag per build
        
        RDS_HOST = credentials('rds-host')
        RDS_USER = credentials('rds-username')
        RDS_PASSWORD = credentials('rds-password')
        DB_NAME = 'taskdb'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Login to ECR') {
            steps {
                sh """
                aws ecr get-login-password --region ${AWS_REGION} | \
                docker login --username AWS --password-stdin ${ECR_REGISTRY}
                """
            }
        }
        
        stage('Build and Push Images') {
            parallel {
                
                stage('Node.js') {
                    steps {
                        sh """
                        cd backend/nodejs
                        
                        docker build -t ${ECR_REGISTRY}/task-manager-nodejs:${IMAGE_TAG} .
                        docker tag ${ECR_REGISTRY}/task-manager-nodejs:${IMAGE_TAG} ${ECR_REGISTRY}/task-manager-nodejs:latest
                        
                        docker push ${ECR_REGISTRY}/task-manager-nodejs:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/task-manager-nodejs:latest
                        """
                    }
                }

                stage('FastAPI') {
                    steps {
                        sh """
                        cd backend/fastapi
                        
                        docker build -t ${ECR_REGISTRY}/task-manager-fastapi:${IMAGE_TAG} .
                        docker tag ${ECR_REGISTRY}/task-manager-fastapi:${IMAGE_TAG} ${ECR_REGISTRY}/task-manager-fastapi:latest
                        
                        docker push ${ECR_REGISTRY}/task-manager-fastapi:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/task-manager-fastapi:latest
                        """
                    }
                }

                stage('Spring Boot') {
                    steps {
                        sh """
                        cd backend/springboot
                        
                        docker build -t ${ECR_REGISTRY}/task-manager-springboot:${IMAGE_TAG} .
                        docker tag ${ECR_REGISTRY}/task-manager-springboot:${IMAGE_TAG} ${ECR_REGISTRY}/task-manager-springboot:latest
                        
                        docker push ${ECR_REGISTRY}/task-manager-springboot:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/task-manager-springboot:latest
                        """
                    }
                }

                stage('.NET') {
                    steps {
                        sh """
                        cd backend/dotnet
                        
                        docker build -t ${ECR_REGISTRY}/task-manager-dotnet:${IMAGE_TAG} .
                        docker tag ${ECR_REGISTRY}/task-manager-dotnet:${IMAGE_TAG} ${ECR_REGISTRY}/task-manager-dotnet:latest
                        
                        docker push ${ECR_REGISTRY}/task-manager-dotnet:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/task-manager-dotnet:latest
                        """
                    }
                }

                stage('Nginx') {
                    steps {
                        sh """
                        cd nginx
                        
                        docker build -t ${ECR_REGISTRY}/task-manager-nginx:${IMAGE_TAG} .
                        docker tag ${ECR_REGISTRY}/task-manager-nginx:${IMAGE_TAG} ${ECR_REGISTRY}/task-manager-nginx:latest
                        
                        docker push ${ECR_REGISTRY}/task-manager-nginx:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/task-manager-nginx:latest
                        """
                    }
                }
            }
        }
        
        stage('Deploy to App Server') {
            steps {
                sh """
                ssh -o StrictHostKeyChecking=no ubuntu@10.0.2.242 '
                    
                    cd /home/ubuntu/task-manager
                    
                    git pull origin main
                    
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    
                    docker-compose -f docker-compose.prod.yml down
                    
                    docker-compose -f docker-compose.prod.yml pull
                    
                    docker-compose -f docker-compose.prod.yml up -d
                    
                    docker image prune -f   # cleanup old unused images
                    
                    docker ps
                '
                """
            }
        }
    }
    
    post {
        success {
            echo "Deployment successful! Build: ${BUILD_NUMBER}"
        }
        failure {
            echo "Deployment failed! Check logs."
        }
    }
}