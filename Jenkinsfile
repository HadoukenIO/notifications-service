node ('windows') {

    properties([
        parameters([
            choiceParam(
                choices: 'staging\nproduction',
                description: 'which environment to deploy to',
                name: 'DEPLOY_TYPE'
            ),
            stringParam(
                defaultValue: 'develop',
                description: 'branch to build (staging only)',
                name: 'GIT_BRANCH'
            ),
            stringParam(
                defaultValue: '',
                description: 'build number to promote to production',
                name: 'BUILD_TO_PROMOTE'
            ),
        ])
    ])

    stage ('checkout'){
        if (params.DEPLOY_TYPE != 'production') {
            checkout scm
        }
    }

    stage ('build'){
        if (params.DEPLOY_TYPE != 'production') {
            sh "npm i"
            sh "npm run build"
            GIT_SHORT_SHA = sh ( script: "git rev-parse --short HEAD", returnStdout: true ).trim()
            sh "echo ${GIT_SHORT_SHA} > ./dist/SHA.txt"
        }
    }

    stage ('deploy'){
        if (params.DEPLOY_TYPE != 'production') {
            sh "node ./service-utils/deploy-staging.js notifications " + env.BUILD_NUMBER
        } else {
            sh "node ./service-utils/deploy-prod.js notifications " + params.BUILD_TO_PROMOTE
        }
    }
}