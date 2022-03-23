const logger = require('./logger');

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
  logger.debug("Creating networks...")
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
        if (
          err.statusCode == 409 &&
          err.json.message.includes('already exists')
        ) {
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
    try {
      let networkName = projectName + '_default'
      console.debug(`Creating network "${networkName}" with default driver`)
      networks.push({
        name: networkName,
        network: await docker.createNetwork({
          Name: networkName,
          Labels: {
            'com.docker.compose.network': 'default',
            'com.docker.compose.project': projectName,
          },
          CheckDuplicate: true,
        }),
      });
    } catch (err) {
      if (
        err.statusCode == 409 &&
        err.json.message.includes('already exists')
      ) {
        let returnedNetwork = await docker.listNetworks({
          filters: { name: [projectName + '_default'] },
        });
        networks.push({
          name: projectName + '_' + networkName,
          network: await docker.getNetwork(returnedNetwork[0].Id),
        });
      } else {
        throw err;
      }
    }
  }
  logger.silly(networks)
  return networks;
}

module.exports = {
  down,
  up,
};
