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
      if (Object.keys(this.recipe).includes("services")) {
        output.services = await services.down(this.docker, this.projectName, this.recipe, output, options);
      }
      if (Object.keys(this.recipe).includes("networks") || Object.keys(this.recipe).includes("services")) {
        output.networks = await networks.down(this.docker, this.projectName, this.recipe, output);
      }
      if (Object.keys(this.recipe).includes("volumes")) {
        if (options.volumes) {
          output.volumes = await volumes.down(this.docker, this.projectName, this.recipe, output);
        }
      }
      if (options.rmi && options.rmi == "all") {
        var serviceNames = tools.sortServices(this.recipe);
        output.images = []
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
      if (Object.keys(this.recipe).includes("secrets")) {
        output.secrets = await secrets(this.docker, this.projectName, this.recipe, output);
      }
      if (Object.keys(this.recipe).includes("volumes")) {
        output.volumes = await volumes.up(this.docker, this.projectName, this.recipe, output);
      }
      if (Object.keys(this.recipe).includes("configs")) {
        output.configs = await configs(this.docker, this.projectName, this.recipe, output);
      }
      if (Object.keys(this.recipe).includes("networks") || Object.keys(this.recipe).includes("services")) {
        output.networks = await networks.up(this.docker, this.projectName, this.recipe, output);
      }
      if (Object.keys(this.recipe).includes("services")) {
        output.services = await services.up(this.docker, this.projectName, this.recipe, output, options);
      }
      return output;
    } catch (err) {
      throw err;
    }
  }

  async pull(serviceN, options) {
    options = options || {};
    var streams = [];
    var serviceNames = (serviceN === undefined || serviceN === null) ? tools.sortServices(this.recipe) : [serviceN];
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
            streami.pipe(stream.PassThrough());
          }
          await new Promise(fulfill => streami.once('end', fulfill));
        }
      } catch (err) {
        throw err;
      }
    }
    return streams;
  }

  async restart(options) {
    var output = {};
    try {
      output.file = this.file;
      if (Object.keys(this.recipe).includes("services")) {
        output.services = await services.down(this.docker, this.projectName, this.recipe, output, options);
        output.services = await services.up(this.docker, this.projectName, this.recipe, output, options);
      }
      return output;
    } catch (e) {
      throw e;
    }
  }
}

module.exports = Compose;