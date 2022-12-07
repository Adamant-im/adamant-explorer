'use strict';

module.exports = function (grunt) {

  // Load NPM Tasks
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-markdown');
  grunt.loadNpmTasks('grunt-mocha-test');

  // Load Custom Tasks
  grunt.loadTasks('tasks');

  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        process: (src, filepath) => {
          if (filepath.substr(filepath.length - 2) === 'js') {
            return '// Source: ' + filepath + '\n' +
              src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
          } else {
            return src;
          }
        },
      },
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          quiet: false,
          clearRequireCache: false,
          noFail: false,
          timeout: '250s',
        },
        src: ['test'],
      },
    },
    markdown: {
      all: {
        files: [
          {
            expand: true,
            src: 'README.md',
            dest: '.',
            ext: '.html',
          },
        ],
      },
    },
    eslint: {
      options: {
        overrideConfigFile: '.eslintrc.js',
        fix: false,
      },
      target: [
        'api',
        'benchmarks',
        'lib',
        'sockets',
        'tasks',
        'test',
        'utils',
        'redis.js',
        'Gruntfile.js',
      ],
    },
  });

  // Register tasks for travis.
  grunt.registerTask('travis', () => {
    grunt.option('force', true);

    grunt.task.run('eslint');
    grunt.task.run('mochaTest');
  });
  grunt.registerTask('eslint-nofix', () => {
    grunt.option('force', true);

    grunt.task.run('eslint');
  });
  grunt.registerTask('test', ['mochaTest']);

  grunt.registerTask('eslint-fix', 'Run eslint and fix formatting', () => {
    grunt.config.set('eslint.options.fix', true);
    grunt.task.run('eslint');
  });
};
