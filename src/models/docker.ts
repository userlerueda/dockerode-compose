import Dockerode = require('dockerode');

export interface ContainerCreateOptions extends Dockerode.ContainerCreateOptions {
  Healthcheck?: Dockerode.HealthConfig;
}
