import Dockerode = require('dockerode');

interface HostConfig extends Dockerode.HostConfig {
  DnsSearch?: string[] | undefined;
  CpuCount?: number | undefined;
  CpuPercent?: number | undefined;
  CpuRealtimePeriod?: number | undefined;
  CpuRealtimeRuntime?: number | undefined;
}

export interface ContainerCreateOptions extends Dockerode.ContainerCreateOptions {
  Healthcheck?: Dockerode.HealthConfig;
  HostConfig?: HostConfig;
}
