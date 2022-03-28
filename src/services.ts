import tools = require('./tools');
import servicesTools = require('./servicesTools');
import * as fs from 'fs';
import * as path from 'path';
import yaml = require('js-yaml');
import * as servicesUtils from './services/utils';
import * as servicesPorts from './services/ports';
import * as servicesLabels from './services/labels';

import Dockerode = require('dockerode');

import { logger } from './logger';
import { ContainerCreateOptions } from './models/docker';
import { DockerComposeRecipe, ComposeOutput, ComposeRestartOptions, ComposeUpOptions, ComposeDownOptions } from './models/compose';

export module Services {
  export async function down(docker: Dockerode, projectName: string, recipe: DockerComposeRecipe, output: ComposeOutput, options: ComposeDownOptions) {
    var services = [];
    var serviceNames = tools.sortServices(recipe);
    for (var serviceName of serviceNames) {
      let container = docker.getContainer(projectName + '_' + serviceName + '_1');

      try {
        await container.stop();
      } catch (e) {}

      try {
        await container.remove();
      } catch (e) {}
    }
    return services;
  }

  export async function up(docker: Dockerode, projectName: string, recipe: DockerComposeRecipe, output: ComposeOutput, options: ComposeUpOptions) {
    logger.info('Creating containers...');
    var services = [];
    var serviceNames = tools.sortServices(recipe);
    for (var serviceName of serviceNames) {
      let service = recipe.services[serviceName];
      const configHash = servicesTools.buildSHA256(JSON.stringify(service));
      let { isServiceUpToDate, existingContainer } = await servicesUtils.isServiceUpToDate(
        docker,
        projectName,
        serviceName,
        configHash,
      );
      if (isServiceUpToDate) {
        logger.info(`Container ${serviceName} is up to date, skipping...`);
        services.push(existingContainer);
        continue;
      }
      var pathScope: any = {};
      pathScope.file = output.file;
      var networksToAttach = [];
      if (service.extends !== undefined) {
        if (service.extends.service !== undefined) {
          service = extendsServices(service, recipe, pathScope);
        } else {
          throw new Error('Service key in extends is required!');
        }
      }

      if (service.build !== undefined) {
        var absolutePath = path.dirname(pathScope.file);
        var obj = {};

        if (service.image !== undefined) {
          obj['t'] = service.image;
        } else {
          obj['t'] = projectName + '_' + serviceName;
          service.image = projectName + '_' + serviceName;
        }

        if (typeof service.build === 'object') {
          if (service.build.context !== undefined) {
            var buildContextPath = path.resolve(path.join(absolutePath, service.build.context));
            if (fs.existsSync(buildContextPath)) {
              if (service.build.args !== undefined) {
                var out = {};
                if (Array.isArray(service.build.args)) {
                  for (let arg_line of service.build.args) {
                    var arg = arg_line.split('=');
                    out[arg[0]] = arg[1];
                  }
                } else {
                  var argNames = Object.keys(service.build.args);
                  for (var argName of argNames) {
                    out[argName] = service.build.args[argName];
                  }
                }
                obj['buildargs'] = out;
              }

              if (service.build.cache_from !== undefined) {
                obj['cachefrom'] = service.build.cache_from;
              }

              if (service.build.extra_hosts !== undefined) {
                obj['extrahosts'] = service.build.extra_hosts;
              }

              if (service.build.labels !== undefined) {
                if (service.build.labels.length > 0) {
                  let labels = {};
                  for (let labelsb of service.build.labels) {
                    let p = labelsb.split('=');
                    if (p[1] === undefined) {
                      p[1] = '';
                    }
                    labels[p[0]] = p[1];
                  }
                  obj['labels'] = labels;
                } else {
                  obj['labels'] = service.build.labels;
                }
              }

              // TODO: revising this since it is incorrect
              // if (service.build.shm_size !== undefined) {
              //   // RE ARRAGE the function "convertSizeStringToByteValue" to a generic one
              //   obj['shmsize'] = servicesTools.convertSizeStringToByteValue([
              //     { path: '', rate: service.build.shm_size },
              //   ]).Rate;
              // }

              if (service.build.target !== undefined) {
                obj['target'] = service.build.target;
              }

              if (service.build.dockerfile === undefined) {
                await servicesTools.buildDockerImage(docker, buildContextPath, obj, null, options);
              } else {
                await servicesTools.buildDockerImage(docker, buildContextPath, obj, service.build.dockerfile, options);
              }
            } else {
              throw new Error(
                `build path ${buildContextPath} either does not exist, is not accessible, or is not a valid URL.`,
              );
            }
          } else {
            throw new Error('Build context is required!');
          }
        } else {
          var dockerFilePath = path.resolve(path.join(absolutePath, service.build));
          if (fs.existsSync(dockerFilePath)) {
            await servicesTools.buildDockerImage(docker, dockerFilePath, obj, null, options);
          } else {
            throw new Error(
              `build path ${dockerFilePath} either does not exist, is not accessible, or is not a valid URL.`,
            );
          }
        }
      }

      var opts: ContainerCreateOptions = {
        name: projectName + '_' + serviceName + '_1',
        Image: service.image,
        HostConfig: servicesTools.buildHostConfig(projectName, service, recipe),
        Env: servicesTools.buildEnvVars(service),
        NetworkingConfig: {
          EndpointsConfig: {},
        },
        Labels: {
          'com.docker.compose.project': projectName,
          'com.docker.compose.service': serviceName,
          'com.docker.compose.config-hash': configHash,
        },
      };

      if (service.ports !== undefined) {
        servicesPorts.addServicePorts(service, opts);
      }

      if (service.networks !== undefined) {
        logger.info('Service has networks to attach to...');
        let serviceNetworks = servicesUtils.getServiceNetworks(projectName, service);
        serviceNetworks.map((serviceNetwork) => {
          if (output.networks.filter((network) => network.name === serviceNetwork).length === 0) {
            throw new Error(`Network ${serviceNetwork} is not defined in the compose file!`);
          }
        })
        
        servicesTools.buildNetworks(projectName, serviceName, service.networks, networksToAttach, opts);
      } else {
        logger.info('Service has no networks to attach to, attaching to default network...');
        let defaultProjectNetwork = output.networks.filter(
          (network) => network.isDefault !== undefined && network.isDefault === true,
        );
        logger.debug(`Found default network: ${JSON.stringify(defaultProjectNetwork)}`);
        if (defaultProjectNetwork.length == 0) {
          logger.warn(`No default network found for project ${projectName}`);
        } else if (defaultProjectNetwork.length > 1) {
          logger.warn(
            `We were not expecting more than 1 default network, but we found ${defaultProjectNetwork.length}`,
          );
        } else {
          logger.debug('Attaching to default network...');
          opts.HostConfig.NetworkMode = defaultProjectNetwork[0].name;
          opts.NetworkingConfig.EndpointsConfig[defaultProjectNetwork[0].name] = {
            IPAMConfig: null,
            Links: null,
            Aliases: [serviceName],
          };
        }
      }

      // Can be used VolumesFrom from API DIRECTLY inside HostConfig :(
      if (service.volumes_from) {
        for (var volume_from of service.volumes_from) {
          var vf = volume_from.split(':');
          var svf = recipe.services[vf[0]];
          servicesTools.buildVolumes(svf.volumes, opts);
        }
      }

      if (service.volumes) {
        servicesTools.buildVolumes(service.volumes, opts);
      }
      if (service.container_name !== undefined) {
        opts.name = service.container_name;
      }
      if (service.domainname !== undefined) {
        opts.Domainname = service.domainname;
      }
      if (service.hostname !== undefined) {
        opts.Hostname = service.hostname;
      }
      if (service.mac_address !== undefined) {
        opts.MacAddress = service.mac_address;
      }
      if (service.stdin_open !== undefined) {
        opts.OpenStdin = service.stdin_open;
      }
      if (service.stop_grace_period !== undefined) {
        let period = parseInt(service.stop_grace_period);
        if (service.stop_grace_period == period) {
          opts.StopTimeout = service.stop_grace_period;
        } else if (service.stop_grace_period.includes('m') && service.stop_grace_period.includes('s')) {
          let minutes = parseInt(service.stop_grace_period.substring(0, service.stop_grace_period.indexOf('m')));
          let seconds = parseInt(
            service.stop_grace_period.substring(
              service.stop_grace_period.indexOf('m') + 1,
              service.stop_grace_period.indexOf('s'),
            ),
          );
          opts.StopTimeout = minutes * 60 + seconds;
        } else {
          opts.StopTimeout = service.stop_grace_period.substring(0, service.stop_grace_period.length - 2);
        }
      }
      if (service.stop_signal !== undefined) {
        opts.StopSignal = service.stop_signal;
      }
      if (service.expose !== undefined) {
        var ports = {};
        for (var port of service.expose) {
          ports[port + '/tcp'] = {};
        }
        opts.ExposedPorts = ports;
      }
      if (service.tty !== undefined) {
        opts.Tty = service.tty;
      }
      if (service.user !== undefined) {
        opts.User = service.user;
      }
      if (service.working_dir !== undefined) {
        opts.WorkingDir = service.working_dir;
      }
      if (service.labels !== undefined) {
        servicesLabels.addServiceLabels(service, opts);
      }
      if (service.healthcheck !== undefined) {
        let healthcheck: ContainerCreateOptions["Healthcheck"] = {};
        healthcheck.Test = service.healthcheck.test;
        healthcheck.Interval = convertFancyDurationToMs(service.healthcheck.interval);
        healthcheck.Timeout = convertFancyDurationToMs(service.healthcheck.timeout);
        healthcheck.Retries = service.healthcheck.retries;
        healthcheck.StartPeriod = convertFancyDurationToMs(service.healthcheck.start_period);
        opts.Healthcheck = healthcheck;
      }
      if (service.command !== undefined) {
        opts.Cmd = service.command;
      }
      if (service.entrypoint !== undefined) {
        if (Array.isArray(service.entrypoint)) {
          opts.Entrypoint = service.entrypoint;
        } else {
          let entrypoint = [];
          entrypoint.push(service.entrypoint);
          opts.Entrypoint = entrypoint;
        }
      }

      logger.info(`Creating container ${opts.name}...`);
      let container = await docker.createContainer(opts);

      if (networksToAttach.length > 1) {
        logger.debug(`Container has networks to attach to.`);
        let networkNames = Object.keys(networksToAttach[0]);
        logger.debug(`Disconnecting container from network ${networkNames[0]}`);
        let attachedNetwork = await findNetwork(output, networkNames[0])
        await attachedNetwork.disconnect({
          Container: container.id,
        });
        logger.debug(`networksToAttach: ${JSON.stringify(networksToAttach)}`);
        let networksToAttachSorted = tools.sortNetworksToAttach(networksToAttach);
        for (const networkToAttach of networksToAttachSorted) {
          let networkName = Object.keys(networkToAttach)[0];
          logger.debug(`Connecting container to network ${networkName}`);
          await findNetwork(output, networkName).connect({
            Container: container.id,
            EndpointConfig: networkToAttach[networkName],
          });
        }
      } else {
        logger.debug(`Container has no networks to attach to.`);
      }
      logger.info(`Starting container ${opts.name}...`);
      await container.start();

      logger.debug(container);
      services.push(container);
    }
    return services;
  }
}

