import * as Dockerode from "dockerode";
import { ComposeOutput, DockerComposeRecipe } from "./models/dockerCompose";
import * as fs from "fs";

export module Images {
  export async function down(
    docker: Dockerode,
    projectName: string,
    recipe: DockerComposeRecipe,
    output: ComposeOutput
  ): Promise<ComposeOutput["images"]> {
    console.info("Deleting images...");
    var images = [];
    const serviceNames = Object.keys(recipe.services || []);
    for (const serviceName of serviceNames) {
      const service = recipe.services[serviceName];
      try {
        console.info(`Removing image ${service.image}`);
        const image = await docker.getImage(service.image).remove();
        images.push(image);
      } catch (e) {
        console.warn(`WARNING: Image ${service.image} not found.`);
      }
    }
    return images;
  }
}
