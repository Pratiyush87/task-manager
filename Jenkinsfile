pipeline {
    agent any
    
    environment {
        ECR_REGISTRY = '988698481528.dkr.ecr.ap-south-1.amazonaws.com'
        AWS_REGION = 'ap-south-1'
        IMAGE_TAG = "${BUILD_NUMBER}"
        S3_BUCKET = 'task-manager-frontend-988698481528'
        CLOUDFRONT_ID = 'd2vgxnoq21fpry'
        
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
        
        stage('Build Frontend') {
            steps {
                script {
                    sh """
                    cd frontend
                    npm install
                    npm run build
                    echo "Frontend build completed"
                    """
                }
            }
        }
        
        stage('Upload Frontend to S3') {
            steps {
                script {
                    sh """
                    aws s3 sync frontend/build/ s3://${S3_BUCKET}/ --delete --region ${AWS_REGION}
                    echo "Frontend uploaded to S3"
                    aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/*" --region ${AWS_REGION}
                    echo "CloudFront cache invalidated"
                    """
                }
            }
        }
        
        stage('Build and Push Backend Images') {
            parallel {
                
                stage('Node.js') {
                    steps {
                        script {
                            sh """
                            cd backend/nodejs
                            docker build -t ${ECR_REGISTRY}/task-manager-nodejs:${IMAGE_TAG} .
                            docker tag ${ECR_REGISTRY}/task-manager-nodejs:${IMAGE_TAG} ${ECR_REGISTRY}/task-manager-nodejs:latest
                            docker push ${ECR_REGISTRY}/task-manager-nodejs:${IMAGE_TAG}
                            docker push ${ECR_REGISTRY}/task-manager-nodejs:latest
                            echo "Node.js pushed"
                            """
                        }
                    }
                }

                stage('FastAPI') {
                    steps {
                        script {
                            sh """
                            cd backend/fastapi
                            docker build -t ${ECR_REGISTRY}/task-manager-fastapi:${IMAGE_TAG} .
                            docker tag ${ECR_REGISTRY}/task-manager-fastapi:${IMAGE_TAG} ${ECR_REGISTRY}/task-manager-fastapi:latest
                            docker push ${ECR_REGISTRY}/task-manager-fastapi:${IMAGE_TAG}
                            docker push ${ECR_REGISTRY}/task-manager-fastapi:latest
                            echo "FastAPI pushed"
                            """
                        }
                    }
                }

                stage('Spring Boot') {
                    steps {
                        script {
                            sh """
                            cd backend/springboot
                            docker build -t ${ECR_REGISTRY}/task-manager-springboot:${IMAGE_TAG} .
                            docker tag ${ECR_REGISTRY}/task-manager-springboot:${IMAGE_TAG} ${ECR_REGISTRY}/task-manager-springboot:latest
                            docker push ${ECR_REGISTRY}/task-manager-springboot:${IMAGE_TAG}
                            docker push ${ECR_REGISTRY}/task-manager-springboot:latest
                            echo "Spring Boot pushed"
                            """
                        }
                    }
                }

                stage('.NET') {
                    steps {
                        script {
                            sh """
                            cd backend/dotnet
                            docker build -t ${ECR_REGISTRY}/task-manager-dotnet:${IMAGE_TAG} .
                            docker tag ${ECR_REGISTRY}/task-manager-dotnet:${IMAGE_TAG} ${ECR_REGISTRY}/task-manager-dotnet:latest
                            docker push ${ECR_REGISTRY}/task-manager-dotnet:${IMAGE_TAG}
                            docker push ${ECR_REGISTRY}/task-manager-dotnet:latest
                            echo ".NET pushed"
                            """
                        }
                    }
                }

                stage('Nginx') {
                    steps {
                        script {
                            sh """
                            cd nginx
                            docker build -t ${ECR_REGISTRY}/task-manager-nginx:${IMAGE_TAG} .
                            docker tag ${ECR_REGISTRY}/task-manager-nginx:${IMAGE_TAG} ${ECR_REGISTRY}/task-manager-nginx:latest
                            docker push ${ECR_REGISTRY}/task-manager-nginx:${IMAGE_TAG}
                            docker push ${ECR_REGISTRY}/task-manager-nginx:latest
                            echo "Nginx pushed"
                            """
                        }
                    }
                }
            }
        }
        
        stage('Deploy to App Server') {
            steps {
                script {
                    sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@10.0.2.242 '
                        cd /home/ubuntu/task-manager
                        git pull origin main
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        docker-compose -f docker-compose.prod.yml down
                        docker-compose -f docker-compose.prod.yml pull
                        docker-compose -f docker-compose.prod.yml up -d
                        docker image prune -f
                        docker ps
                        docker images --format "table {{.Repository}}:{{.Tag}}" | grep "${ECR_REGISTRY}" | grep -v "latest" | head -n -5 | xargs -r docker rmi 2>/dev/null || true
                    '
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo "Deployment successful! Build: ${BUILD_NUMBER}"
        }
        failure {
            echo "Deployment failed! Build: ${BUILD_NUMBER}"
        }
        always {
            echo "Build ${BUILD_NUMBER} completed"
        }
    }
}