function findNetwork(output: ComposeOutput, name: string) {
  logger.silly(`Finding network ${name}...`);
  for (const network of output.networks) {
    if (network.name == name) return network.network;
  }
  return null;
};

var convertFancyDurationToMs = function (value) {
  let interval = parseInt(value);
  if (value == interval) {
    return value;
  } else if (value.includes('m') && value.includes('s')) {
    let minutes = parseInt(value.substring(0, value.indexOf('m')));
    let seconds = parseInt(value.substring(value.indexOf('m') + 1, value.indexOf('s')));
    return (minutes * 60 + seconds) * 1000 * 1000000;
  } else {
    return parseInt(value.substring(0, value.length - 2)) * 1000 * 1000000;
  }
};

// https://github.com/compose-spec/compose-spec/blob/master/spec.md#extends
var extendsServices = function (service, recipe, pathScope) {
  // https://github.com/compose-spec/compose-spec/blob/master/spec.md#finding-referenced-service
  if (service.extends.file === undefined) {
    // EXTENDS OF THE SAME RECIPE
    return buildExtendsService(service, service.extends.service, recipe, pathScope);
  } else {
    // EXTENDS OF ANOTHER RECIPE
    var absolutePath = path.dirname(pathScope.file);
    var extendsRecipe = yaml.load(fs.readFileSync(path.resolve(path.join(absolutePath, service.extends.file)), 'utf8'));
    return buildExtendsService(service, service.extends.service, extendsRecipe, pathScope);
  }
};

