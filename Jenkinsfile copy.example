pipeline {
    agent any

    environment {
        DEPLOY_SERVER = "20.92.226.61"
        DEPLOY_USER = "mdi"
        SSH_KEY = "210fbc00-55af-410b-95df-26f449fe3287"
        DEPLOY_PATH = "/home/mdi/invoice-be-mdi"
        IMAGE_NAME = "invoice-be-mdi"
        IMAGE_TAG = "latest"
    }

    triggers {
        githubPush() 
    }

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/mobile-data-indonesia-mdi/InvoSync.git', branch: 'dev'
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