#!/usr/bin/env groovy
@Library(['piper-lib', 'piper-lib-os']) _

node("master") {
	dockerExecuteOnKubernetes(script: this, dockerEnvVars: ['token':token,'pusername':pusername, 'puserpwd':puserpwd, 'sfQueueTopicName1':sfQueueTopicName1], dockerImage: 'docker.wdf.sap.corp:51010/sfext:v3' ) {
		try {	
			stage ('Build') { 
				deleteDir()
				sh "git config --global http.sslVerify false"
				checkout scm
				withCredentials([file(credentialsId: 'advancedemjson', variable: 'secretFile')]) {
				       sh '''
				       echo '' > aem.json
				       cat ${secretFile} >> aem.json
				       cat ./aem.json
				       '''
				     }
				sh '''
				    npm config set strict-ssl false
					npm config set unsafe-perm true 
					npm install -g node-pre-gyp
					echo 'y' | apt-get install jq
					mbt build -p=cf
					'''
			}
			stage('Test: Unit'){
				catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
					sh '''
					cd ./test/unit
					npm install
					npm run-script test:unit 
					'''
					}
			}
			stage('Deploy'){
				setupCommonPipelineEnvironment script:this
				cloudFoundryDeploy script:this, deployTool:'mtaDeployPlugin'
			}	
			stage('Test: REST-API'){
			catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
				withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId:'pusercf', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
					sh "cf login -a ${commonPipelineEnvironment.configuration.steps.cloudFoundryDeploy.cloudFoundry.apiEndpoint} -u $USERNAME -p $PASSWORD -o ${commonPipelineEnvironment.configuration.steps.cloudFoundryDeploy.cloudFoundry.org} -s ${commonPipelineEnvironment.configuration.steps.cloudFoundryDeploy.cloudFoundry.space}"
					sh '''
					cd ./test/rest-api/testscripts/util
					appId=`cf app fa-aem-srv --guid`
					`cf curl /v2/apps/$appId/env > appEnv.json`
					cat appEnv.json
					cd ../..
					npm install --only=dev
					npm run test:rest-api
				'''
				}
				
			}
	    }
			stage('Undeploy'){
				
			}
		}
		catch(e){
			echo 'This will run only if failed'
			currentBuild.result = "FAILURE"
		}
		finally {
			emailext body: '$DEFAULT_CONTENT', subject: '$DEFAULT_SUBJECT', to: 'DL_5731D8E45F99B75FC100004A@global.corp.sap,DL_58CB9B1A5F99B78BCC00001A@global.corp.sap'
		}

}
} 
