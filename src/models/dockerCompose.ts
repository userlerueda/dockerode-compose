import * as Dockerode from 'dockerode';

export interface ComposeDownOptions {
  rmi?: 'all' | 'local';
  'remove-orphans'?: boolean;
  v?: string;
  volumes?: string;
}
export interface ComposePullArgs {
  serviceName: string | undefined;
  options: ComposePullOptions;
  callback: Callback<any> | undefined;
}
export interface ComposePullOptions {
  verbose?: any;
  streams?: any;
  services?: string;
}
export interface ComposeRestartOptions extends ComposeDownOptions, ComposeUpOptions {}
export interface ComposeUpOptions {
  verbose?: boolean;
}
export interface ComposeOutput {
  secrets?: any[];
  configs?: any[];
  file?: string;
  images?: Dockerode.Image[];
  networks?: Network[];
  services?: any[];
  volumes?: any[];
}
export interface DockerComposeRecipe {
  version?: string;
  configs?: DockerComposeConfigs;
  services?: DockerComposeServices;
  networks?: any;
  volumes?: any;
  secrets?: any;
}
export interface DockerComposeConfig {
  file?: string;
  external?: boolean;
  name: string;
}
export interface DockerComposeConfigs {
  [serviceName: string]: DockerComposeConfig;
}
export interface DockerComposeServices {
  [serviceName: string]: DockerComposeService;
}
export interface DockerComposeService {
  autoremove?: boolean;
  entrypoint?: any;
  healthcheck?: any;
  working_dir?: any;
  user?: any;
  tty?: any;
  expose?: any;
  stop_signal?: any;
  stop_grace_period?: any;
  stdin_open?: any;
  mac_address?: any;
  domainname?: any;
  container_name?: any;
  volumes_from?: any;
  networks?: any;
  build?: any;
  extends?: any;
  command?: string[];
  env_file?: string[];
  environment?: string[];
  hostname?: string;
  image?: string;
  labels?:
    | {
        [label: string]: string;
      }
    | string[];
  ports?: DockerComposePort[];
  restart?: string;
  volumes?: DockerComposeServiceVolume[];
  depends_on?:
    | string[]
    | {
        [serviceName: string]: {
          condition?: string;
        };
      };
  cpu_count?: number;
  cpu_percent?: number;
  cpu_shares?: number;
  cpu_period?: number;
  cpu_quota?: number;
  cpu_rt_period?: number;
  cpu_rt_runtime?: number;
  cpuset?: string;
  cap_add?: string[];
  cap_drop?: string[];
  cgroup_parent?: string;
  device_cgroup_rules?: string[];
  dns?: string[];
  dns_opt?: string[];
  dns_search?: string[] | string;
  extra_hosts?: string[];
  group_add?: string[];
  init?: boolean;
  ipc_mode?: string;
  ipc?: string;
  isolation?: string;
  mem_swappiness?: number;
  oom_kill_disable?: boolean;
  oom_score_adj?: number;
  pid?: string;
  pids_limit?: number;
  privileged?: boolean;
  read_only?: boolean;
  runtime?: string;
  security_opt?: string[];
  shm_size?: number;
  storage_opt?: {
    [storageOpt: string]: string;
  };
  sysctls?:
    | {
        [sysctl: string]: string;
      }
    | string[];
  userns_mode?: string;
  tmpfs?: string[] | string;
  ulimits?: {
    [ulimit: string]: any;
  };
  blkio_config?: any;
  logging?: any;
}
export type DockerComposePort = string | DockerComposePortLongSyntax;
export type DockerComposeServiceVolume = string | DockerComposeServiceVolumesLongSyntax;
export interface DockerComposePortLongSyntax {
  target: number;
  published: number;
  protocol: string;
  mode: string;
}
export interface DockerComposeServiceVolumesLongSyntax {
  type: 'volume' | 'bind' | 'tmpfs' | 'npipe';
  source?: string;
  target?: string;
  read_only?: boolean;
  bind?: {
    propagation?: string;
    create_host_path?: boolean;
    selinux?: 'z' | 'Z';
  };
  volume?: {
    nocopy?: boolean;
  };
  tmpfs?: {
    size?: number | string;
  };
  consistency?: string;
}
export type Callback<T> = (error?: any, result?: T) => void;

export interface Network {
  name: string;
  isDefault?: boolean;
  network: Dockerode.Network;
}
