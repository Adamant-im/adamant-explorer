node('master-explorer-01'){
  lock(resource: "master-explorer-01", inversePrecedence: true) {
    stage ('Prepare Workspace') {
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
        mkdir public || true
        npm install
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
      node app.js &> /dev/null &
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
        currentBuild.result = 'SUCCESS'
      } catch (err) {
        currentBuild.result = 'FAILURE'
        error('Stopping build, tests failed')
      }
    }

    stage ('Set milestone') {
      milestone 1
    }

    stage ('Cleanup') {
      sh '''#!/bin/bash
          # Stop Lisk-Node
          bash ~/lisk-test/lisk.sh stop_node
      '''
    }
  }
}
