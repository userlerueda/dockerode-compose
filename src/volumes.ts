import Dockerode = require('dockerode');
import { ComposeOutput, ComposeRecipe } from './models/compose';

export module Volumes {
  export async function down(
    docker: Dockerode,
    projectName: string,
    recipe: ComposeRecipe,
    output: ComposeOutput
  ): Promise<any[]> {
    return volumesDown(docker, projectName, recipe, output);
  }

  export async function up(
    docker: Dockerode,
    projectName: string,
    recipe: ComposeRecipe,
    output: ComposeOutput
  ): Promise<any[]> {
    return volumesUp(docker, projectName, recipe, output);
  }
}

async function volumesDown(docker: Dockerode, projectName: string, recipe: ComposeRecipe, output: ComposeOutput): Promise<any[]> {
  var volumes: any[] = [];
  var volumeNames = Object.keys(recipe.volumes || []);
  for (var volumeName of volumeNames) {
    try {
      var volume = await docker.getVolume(projectName + '_' + volumeName).remove();
      volumes.push(volume)
    } catch (e) {
      console.debug(e)
    }
  }
  return volumes;
}

async function volumesUp(docker: Dockerode, projectName: string, recipe: ComposeRecipe, output: ComposeOutput): Promise<any[]> {
  console.debug('Creating volumes...');
  var volumes = [];
  var volumeNames = Object.keys(recipe.volumes || []);
  for (var volumeName of volumeNames) {
    var volume = recipe.volumes[volumeName];
    if (volume === null) volume = {};
    if (volume.external === true) continue;
    var opts = {
      Name: projectName + '_' + volumeName,
      Driver: volume.driver,
      DriverOpts: volume.driver_opts,
      Labels: {
        ...volume.labels,
        ...{
          'com.docker.compose.project': projectName,
          'com.docker.compose.volume': volumeName,
        },
      },
    };
    if (volume.name !== undefined) {
      opts.Name = volumeName;
    }
    console.debug(`Creating volume ${opts.Name}...`);
    volumes.push(await docker.createVolume(opts));
  }
  return volumes;
}