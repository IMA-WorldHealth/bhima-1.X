module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
          'app/js/controllers/controllers.js' : ['app/partials/**/*.js']
        }
      }
    },
    watch: { 
      //FIXME reference uglify files
      files: ['app/partials/**/*.js'],
      tasks: ['concat']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build', ['concat']);
  grunt.registerTask('dev', ['concat', 'watch']);

  grunt.registerTask('default', ['concat', 'watch']);
};
