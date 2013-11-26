module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: { 
      options: { 

        // defaults to new line
        // separator: ';'

        //version/timestamp - probably shouldn't include angular logic but I'm tired
        banner: "/*<%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today('dddd, mmmm dS, yyyy, h:MM:ss TT') %> */\n" + 
                "'use strict'\n\n" + 
                "angular.module('kpk.controllers', []);\n\n",

        //label each segment of controllers file, remove any instances of use strict
        process: function(src, filepath) { 
          return '//src: ' + filepath + '\n' + 
            src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
        }
      },
      dist: {
        src: ['app/partials/**/*.js'],
        //Should compile to distribution folder when this exists
        dest: 'app/js/controllers/controllers.js'
      }
    },
    watch: { 
      //concat files
      files: ['<%= concat.dist.src %>'],
      tasks: ['concat']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build', ['concat', 'watch']);

  grunt.registerTask('default', ['concat']);
};
