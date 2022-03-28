import Dockerode = require('dockerode');
import { logger } from './logger';
import { ComposeOutput, DockerComposeRecipe } from './../index.d';
import fs = require('fs');

export module Images {
  export async function down(
    docker: Dockerode,
    projectName: string,
    recipe: DockerComposeRecipe,
    output: ComposeOutput,
  ): Promise<ComposeOutput['images']> {
    logger.info('Deleting images...');
    var images = [];
    const serviceNames = Object.keys(recipe.services || []);
    for (const serviceName of serviceNames) {
      const service = recipe.services[serviceName];
      try {
        logger.info(`Removing image ${service.image}`);
        const image = await docker.getImage(service.image).remove();
        images.push(image);
      } catch (e) {
        logger.warn(`WARNING: Image ${service.image} not found.`);
      }
    }
    return images;
  }
}
