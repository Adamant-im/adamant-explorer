'use strict';

module.exports = function (grunt) {

    // Load NPM Tasks
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-markdown');
    grunt.loadNpmTasks('grunt-mocha-test');

    // Load Custom Tasks
    grunt.loadTasks('tasks');

    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                process: function (src, filepath) {
                    if (filepath.substr(filepath.length - 2) === 'js') {
                        return '// Source: ' + filepath + '\n' +
                        src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                    } else {
                        return src;
                    }
                }
            },
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: ['api/**/*.js',
                  'app.js',
                  'benchmark.js',
                  'benchmarks/**/*.js',
                  'cache.js',
                  'Gruntfile.js',
                  'lib/**/*.js',
                  'redis.js',
                  'sockets/**/*.js',
                  'tasks/**/*.js',
                  'test/**/*.js',
                  'utils**/*.js']
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    quiet: false,
                    clearRequireCache: false,
                    noFail: false,
                    timeout: '250s'
                },
                src: ['test']
            }
        },
        markdown: {
            all: {
                files: [
                    {
                        expand: true,
                        src: 'README.md',
                        dest: '.',
                        ext: '.html'
                    }
                ]
            }
        },
    });

    // Making grunt default to force in order not to break the project.
    grunt.option('force', true);

    // Register tasks for travis.
    grunt.registerTask('travis', ['jshint', 'mochaTest']);
};
