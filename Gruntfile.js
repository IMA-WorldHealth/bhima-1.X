module.exports = function (grunt) {
  'use strict';
  
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options : {
        jshintrc : '.jshintrc',
      },
      all: ['app/partials/**/*.js'],
      dev: {
        // options: {
        //   curly: true,
        //   eqeqeq: true,
        //   eqnull: true,
        //   browser: true,
        //   globals: {
        //     jQuery: true
        //   }
        // },
        files: {
          src: ['/app/partials/**/*.js']
        }
      }
    },
    concat: {
      options : {
        banner: "/*<%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today('dddd, mmmm dS, yyyy, h:MM:ss TT') %> */\n" +
                "angular.module('kpk.controllers', []);\n\n",
        //strip any strict definitions (single in banner), label source
        process: function(src, filepath) {
          return '//src: ' + filepath + '\n' +
            src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
        }
      },
      kapok: {
        src: ['app/partials/**/*.js'],
        dest: 'app/js/controllers/controllers.js'
      }
    },
    //working on this (implicitly concatinate to eventually allow sourcemaps)
    uglify: {
      options: {
        mangle: false,
        //{ except: ['$scope', '$routeProvider', 'etc.'] }
        //version/timestamp - probably shouldn't include angular logic but I'm tired
        banner: "/*<%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today('dddd, mmmm dS, yyyy, h:MM:ss TT') %> */\n" +
                "'use strict'\n\n" +
                "angular.module('kpk.controllers', []);\n\n"
      },
      kapok: {
        options: {
          sourceMap: 'controllers.map.js',
          sourceMapRoot: 'http://localhost:8080/partials/'
        },
        files: {
          'app/js/controllers/controllers.min.js' : ['app/partials/**/*.js']
        }
      }
    },
    watch: {
      //FIXME reference uglify files
      files: ['app/partials/**/*.js', 'app/partials/**/*.css', 'app/css/*.css', '!app/css/*.min.css'],
      tasks: ['concat', 'cssmin']
    },
    cssmin: {
      options : {
        banner : '/*! <%= pkg.name %>  <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      combine : {
        files : {
          'app/css/<%= pkg.name %>.min.css' : ['app/partials/**/*.css', 'app/partials/**/**/*.css', 'app/css/*.css', '!app/css/*.min.css', 'app/css/grid/*.css']
        }
      }
    },
    db_dump : {      
      local : {
        options : {
          title : "developping DB",
          database : "kpk",
          user : "kpk",
          pass : "HISCongo2013",
          host : "localhost",
          port : 3306,
          backup_to : "/scripts/sql/backup.sql"
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-mysql-dump');

  grunt.registerTask('build', ['jshint', 'concat']);
  grunt.registerTask('default', [ 'cssmin', 'concat', 'db_dump', 'watch']);
};
