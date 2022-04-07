import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Configs } from './configs';
import { Images } from './images';
import {
  ComposeDownOptions,
  ComposeOutput,
  ComposePullOptions,
  ComposeRestartOptions,
  ComposeUpOptions,
  DockerComposeRecipe,
} from './models/dockerCompose';
import { Networks } from './networks';
import { Secrets } from './secrets';
import { Services } from './services';
import { Volumes } from './volumes';
import * as stream from 'stream';
import * as tools from './tools';
import * as Dockerode from 'dockerode';

export class Compose {
  docker: Dockerode;
  file: string;
  projectName: string;
  recipe: DockerComposeRecipe;

  constructor(dockerode: Dockerode, file: string, projectName: string) {
    this.docker = dockerode;

    if (file === undefined || projectName === undefined) {
      throw new Error('please specify a file and a project name');
    }

    this.file = file;
    this.projectName = projectName;

    try {
      this.recipe = yaml.load(fs.readFileSync(file, 'utf8')) as DockerComposeRecipe;
    } catch (e) {
      throw e;
    }
  }

  async down(options?: ComposeDownOptions): Promise<ComposeOutput> {
    var output: ComposeOutput = {};
    options = options || {};

    output.file = this.file;
    output.services = await Services.down(this.docker, this.projectName, this.recipe, output, options);
    output.networks = await Networks.down(this.docker, this.projectName, this.recipe, output);
    output.configs = await Configs.down(this.docker, this.projectName, this.recipe, output);
    if (options.volumes) {
      output.volumes = await Volumes.down(this.docker, this.projectName, this.recipe, output);
    }
    output.services = await Services.down(this.docker, this.projectName, this.recipe, output, options);
    if (options.rmi === 'all') {
      output.images = await Images.down(this.docker, this.projectName, this.recipe, output);
    }
    return output;
  }

  async up(options?: ComposeUpOptions): Promise<ComposeOutput> {
    var output: ComposeOutput = {};
    if (options === undefined) {
      options = {};
    }
    try {
      output.file = this.file;
      output.secrets = await Secrets.up(this.docker, this.projectName, this.recipe, output);
      output.volumes = await Volumes.up(this.docker, this.projectName, this.recipe, output);
      output.configs = await Configs.up(this.docker, this.projectName, this.recipe, output);
      output.networks = await Networks.up(this.docker, this.projectName, this.recipe, output);
      output.services = await Services.up(this.docker, this.projectName, this.recipe, output, options);
      return output;
    } catch (err) {
      throw err;
    }
  }

  async pull(serviceN: any, options: ComposePullOptions) {
    var streams: Dockerode.Image[] = [];
    if (this.recipe.services !== undefined) {
      options = options || {};
      var serviceNames = serviceN === undefined || serviceN === null ? tools.sortServices(this.recipe) : [serviceN];
      for (var serviceName of serviceNames) {
        let service = this.recipe.services[serviceName];
        if (service !== undefined && service.image !== undefined) {
          try {
            var streami = await this.docker.pull(service.image);
            streams.push(streami);

            if (options.verbose === true) {
              streami.pipe(process.stdout);
            }

            if (options.streams !== true) {
              if (options.verbose === true) {
                streami.pipe(process.stdout);
              } else {
                streami.pipe(new stream.PassThrough());
              }
              await new Promise((fulfill) => streami.once('end', fulfill));
            }
          } catch (e) {
            throw e;
          }
        }
      }
    }
    return streams;
  }

  async restart(options?: ComposeRestartOptions): Promise<ComposeOutput> {
    var output: ComposeOutput = {};
    if (options === undefined) {
      options = {};
    }
    try {
      output.file = this.file;
      output.services = await Services.down(this.docker, this.projectName, this.recipe, output, options);
      output.networks = await Networks.down(this.docker, this.projectName, this.recipe, output);
      output.networks = await Networks.up(this.docker, this.projectName, this.recipe, output);
      output.services = await Services.up(this.docker, this.projectName, this.recipe, output, options);
    } catch (err) {
      throw err;
    }
    return output;
  }
}
