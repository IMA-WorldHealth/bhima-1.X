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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('build', ['concat']);

  grunt.registerTask('default', ['concat']);
};
