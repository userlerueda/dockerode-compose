var Dockerode = require('dockerode');
const DockerodeCompose = require('../dist/compose').Compose;
var docker = new Dockerode();
const logger = require('../dist/logger').logger;

var yamlFile = './test/assets/wordpress_original.yml';
var projectName = 'wordpress';

if (process.argv.length > 2) {
  if (process.argv[2] !== undefined) {
    yamlFile = process.argv[2];
  }
  if (process.argv[3] !== undefined) {
    projectName = process.argv[3];
  }
}

var compose = new DockerodeCompose(docker, yamlFile, projectName);

(async () => {
  compose.pullWithCallback((err, stream) => {
    docker.modem.followProgress(
      stream,
      (err, output) => {
        if (err) {
          logger.warn("Pull finished with errors...")
          logger.error(err)
        } else {
          logger.info("Pull finished without errors")
        }
        // onFinish
      },
      (event) => {
        // onProgress
        logger.silly(event);
      }
    );
  });
})();
