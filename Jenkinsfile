pipeline {
  agent none
  environment {
    ON_JENKINS = 'TRUE'
  }
  stages {
    stage ('Lisk Provisioning') {
      steps {
        node('master-explorer-01'){
          lock(resource: "master-explorer-01", inversePrecedence: true) {
            deleteDir()
            checkout scm
            sh '''#!/bin/bash
            bash ~/lisk-test/lisk.sh start_node
            mkdir public || true

            # Install Deps
            npm install

            # Build Bundles
            npm run build

            # Generate market data
            grunt candles:build

            cp test/config.test ./config.js
            node app.js &> /dev/null &
            sleep 5

            # Run Tests
            npm run test

            # Stop Lisk-Node
            bash ~/lisk-test/lisk.sh stop_node
            '''
            milestone 1
          }
        }
      }
    }
  }
}
