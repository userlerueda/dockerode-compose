const yaml = require('js-yaml');
const fs = require('fs');
const stream = require('stream');

const secrets = require('./lib/secrets');
const volumes = require('./lib/volumes');
const configs = require('./lib/configs');
const networks = require('./lib/networks');
const services = require('./lib/services');
const tools = require('./lib/tools');

class Compose {
  constructor(dockerode, file, projectName) {
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

  async down(options) {
    var output = {};
    options = options || {};
    try {
      output.file = this.file;
      if (Object.keys(this.recipe).includes('services')) {
        output.services = await services.down(
          this.docker,
          this.projectName,
          this.recipe,
          output,
          options
        );
      }
      if (
        Object.keys(this.recipe).includes('networks') ||
        Object.keys(this.recipe).includes('services')
      ) {
        output.networks = await networks.down(
          this.docker,
          this.projectName,
          this.recipe,
          output
        );
      }
      if (Object.keys(this.recipe).includes('volumes')) {
        if (options.volumes) {
          output.volumes = await volumes.down(
            this.docker,
            this.projectName,
            this.recipe,
            output
          );
        }
      }
      if (options.rmi && options.rmi == 'all') {
        var serviceNames = tools.sortServices(this.recipe);
        output.images = [];
        for (var serviceName of serviceNames) {
          var service = this.recipe.services[serviceName];
          try {
            var image = await this.docker.getImage(service.image).remove();
            output.images.push(image);
          } catch (e) {
            throw e;
          }
        }
      }
      return output;
    } catch (err) {
      if (err.statusCode == 404 && err.json.message.includes('No such image')) {
      } else {
        throw err;
      }
    }
  }

  async up(options) {
    var output = {};
    try {
      output.file = this.file;
      if (Object.keys(this.recipe).includes('secrets')) {
        output.secrets = await secrets(
          this.docker,
          this.projectName,
          this.recipe,
          output
        );
      }
      if (Object.keys(this.recipe).includes('volumes')) {
        output.volumes = await volumes.up(
          this.docker,
          this.projectName,
          this.recipe,
          output
        );
      }
      if (Object.keys(this.recipe).includes('configs')) {
        output.configs = await configs(
          this.docker,
          this.projectName,
          this.recipe,
          output
        );
      }
      if (
        Object.keys(this.recipe).includes('networks') ||
        Object.keys(this.recipe).includes('services')
      ) {
        output.networks = await networks.up(
          this.docker,
          this.projectName,
          this.recipe,
          output
        );
      }
      if (Object.keys(this.recipe).includes('services')) {
        output.services = await services.up(
          this.docker,
          this.projectName,
          this.recipe,
          output,
          options
        );
      }
      return output;
    } catch (err) {
      throw err;
    }
  }

  async pull(serviceName, opts, callback) {
    var args = { serviceName: undefined, opts: {}, callback: undefined };
    if (typeof serviceName === 'string') {
      if (typeof opts === 'object') {
        // pull(serviceName, opts)
        args.serviceName = serviceName;
        args.opts = opts;
      } else if (typeof opts === 'function') {
        // pull(serviceName, callback)
        args.serviceName = serviceName;
        args.callback = opts;
      } else if (typeof opts === 'object' && typeof callback === 'function') {
        // pull(serviceName, opts, callback)
        args.serviceName = serviceName;
        args.opts = opts;
        args.callback = opts;
      } else {
        // pull(serviceName)
        args.serviceName = serviceName;
      }
    } else if (typeof serviceName === 'object') {
      if (typeof opts === 'function') {
        // pull(opts, callback)
        args.opts = serviceName;
        args.callback = opts;
      } else {
        // pull(opts)
        args.opts = serviceName;
      }
    } else if (typeof serviceName === 'function') {
      // pull(callback)
      args.callback = serviceName;
    } else {
      // pull()
    }

    var output = [];
    const serviceNames =
      args.serviceName === undefined || args.serviceName === null
        ? tools.sortServices(this.recipe)
        : [args.serviceName];
    for (const serviceName of serviceNames) {
      const service = this.recipe.services[serviceName];
      var argsf = [service.image, args.opts, args.callback];
      output.push(this.docker.pull.apply(this.docker, argsf));
    }
    return Promise.all(output);
  }

  async restart(options) {
    var output = {};
    try {
      output.file = this.file;
      if (Object.keys(this.recipe).includes('services')) {
        output.services = await services.down(
          this.docker,
          this.projectName,
          this.recipe,
          output,
          options
        );
        output.services = await services.up(
          this.docker,
          this.projectName,
          this.recipe,
          output,
          options
        );
      }
      return output;
    } catch (e) {
      throw e;
    }
  }
}

module.exports = Compose;
