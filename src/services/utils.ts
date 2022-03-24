import Dockerode = require('dockerode');
import { logger } from '../logger';
import { DockerComposeService } from '../models/compose';

export async function isServiceUpToDate(
  docker: Dockerode,
  projectName: string,
  serviceName: string,
  configHash: string,
): Promise<boolean> {
  let isUpToDate = false;

  let currentServices = await docker.listContainers({
    all: true,
    filters: `{"label":["com.docker.compose.project=${projectName}","com.docker.compose.service=${serviceName}"]}`,
  });

  if (currentServices.length !== 0) {
    logger.debug(`Found '${currentServices.length}' containers for service: ${serviceName}`);
    for (const currentService of currentServices) {
      let currentServiceHash = currentService.Labels['com.docker.compose.config-hash'];
      logger.debug(`Current container hash: ${configHash}`);
      logger.debug(`Current service hash: ${currentServiceHash}`);
      if (currentServiceHash === configHash) {
        isUpToDate = true;
      } else {
        logger.debug(`Container '${currentService.Id}' is not up to date. Recreating...`);
        await docker.getContainer(currentService.Id).remove({ force: true });
      }
    }
  }

  return isUpToDate;
}

export function fillPortArray(start: number, end: number): number[] {
  return Array(end - start + 1)
    .fill(0)
    .map((_, idx) => start + idx);
}
