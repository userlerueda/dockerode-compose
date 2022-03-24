const logger = require('./logger').logger;

async function down(docker, projectName, recipe, output) {
  var networks = [];
  var networkNames = Object.keys(recipe.networks || { default: null });
  for (var networkName of networkNames) {
    try {
      var network = await docker.getNetwork(projectName + '_' + networkName);
    } catch (e) {}

    try {
      await network.remove();
    } catch (e) {}
  }
  return networks;
}

async function up(docker, projectName, recipe, output) {
  logger.info('Creating networks...');
  var networks = [];
  var networkNames = Object.keys(recipe.networks || []);
  for (var networkName of networkNames) {
    var network = recipe.networks[networkName];
    if (network === null) {
      try {
        networks.push({
          name: projectName + '_' + networkName,
          network: await docker.createNetwork({
            Name: projectName + '_' + networkName,
            CheckDuplicate: true,
          }),
        });
      } catch (err) {
        if (err.statusCode == 409 && err.json.message.includes('already exists')) {
          let returnedNetwork = await docker.listNetworks({
            filters: { name: [projectName + '_' + networkName] },
          });
          networks.push({
            name: projectName + '_' + networkName,
            network: await docker.getNetwork(returnedNetwork[0].Id),
          });
        } else {
          throw err;
        }
      }
      continue;
    }
    if (network.external === true) continue;
    var opts = {
      Name: projectName + '_' + networkName,
      Driver: network.driver,
      DriverOpts: network.driver_opts,
      Labels: {
        ...network.labels,
        ...{
          'com.docker.compose.network': 'default',
          'com.docker.compose.project': projectName,
        },
      },
      Attachable: network.attachable,
      EnableIPv6: network.enable_ipv6,
      Internal: network.internal,
      CheckDuplicate: true,
    };
    if (network.name !== undefined) {
      opts.Name = networkName;
    }
    if (network.ipam !== undefined) {
      opts.IPAM = {
        Driver: network.ipam.driver,
        Options: network.ipam.options,
      };
      if (network.ipam.config !== undefined) {
        opts.IPAM['Config'] = {
          Subnet: network.ipam.config.subnet,
          IPRange: network.ipam.config.ip_range,
          Gateway: network.ipam.config.gateway,
          AuxAddress: network.ipam.config.aux_addresses,
        };
      }
    }
    //if exists we have to compare with the existing network
    networks.push({
      name: projectName + '_' + networkName,
      network: await docker.createNetwork(opts),
    });
  }

  if (networks.length === 0) {
    let networkName = projectName + '_default';
    try {
      logger.info(`Creating network "${networkName}" with default driver`);
      let network = await docker.createNetwork({
        Name: networkName,
        Labels: {
          'com.docker.compose.network': 'default',
          'com.docker.compose.project': projectName,
        },
        CheckDuplicate: true,
      });
      network['name'] = networkName;
      network['isDefault'] = true;
      networks.push(network);
    } catch (err) {
      if (err.statusCode == 409 && err.json.message.includes('already exists')) {
        logger.warn(`Network "${networkName}" already exists`);
        let returnedNetwork = await docker.listNetworks({
          filters: { name: [networkName] },
        });
        logger.silly(`Returned network: ${JSON.stringify(returnedNetwork)}`);
        let network = await docker.getNetwork(returnedNetwork[0].Id);
        network['name'] = networkName;
        network['isDefault'] = true;
        networks.push(network);
      } else {
        throw err;
      }
    }
  }
  logger.debug(`Networks: ${JSON.stringify(networks)}`);
  return networks;
}

module.exports = {
  down,
  up,
};
