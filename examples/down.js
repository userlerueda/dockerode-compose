var Dockerode = require('dockerode');
const DockerodeCompose = require('../dist/compose').Compose;

var docker = new Dockerode();

var yamlFile = './test/assets/wordpress_original.yml';
var projectName = 'wordpress';
var rmi;

if (process.argv.length > 2) {
  if (process.argv[2] !== undefined) {
    yamlFile = process.argv[2];
  }
  if (process.argv[3] !== undefined) {
    projectName = process.argv[3];
  }
  if (process.argv[4] !== undefined) {
    rmi = process.argv[4];
  }
}

var compose = new DockerodeCompose(docker, yamlFile, projectName);

(async () => {
  options = { volumes: true };
  if (rmi !== undefined) {
    options.rmi = rmi;
  }
  var state = await compose.down(options);
  console.log(state);
})();