var buildExtendsService = function (service, extendsServiceName, recipe, pathScope) {
  var extend = false;
  var extendsRecipeServiceNames = Object.keys(recipe.services);
  for (var extendsRecipeServiceName of extendsRecipeServiceNames) {
    if (extendsRecipeServiceName == extendsServiceName) {
      var extendsService = recipe.services[extendsRecipeServiceName];
      //deep copy
      //var oldService = JSON.parse(JSON.stringify(service));
      var oldService = service;
      service = extendsService;
      var serviceKeys = Object.keys(service);
      for (let key of serviceKeys) {
        verifyRestrictions(key);
        if (key == 'extends') {
          extend = true;
        }
      }
      var oldServiceKeys = Object.keys(oldService);
      for (let key of oldServiceKeys) {
        if (key != 'extends') {
          mergingService(key, service, oldService);
        }
      }
      if (oldService.extends.file) {
        var absolutePath = path.dirname(pathScope.file);
        pathScope.file = path.resolve(path.join(absolutePath, oldService.extends.file));
      }
      if (extend) service = extendsServices(service, recipe, pathScope);

      return service;
    }
  }
  throw new Error('Extends service not found');
};

// https://github.com/compose-spec/compose-spec/blob/master/spec.md#restrictions
var verifyRestrictions = function (key) {
  var restrictions = [
    'links',
    'volumes_from',
    'depends_on',
    'ipc',
    'pid',
    'network_mode',
    //'net'
  ];
  if (restrictions.includes(key)) {
    throw new Error('This extends service cannot be used as a base');
  }
};

