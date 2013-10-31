module.exports = function(grunt) {

  grunt.initConfig({
    pkg: {
      pkg: grunt.file.readJSON('package.json')
    },
    lint: {
      files: ["Gruntfile.js", "app/js/*.js"] 
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {
        require: true,
        define: true,
        requirejs: true,
        describe: true,
        expect: true,
        it: true
      }
    }
  });

  grunt.registerTask('default', 'lint');
};
