pipeline {
    agent any

    environment {
        DEPLOY_SERVER = "4.237.71.147"
        DEPLOY_USER = "mdi"
        SSH_KEY = "e4bfa090-50e0-428e-93e3-bb43fc9f1b19"
        DEPLOY_PATH = "/home/mdi/stockhive"
        IMAGE_NAME = "stockhive"
        IMAGE_TAG = "latest"
    }

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/mobile-data-indonesia/stockhive-server.git', branch: 'main'
            }
        }

       stage('Build Docker Image') {
            steps {
                sh """
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                """
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([string(credentialsId: 'DOCKERHUB', variable: 'DOCKERHUB')]) {
                    sh """
                        echo ${DOCKERHUB} | docker login --username michaeltio --password-stdin &&
                        docker tag ${IMAGE_NAME}:${IMAGE_TAG} michaeltio/${IMAGE_NAME}:${IMAGE_TAG} &&
                        docker push michaeltio/${IMAGE_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Send Docker Compose') {
            steps {
                sshagent (credentials: ["${SSH_KEY}"]) {
                    sh """
                    scp docker-compose.yaml ${DEPLOY_USER}@${DEPLOY_SERVER}:${DEPLOY_PATH}
                    """
                }
            }
        }

        stage('Deploy via SSH') {
            steps {
                sshagent (credentials: ["${SSH_KEY}"]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_SERVER} \\
                        'cd ${DEPLOY_PATH} && docker compose pull && docker compose up -d'
                    """
                }
            }
        }
    }
}