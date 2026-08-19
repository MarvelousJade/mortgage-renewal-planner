pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify') {
            parallel {
                stage('Spring Boot') {
                    steps {
                        dir('backend') {
                            sh './mvnw --batch-mode --no-transfer-progress verify'
                        }
                    }
                }
                stage('Angular') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run build'
                            sh 'npm run test:ci -- --no-progress'
                        }
                    }
                }
            }
        }

        stage('Container smoke build') {
            when {
                branch 'main'
            }
            steps {
                sh 'docker compose build'
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'backend/target/surefire-reports/*.xml'
            archiveArtifacts allowEmptyArchive: true, artifacts: 'frontend/dist/**/*'
        }
    }
}