// https://github.com/compose-spec/compose-spec/blob/master/spec.md#merging-service-definitions
var mergingService = function (key, service, oldService) {
  var mappings = [
    'environment',
    //'healthcheck',
    'labels',
    'sysctls',
    'extra_hosts',
    'ulimits',
  ];
  var objectMappings = {
    build: { args: '', labels: '', extra_hosts: '' },
    deploy: {
      labels: '',
      update_config: '',
      rollback_config: '',
      restart_policy: '',
      resources: { limits: '' },
    },
    blkio_config: {
      device_read_bps: '',
      device_read_iops: '',
      device_write_bps: '',
      device_write_iops: '',
    },
    logging: { options: '' },
  };
  var sequences = [
    'cap_add',
    'cap_drop',
    //'configs', // not implemented yet
    'device_cgroup_rules',
    'expose',
    //'external_links', // not implemented yet
    'ports',
    //'secrets', // not fully implemented yet
    'security_opt',
  ];
  var objectSequences = {
    deploy: {
      placement: { constraints: '', preferences: '' },
      reservations: { generic_resources: '' },
    },
  };

  // https://github.com/compose-spec/compose-spec/blob/master/spec.md#mappings - MAPPINGS
  if (key == 'build' || key == 'deploy' || key == 'blkio_config' || key == 'logging') {
    // one object level missing in deploy resources
    var objectMappingsKeys = Object.keys(objectMappings[key]);
    for (let objectMappingsKey of objectMappingsKeys) {
      if (oldService[key][objectMappingsKey] !== undefined) {
        service[key][objectMappingsKey] = oldService[key][objectMappingsKey];
      }
    }
  } else if (mappings.includes(key) && service[key] !== undefined) {
    // TRICKY TRICKY (bugs can appear because long and short syntaxes)
    if (Array.isArray(oldService[key]) || Array.isArray(service[key])) {
      if (!Array.isArray(service[key])) {
        let tempService = [];
        let envsNames = Object.keys(service[key]);
        for (let envName of envsNames) {
          tempService.push(envName + '=' + service[key][envName]);
        }
        service[key] = tempService;
      }
      if (!Array.isArray(oldService[key])) {
        var tempOldService = [];
        let envsNames = Object.keys(oldService[key]);
        for (let envName of envsNames) {
          tempOldService.push(envName + '=' + oldService[key][envName]);
        }
        oldService[key] = tempOldService;
      }
      for (let oldServiceLine of oldService[key]) {
        for (let serviceLine of service[key]) {
          if (
            serviceLine.split('=')[0] == oldServiceLine.split('=')[0] ||
            serviceLine.split(':')[0] == oldServiceLine.split(':')[0]
          ) {
            service[key].splice(service[key].indexOf(serviceLine), 1, oldServiceLine);
          }
        }
        if (!service[key].includes(oldServiceLine)) {
          service[key].push(oldServiceLine);
        }
      }
    } else {
      Object.assign(service[key], oldService[key]);
    }
    // https://github.com/compose-spec/compose-spec/blob/master/spec.md#sequences - SEQUENCES
  } else if (key == 'dns' || key == 'dns_search' || key == 'env_file' || key == 'tmpfs') {
    if (Array.isArray(oldService[key]) || Array.isArray(service[key])) {
      if (!Array.isArray(service[key])) {
        let tempService = [];
        if (service[key] !== undefined) {
          tempService.push(service[key]);
        }
        service[key] = tempService;
      }
      if (!Array.isArray(oldService[key])) {
        oldService[key] = [oldService[key]];
      }
      service[key] = service[key].concat(oldService[key]);
    } else {
      service[key] = [];
      service[key].push(service[key]);
      service[key].push(oldService[key]);
    }
  } else if (key == 'deploy') {
    var objectSequencesKeys = Object.keys(objectSequences[key]);
    for (let objectSequencesKey of objectSequencesKeys) {
      if (oldService[key][objectSequencesKey] !== undefined) {
        service[key][objectSequencesKey] = oldService[key][objectSequencesKey];
      }
    }
  } else if (sequences.includes(key) && service[key] !== undefined) {
    if (Array.isArray(oldService[key]) || Array.isArray(service[key])) {
      for (let oldServiceLine of oldService[key]) {
        if (!service[key].includes(oldServiceLine)) {
          service[key].push(oldServiceLine);
        }
      }
    } // else !!! for now all keys are arrays with future implementations can maybe change !!!
  } else {
    // https://github.com/compose-spec/compose-spec/blob/master/spec.md#scalars - SCALARS
    service[key] = oldService[key];
  }
};