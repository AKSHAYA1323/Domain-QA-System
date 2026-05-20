pipeline {
    agent any

    environment {
        // Match the docker-compose project name from the host
        COMPOSE_PROJECT_NAME = 'domainqasystem'
        DOCKER_IMAGE = 'domainqasystem-domainqa-web'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo '📥 Checking out repository from Git...'
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                echo '📦 Building Docker Image for Next.js App...'
                // Build the image matching the docker-compose naming convention
                sh 'docker build -t ${DOCKER_IMAGE}:latest .'
            }
        }

        stage('Deploy') {
            steps {
                echo '🚀 Deploying the new container...'
                sh '''
                    # Check if docker compose plugin is available inside Jenkins
                    if docker compose version >/dev/null 2>&1; then
                        echo "Using docker compose to deploy..."
                        docker compose up -d --no-deps --force-recreate domainqa-web
                    else
                        echo "Docker compose not found natively, using raw Docker commands..."
                        
                        docker stop domainqa-web || true
                        docker rm domainqa-web || true
                        
                        docker run -d --name domainqa-web \\
                            --restart unless-stopped \\
                            -p 3001:3000 \\
                            -e NODE_ENV=production \\
                            -e JENKINS_URL=http://domainqa-jenkins:8080 \\
                            -e REDIS_HOST=domainqa-redis \\
                            -e REDIS_PORT=6379 \\
                            -e NEXT_TELEMETRY_DISABLED=1 \\
                            -v /var/run/docker.sock:/var/run/docker.sock:ro \\
                            --network domainqasystem_domainqa-network \\
                            ${DOCKER_IMAGE}:latest
                    fi
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo '🏥 Checking if the application is running...'
                sh 'sleep 10'
                sh 'docker ps --filter "name=domainqa-web" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline finished successfully! Your app is updated.'
        }
        failure {
            echo '❌ Pipeline failed! Please check the console output.'
        }
    }
}
