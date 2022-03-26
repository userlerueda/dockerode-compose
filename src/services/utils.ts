import Dockerode = require('dockerode');
import { logger } from '../logger';
import { DockerComposeService } from '../models/compose';

export async function isServiceUpToDate(
  docker: Dockerode,
  projectName: string,
  serviceName: string,
  configHash: string,
) {
  let isServiceUpToDate = false;

  let currentServices = await docker.listContainers({
    all: true,
    filters: `{"label":["com.docker.compose.project=${projectName}","com.docker.compose.service=${serviceName}"]}`,
  });

  let existingContainer: Dockerode.Container;
  if (currentServices.length !== 0) {
    logger.debug(`Found '${currentServices.length}' containers for service: ${serviceName}`);
    for (const currentService of currentServices) {
      let currentServiceHash = currentService.Labels['com.docker.compose.config-hash'];
      logger.silly(`Current container hash: ${configHash}`);
      logger.silly(`Current service hash: ${currentServiceHash}`);
      if (currentServiceHash === configHash && currentService.State === 'running') {
        isServiceUpToDate = true;
        existingContainer = docker.getContainer(currentService.Id);
      } else {
        logger.debug(`Container '${currentService.Id}' is not up to date. Recreating...`);
        await docker.getContainer(currentService.Id).remove({ force: true });
      }
    }
  }

  return { isServiceUpToDate, existingContainer };
}

export function fillPortArray(start: number, end: number): number[] {
  return Array(end - start + 1)
    .fill(0)
    .map((_, idx) => start + idx);
}

export function getServiceNetworks(projectName: string, service: DockerComposeService): string[] {
  let networks: string[] = [];
  if (Array.isArray(service.networks)) {
    // Array
    if (service.networks.length > 0) {
      networks = service.networks;
    }
  } else {
    // Map
    networks = Object.keys(service.networks);
  }

  return networks.map((network) => `${projectName}_${network}`);
}