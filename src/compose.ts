import yaml = require('js-yaml');
import fs = require('fs');
import stream = require('stream');

import { Secrets } from './secrets';
import { Volumes } from './volumes';
import services = require('./services');
import tools = require('./tools');
import Dockerode = require('dockerode');
import {
  Callback,
  ComposeDownOptions,
  ComposeOutput,
  ComposePullArgs,
  ComposePullOptions,
  ComposeRecipe,
  ComposeRestartOptions,
  ComposeUpOptions,
} from './models/compose';
import { Configs } from './configs';
import { Images } from './images';
import { Networks } from './networks';

export class Compose {
  docker: Dockerode;
  file: string;
  projectName: string;
  recipe: ComposeRecipe;

  constructor(dockerode: Dockerode, file: string, projectName: string) {
    this.docker = dockerode;

    if (file === undefined || projectName === undefined) {
      throw new Error('please specify a file and a project name');
    }

    this.file = file;
    this.projectName = projectName;

    try {
      this.recipe = yaml.load(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      throw e;
    }
  }

  async down(options: ComposeDownOptions): Promise<ComposeOutput> {
    var output: ComposeOutput = {};
    options = options || {};

    output.file = this.file;
    output.services = await services.down(this.docker, this.projectName, this.recipe, output, options);
    output.networks = await Networks.down(this.docker, this.projectName, this.recipe, output);
    output.configs = await Configs.down(this.docker, this.projectName, this.recipe, output);
    if (options.volumes) {
      output.volumes = await Volumes.down(this.docker, this.projectName, this.recipe, output);
    }
    output.services = await services.down(this.docker, this.projectName, this.recipe, output);
    if (options.rmi === 'all') {
      output.images = await Images.down(this.docker, this.projectName, this.recipe, output);
    }
    return output;
  }

  async up(options: ComposeUpOptions): Promise<ComposeOutput> {
    var output: ComposeOutput = {};
    try {
      output.file = this.file;
      output.secrets = await Secrets.up(this.docker, this.projectName, this.recipe, output);
      output.volumes = await Volumes.up(this.docker, this.projectName, this.recipe, output);
      output.configs = await Configs.up(this.docker, this.projectName, this.recipe, output);
      output.networks = await Networks.up(this.docker, this.projectName, this.recipe, output);
      output.services = await services.up(this.docker, this.projectName, this.recipe, output, options);
      return output;
    } catch (err) {
      throw err;
    }
  }

  pullWithCallback(serviceName?: string, options?: ComposePullOptions, callback?: Callback<Dockerode.Image>): void {
    var args: ComposePullArgs = {
      serviceName: undefined,
      options: {},
      callback: undefined,
    };
    if (typeof serviceName === 'string') {
      if (typeof options === 'object') {
        // pull(serviceName, opts)
        args.serviceName = serviceName;
        args.options = options;
      } else if (typeof options === 'function') {
        // pull(serviceName, callback)
        args.serviceName = serviceName;
        args.callback = options;
      } else if (typeof options === 'object' && typeof callback === 'function') {
        // pull(serviceName, opts, callback)
        args.serviceName = serviceName;
        args.options = options;
        args.callback = options;
      } else {
        // pull(serviceName)
        args.serviceName = serviceName;
      }
    } else if (typeof serviceName === 'object') {
      if (typeof options === 'function') {
        // pull(opts, callback)
        args.options = serviceName;
        args.callback = options;
      } else {
        // pull(opts)
        args.options = serviceName;
      }
    } else if (typeof serviceName === 'function') {
      // pull(callback)
      args.callback = serviceName;
    } else {
      // pull()
    }

    const serviceNames =
      args.serviceName === undefined || args.serviceName === null
        ? tools.sortServices(this.recipe)
        : [args.serviceName];
    for (const serviceName of serviceNames) {
      const service = this.recipe.services[serviceName];
      var argsf = [service.image, args.options, args.callback];
      this.docker.pull.apply(this.docker, argsf);
    }
  }

  async pull(serviceN: any, options: ComposePullOptions) {
    options = options || {};
    var streams = [];
    var serviceNames = serviceN === undefined || serviceN === null ? tools.sortServices(this.recipe) : [serviceN];
    for (var serviceName of serviceNames) {
      var service = this.recipe.services[serviceName];
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
    return streams;
  }

  async restart(options: ComposeRestartOptions): Promise<ComposeOutput> {
    var output: ComposeOutput = {};
    try {
      output.file = this.file;
      output.services = await services.down(this.docker, this.projectName, this.recipe, output, options);
      output.networks = await Networks.down(this.docker, this.projectName, this.recipe, output);
      output.networks = await Networks.up(this.docker, this.projectName, this.recipe, output);            
      output.services = await services.up(this.docker, this.projectName, this.recipe, output, options);
    } catch (err) {
      throw err;
    }
    return output;
  }
}
