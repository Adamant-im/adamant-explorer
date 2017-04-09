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
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-rename');

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
                      'node_modules/angular-ui-router/release/angular-ui-router.min.js',
                      'bower_components/angular-animate/angular-animate.min.js',
                      'bower_components/angular-bootstrap/ui-bootstrap.js',
                      'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
                      'bower_components/ngprogress/build/ngProgress.min.js',
                      'bower_components/angular-gettext/dist/angular-gettext.min.js',
                      'bower_components/angular-naturalsort/dist/naturalSortVersionDates.min.js',
                      'bower_components/angular-qrcode/qrcode.js'],
                dest: 'public/js/angularjs-all.js'
            },
            main: {
                src: ['src/app/app.js',
                      'src/app/states.js',
                      'src/app/run.js',


                      'src/filters/approval.js',
                      'src/filters/epoch-stamp.js',
                      'src/filters/forging-time.js',
                      'src/filters/iat.js',
                      'src/filters/lisk.js',
                      'src/filters/currency.js',
                      'src/filters/net-hash.js',
                      'src/filters/round.js',
                      'src/filters/split.js',
                      'src/filters/start-from.js',
                      'src/filters/supply-percent.js',
                      'src/filters/time-ago.js',
                      'src/filters/time-span.js',
                      'src/filters/time-stamp.js',
                      'src/filters/tx-sender.js',
                      'src/filters/tx-recipient.js',
                      'src/filters/tx-type.js',
                      'src/filters/alter-word-separation.js',
                      'src/filters/votes.js',
                      'src/filters/proposal.js',

                      'src/services/socket.js',
                      'src/services/forging-status.js',
                      'src/services/forging-monitor.js',
                      'src/services/delegate-monitor.js',
                      'src/services/activity-graph.js',
                      'src/services/global.js',
                      'src/services/less-more.js',
                      'src/services/tx-types.js',
                      'src/services/order-by.js',
                      'src/services/address-txs.js',
                      'src/services/block-txs.js',
                      'src/services/market-matcher.js',
                      'src/services/network-monitor.js',

                      'src/components/**/*.js',
                      'src/directives/**/*.js',

                      'src/shared/bread-crumb/*.js',
                      'src/shared/orders/*.js',
                      'src/shared/currency/*.js',
                      'src/shared/peers/*.js',
                      'src/shared/forging-status/*.js',
                      'src/shared/footer/*.js',
                      'src/shared/header/header-service.js',
                      'src/shared/header/header-directive.js',
                      'src/shared/search/search-directive.js',

                      'src/main.js'],
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
                      'bower_components/qrcode-generator/js/qrcode.js',
                      'bower_components/zeroclipboard/ZeroClipboard.min.js'],
                dest: 'public/js/vendors.js'
            },
            css: {
                src: ['bower_components/amstockchart/amcharts/style.css',
                      'bower_components/bootstrap/dist/css/bootstrap.css',
                      'bower_components/font-awesome/css/font-awesome.css',
                      'bower_components/leaflet/dist/leaflet.css',
                      'bower_components/leaflet.markercluster/dist/MarkerCluster.Default.css',
                      'src/**/*.css'],
                dest: 'public/css/main.css'
            }
        },
        babel: {
            options: {
                sourceMap: true,
                presets: ['es2015']
            },
            dist: {
                files: [{
                    'public/js/main.js': 'public/js/main.js'
                }]
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
        rename: {
            moveThis: {
                src: 'public/js/main.js',
                dest: 'public/js/main.min.js'
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
                  'public/src/**/*.js',
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
        watch: {
            main: {
                files: ['src/**/*.js'],
                tasks: ['concat:main', 'babel', 'rename'],
            },
            css: {
                files: ['src/**/*.css'],
                tasks: ['concat:css', 'cssmin'],
            },
            html: {
                files: ['src/**/*.html'],
                tasks: ['copy:html'],
            },
            assets: {
                files: ['assets/**/*'],
                tasks: ['copy:assets']
            }
        },
        copy: {
            vedors: {
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
            html: {
                files: [
                    {
                        // Copy HTML files
                        expand: true,
                        cwd: 'src',
                        src: ['index.html', 'components/**/*.html', 'shared/**/*.html'],
                        dest: 'public/'
                    }
                ]
            },
            assets: {
                files: [
                    {
                        // Copy HTML files
                        expand: true,
                        dot: true,
                        cwd: 'src/assets',
                        src: ['**/*'],
                        dest: 'public'
                    }
                ]
            }
        },
        nggettext_extract: {
            pot: {
                files: {
                    'po/template.pot': ['src/**/*.html']
                }
            },
        },
        nggettext_compile: {
            all: {
                options: {
                    module: 'lisk_explorer'
                },
                files: {
                    'src/translations.js': ['po/*.po']
                }
            },
        }
    });

    // Making grunt default to force in order not to break the project.
    grunt.option('force', true);

    // Default task(s).
    grunt.registerTask('default', ['watch']);

    // Register tasks for travis.
    grunt.registerTask('travis', ['jshint', 'mochaTest']);

    // Compile task (concat + minify).
    grunt.registerTask('compile', ['nggettext_extract', 'nggettext_compile', 'concat', 'babel', 'uglify', 'cssmin', 'copy:vedors', 'copy:html', 'copy:assets']);

    // Copy ZeroClipboard.swf to public/swf.
    grunt.file.copy('bower_components/zeroclipboard/ZeroClipboard.swf', 'public/swf/ZeroClipboard.swf');

    // Copy Leaflet images to public/img/leaflet.
    grunt.file.copy('bower_components/leaflet/dist/images/layers.png', 'public/img/leaflet/layers.png');
    grunt.file.copy('bower_components/leaflet/dist/images/layers-2x.png', 'public/img/leaflet/layers-2x.png');
    grunt.file.copy('bower_components/leaflet/dist/images/marker-icon.png', 'public/img/leaflet/marker-icon.png');
    grunt.file.copy('bower_components/leaflet/dist/images/marker-icon-2x.png', 'public/img/leaflet/marker-icon-2x.png');
    grunt.file.copy('bower_components/leaflet/dist/images/marker-shadow.png', 'public/img/leaflet/marker-shadow.png');
};
