pipeline {
    agent any

    environment {
        IMAGE_NAME = "invoice-be-mdi"
        IMAGE_TAG = "latest"
    }

    stages {
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
    }
}

////