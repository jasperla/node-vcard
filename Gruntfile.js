module.exports = function(grunt) {

  grunt.initConfig({
    watch: {
      javascript: {
        files: ['vcard.js', 'bin/*.js', 'spec/**/*', 'lib/*'],
        tasks: "jasmine_node"
      }
    },
    jasmine_node: {
      options: {
        projectRoot: ".",
        forceExit: true,
        match: '.',
        matchall: false,
        extensions: 'js',
        specNameMatcher: 'spec'
      }
    }
  });

  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.registerTask('default', ['jasmine_node', 'watch']);
};
