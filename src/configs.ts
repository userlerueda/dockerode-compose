import Dockerode = require('dockerode');
import { logger } from './logger';
import { ComposeOutput, DockerComposeRecipe } from './../index.d';
import fs = require('fs');

export module Configs {
  export async function down(
    docker: Dockerode,
    projectName: string,
    recipe: DockerComposeRecipe,
    output: ComposeOutput,
  ): Promise<ComposeOutput['configs']> {
    var configs = [];
    logger.info('Deleting configs...');
    logger.info('Not implemented yet, you will need to manually delete configs');
    return configs;
  }

  export async function up(
    docker: Dockerode,
    projectName: string,
    recipe: DockerComposeRecipe,
    output: ComposeOutput,
  ): Promise<ComposeOutput['configs']> {
    logger.info('Creating configs...');
    var configs = [];
    var configNames = Object.keys(recipe.configs || []);
    for (var configName of configNames) {
      var config = recipe.configs[configName];
      if (config.external === true) continue;
      var opts = {
        Name: projectName + '_' + configName,
        Data: fs.readFileSync(config.file, 'utf8'),
        Labels: {
          'com.docker.compose.project': projectName,
        },
      };
      if (config.name !== undefined) {
        opts.Name = configName;
      }
      configs.push(await docker.createConfig(opts));
    }
    return configs;
  }
}
