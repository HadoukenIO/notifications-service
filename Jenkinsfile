pipeline{
    agent ('james-bond') {

        stages {
            stage ('checkout'){
                checkout scm
            }

            stage ('build'){
                when { 
                    expression { return env.BRANCH_NAME == 'develop'; }
                }
                steps {
                    sh "npm i"
                    sh "npm run build"
                    GIT_SHORT_SHA = sh ( script: "git rev-parse --short HEAD", returnStdout: true ).trim()
                    sh "echo ${GIT_SHORT_SHA} > ./dist/SHA.txt"
                }
            }

            stage ('test'){
                when { changeRequest target: 'develop' }
                steps {
                    sh "npm i"
                    sh "npm run build"
                }
            }
        }
    }
}