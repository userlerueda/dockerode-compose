import * as Dockerode from "dockerode";
import { ComposeOutput, DockerComposeRecipe } from "./models/dockerCompose";

export module Volumes {
  export async function down(
    docker: Dockerode,
    projectName: string,
    recipe: DockerComposeRecipe,
    output: ComposeOutput
  ): Promise<ComposeOutput["volumes"]> {
    console.info("Deleting volumes...");
    var volumes: any[] = [];
    var volumeNames = Object.keys(recipe.volumes || []);
    for (var volumeName of volumeNames) {
      try {
        await docker.getVolume(projectName + "_" + volumeName).remove();
      } catch (err) {
        console.warn(err);
      }
    }
    return volumes;
  }

  export async function up(
    docker: Dockerode,
    projectName: string,
    recipe: DockerComposeRecipe,
    output: ComposeOutput
  ): Promise<ComposeOutput["volumes"]> {
    console.info("Creating volumes...");
    var volumes: Dockerode.VolumeCreateResponse[] = [];
    var volumeNames = Object.keys(recipe.volumes || []);
    for (var volumeName of volumeNames) {
      var volume = recipe.volumes[volumeName];
      if (volume === null) volume = {};
      if (volume.external === true) continue;
      var opts = {
        Name: projectName + "_" + volumeName,
        Driver: volume.driver,
        DriverOpts: volume.driver_opts,
        Labels: {
          ...volume.labels,
          ...{
            "com.docker.compose.project": projectName,
            "com.docker.compose.volume": volumeName,
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
}
