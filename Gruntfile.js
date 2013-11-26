module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: { 
      options: { 
        separator: ';'
      },
      dist: {
        src: ['app/partials/**/*.js'],
        //Should compile to distribution folder when this exists
        dest: 'app/js/controllers/controller2.js'
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
