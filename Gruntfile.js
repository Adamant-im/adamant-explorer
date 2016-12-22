'use strict';

module.exports = function (grunt) {

    // Load NPM Tasks
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-markdown');
    grunt.loadNpmTasks('grunt-angular-gettext');

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
            angular: {
                src: ['bower_components/angular/angular.min.js',
                      'bower_components/angular-resource/angular-resource.min.js',
                      'bower_components/angular-route/angular-route.min.js',
                      'bower_components/angular-animate/angular-animate.min.js',
                      'bower_components/angular-bootstrap/ui-bootstrap.js',
                      'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
                      'bower_components/ngprogress/build/ngProgress.min.js',
                      'bower_components/angular-gettext/dist/angular-gettext.min.js',
                      'bower_components/angular-naturalsort/dist/naturalSortVersionDates.min.js'],
                dest: 'public/js/angularjs-all.js'
            },
            main: {
                src: ['public/src/js/app.js',
                      'public/src/js/controllers/*.js',
                      'public/src/js/directives/*.js',
                      'public/src/js/services/*.js',
                      'public/src/js/filters.js',
                      'public/src/js/config.js',
                      'public/src/js/init.js',
                      'public/src/js/translations.js'],
                dest: 'public/js/main.js'
            },
            vendors: {
                src: ['bower_components/amstockchart/amcharts/amcharts.js',
                      'bower_components/amstockchart/amcharts/serial.js',
                      'bower_components/amstockchart/amcharts/amstock.js',
                      'bower_components/momentjs/min/moment.min.js',
                      'bower_components/leaflet/dist/leaflet.js',
                      'bower_components/leaflet.markercluster/dist/leaflet.markercluster.js',
                      'bower_components/sigma/sigma.min.js',
                      'bower_components/sigma/plugins/*.min.js',
                      'bower_components/underscore/underscore-min.js',
                      'bower_components/zeroclipboard/ZeroClipboard.min.js'],
                dest: 'public/js/vendors.js'
            },
            css: {
                src: ['bower_components/amstockchart/amcharts/style.css',
                      'bower_components/bootstrap/dist/css/bootstrap.css',
                      'bower_components/font-awesome/css/font-awesome.css',
                      'bower_components/leaflet/dist/leaflet.css',
                      'bower_components/leaflet.markercluster/dist/MarkerCluster.Default.css',
                      'public/src/css/**/*.css'],
                dest: 'public/css/main.css'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> */\n',
                mangle: false
            },
            angular: {
                src: 'public/js/angularjs-all.js',
                dest: 'public/js/angularjs-all.min.js'
            },
            main: {
                src: 'public/js/main.js',
                dest: 'public/js/main.min.js'
            },
            vendors: {
                src: 'public/js/vendors.js',
                dest: 'public/js/vendors.min.js'
            }
        },
        cssmin: {
            all: {
                files: [{
                    expand: true,
                    cwd: 'public/css',
                    src: ['*.css', '!*.min.css'],
                    dest: 'public/css',
                    ext: '.min.css'
                }]
            }
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
                  'public/src/js/**/*.js',
                  'redis.js',
                  'sockets/**/*.js',
                  'tasks/**/*.js',
                  'test/**/*.js',
                  'utils**/*.js']
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
        watch: {
            main: {
                files: ['public/src/js/**/*.js'],
                tasks: ['concat:main', 'uglify:main'],
            },
            css: {
                files: ['public/src/css/**/*.css'],
                tasks: ['concat:css', 'cssmin'],
            },
        },
        copy: {
            dist: {
                files: [
                    {
                        // Copy AmCharts images to public/img/amcharts.
                        expand: true,
                        dot: true,
                        cwd: 'bower_components/amstockchart/amcharts/images',
                        src: ['*.*'],
                        dest: 'public/img/amcharts'
                    },
                    {
                        // Copy Bootstrap fonts to public/fonts.
                        expand: true,
                        dot: true,
                        cwd: 'bower_components/bootstrap/dist',
                        src: ['fonts/*.*'],
                        dest: 'public'
                    },
                    {
                        // Copy Font-awesome fonts to public/fonts.
                        expand: true,
                        dot: true,
                        cwd: 'bower_components/font-awesome',
                        src: ['fonts/*.*'],
                        dest: 'public'
                    }
                ]
            },
        },
        nggettext_extract: {
            pot: {
                files: {
                    'po/template.pot': ['public/views/*.html', 'public/views/**/*.html']
                }
            },
        },
        nggettext_compile: {
            all: {
                options: {
                    module: 'lisk_explorer'
                },
                files: {
                    'public/src/js/translations.js': ['po/*.po']
                }
            },
        }
    });

    // Making grunt default to force in order not to break the project.
    grunt.option('force', true);

    // Default task(s).
    grunt.registerTask('default', ['watch']);

    // Compile task (concat + minify).
    grunt.registerTask('compile', ['nggettext_extract', 'nggettext_compile', 'concat', 'uglify', 'cssmin', 'copy']);

    // Copy ZeroClipboard.swf to public/swf.
    grunt.file.copy('bower_components/zeroclipboard/ZeroClipboard.swf', 'public/swf/ZeroClipboard.swf');

    // Copy Leaflet images to public/img/leaflet.
    grunt.file.copy('bower_components/leaflet/dist/images/layers.png', 'public/img/leaflet/layers.png');
    grunt.file.copy('bower_components/leaflet/dist/images/layers-2x.png', 'public/img/leaflet/layers-2x.png');
    grunt.file.copy('bower_components/leaflet/dist/images/marker-icon.png', 'public/img/leaflet/marker-icon.png');
    grunt.file.copy('bower_components/leaflet/dist/images/marker-icon-2x.png', 'public/img/leaflet/marker-icon-2x.png');
    grunt.file.copy('bower_components/leaflet/dist/images/marker-shadow.png', 'public/img/leaflet/marker-shadow.png');
};
