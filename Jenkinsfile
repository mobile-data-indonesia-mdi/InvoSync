pipeline {
    agent any


    stages {
        stage('Trigger Test') {
            steps {
                echo "✅ Jenkins Pipeline Triggered Successfully!"
            }
        }

        stage('Print Dockerfile') {
            steps {
                echo 'Isi Dockerfile:'
                sh 'cat Dockerfile'
            }
        }
    }
}

