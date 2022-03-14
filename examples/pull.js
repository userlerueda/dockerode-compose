var Dockerode = require('dockerode');
var DockerodeCompose = require('../compose');

var docker = new Dockerode();

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
  compose.pull((err, stream) => {
    docker.modem.followProgress(
      stream,
      (err, output) => {
        if (err) {
          console.log("Pull finished with errors...")
          console.error(err)
        } else {
          console.log("Pull finished without errors")
        }
        // onFinish
      },
      (event) => {
        // onProgress
        console.log(event);
      }
    );
  });
  // console.log(await compose.pull());
})();
