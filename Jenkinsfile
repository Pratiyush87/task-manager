pipeline {
    agent any
    
    environment {
        ECR_REGISTRY = '988698481528.dkr.ecr.ap-south-1.amazonaws.com'
        AWS_REGION = 'ap-south-1'
        IMAGE_TAG = "${BUILD_NUMBER}"
        S3_BUCKET = 'task-manager-frontend-988698481528'
        CLOUDFRONT_ID = 'd2vgxnoq21fpry'  # Your CloudFront distribution ID
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
                    
                    # Install dependencies
                    npm install
                    
                    # Build React app with production config
                    npm run build
                    
                    echo "✅ Frontend build completed"
                    """
                }
            }
        }
        
        stage('Upload Frontend to S3') {
            steps {
                script {
                    sh """
                    # Sync build folder to S3 bucket
                    aws s3 sync frontend/build/ s3://${S3_BUCKET}/ --delete --region ${AWS_REGION}
                    
                    echo "✅ Frontend uploaded to S3"
                    
                    # Invalidate CloudFront cache
                    aws cloudfront create-invalidation \
                        --distribution-id ${CLOUDFRONT_ID} \
                        --paths "/*" \
                        --region ${AWS_REGION}
                    
                    echo "✅ CloudFront cache invalidated"
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
                            
                            echo "✅ Node.js: Pushed tags ${IMAGE_TAG} and latest"
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
                            
                            echo "✅ FastAPI: Pushed tags ${IMAGE_TAG} and latest"
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
                            
                            echo "✅ Spring Boot: Pushed tags ${IMAGE_TAG} and latest"
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
                            
                            echo "✅ .NET: Pushed tags ${IMAGE_TAG} and latest"
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
                            
                            echo "✅ Nginx: Pushed tags ${IMAGE_TAG} and latest"
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
                        
                        echo "📦 Pulling latest code from GitHub..."
                        git pull origin main
                        
                        echo "🔐 Logging into ECR..."
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY}
                        
                        echo "🛑 Stopping old containers..."
                        docker-compose -f docker-compose.prod.yml down
                        
                        echo "📥 Pulling latest images (tag: latest)..."
                        docker-compose -f docker-compose.prod.yml pull
                        
                        echo "🚀 Starting new containers..."
                        docker-compose -f docker-compose.prod.yml up -d
                        
                        echo "🧹 Cleaning up old unused images..."
                        docker image prune -f
                        
                        echo "✅ Current running containers:"
                        docker ps
                        
                        echo "🗑️ Removing old build images (keeping last 5)..."
                        docker images --format "table {{.Repository}}:{{.Tag}}" | grep "${ECR_REGISTRY}" | grep -v "latest" | head -n -5 | xargs -r docker rmi 2>/dev/null || true
                    '
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo "🎉 Deployment successful! Build: ${BUILD_NUMBER}"
            echo "✅ Backend images pushed with tags: ${BUILD_NUMBER} and latest"
            echo "✅ Frontend deployed to S3 and CloudFront"
            echo "🔗 Application available at: https://${CLOUDFRONT_ID}.cloudfront.net"
        }
        failure {
            echo "❌ Deployment failed! Build: ${BUILD_NUMBER}"
            echo "📋 Check Jenkins logs for details"
        }
        always {
            echo "🏁 Build ${BUILD_NUMBER} completed at ${new Date()}"
        }
    }
}
