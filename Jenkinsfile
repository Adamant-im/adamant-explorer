node('lisk-explorer-01'){
  lock(resource: "lisk-explorer-01", inversePrecedence: true) {
    stage ('Prepare Workspace') {
      sh '''#!/bin/bash
      pkill -f app.js || true
      '''
      deleteDir()
      checkout scm

    }

    stage ('Start Lisk ') {
      try {
        sh '''#!/bin/bash
        bash ~/lisk-test/lisk.sh start_node
        '''
      } catch (err) {
        currentBuild.result = 'FAILURE'
        error('Stopping build, installation failed')
      }
    }

    stage ('Build Dependencies') {
      try {
        sh '''#!/bin/bash

        # Install Deps
        npm install --verbose
        '''
      } catch (err) {
        currentBuild.result = 'FAILURE'
        error('Stopping build, installation failed')
      }
    }

    stage ('Run Webpack Build') {
      try {
        sh '''#!/bin/bash
        # Build Bundles
        npm run build
        '''
      } catch (err) {
        currentBuild.result = 'FAILURE'
        error('Stopping build, webpack failed')
      }
    }

    stage ('Build Candles') {
      try {
        sh '''#!/bin/bash
        # Generate market data
        grunt candles:build
        '''
      } catch (err) {
        currentBuild.result = 'FAILURE'
        error('Stopping build, webpack failed')
      }
    }
    stage ('Start Explorer') {
      try {
      sh '''#!/bin/bash

      cp test/config.test ./config.js
      node $(pwd)/app.js &> /dev/null &
      sleep 5
      '''
      } catch (err) {
        currentBuild.result = 'FAILURE'
        error('Stopping build, Explorer failed to start')
      }
    }

    stage ('Run tests') {
      try {
        sh '''#!/bin/bash
        # Run Tests
        npm run test
        '''
      } catch (err) {
      sh '''#!/bin/bash
        pkill -f $(pwd)/app.js
        '''
        currentBuild.result = 'FAILURE'
        error('Stopping build, tests failed')
      }
    }

    stage ('Set milestone') {
      milestone 1
      currentBuild.result = 'SUCCESS'
    }

    stage ('Cleanup') {
      sh '''#!/bin/bash
          # Stop Lisk-Node
          bash ~/lisk-test/lisk.sh stop_node
          
          # Stop Lisk-Explorer
          pkill -f $(pwd)/app.js
      '''
    }
  }
}

