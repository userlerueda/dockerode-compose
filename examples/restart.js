const Dockerode = require('dockerode');
const DockerodeCompose = require('../dist/compose').Compose;
const logger = require('../dist/logger').logger;

var docker = new Dockerode();

var yamlFile = './test/assets/wordpress_original.yml'
var projectName = 'wordpress'

if (process.argv.length > 2) {
  if (process.argv[2] !== undefined) {
    yamlFile = process.argv[2]
  }
  if (process.argv[3] !== undefined) {
    projectName = process.argv[3]
  }
}

var compose = new DockerodeCompose(docker, yamlFile, projectName);

(async () => {
  let state = await compose.restart();
  console.log(state);
})();
