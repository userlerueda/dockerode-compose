import Dockerode = require('dockerode');

export interface ComposeDownOptions {
  rmi?: 'all' | 'local';
  'remove-orphans'?: boolean;
  v?: string;
  volumes?: string;
}

export interface ComposePullArgs {
  serviceName?: string;
  options?: ComposePullOptions;
  callback?: Callback<any>;
}

export interface ComposePullOptions {
  verbose?: any;
  streams?: any;
  services?: string;
}

export interface ComposeRestartOptions {
  volumes?: string;
}

export interface ComposeUpOptions {}

export interface ComposeOutput {
  secrets?: any[];
  configs?: any[];
  file?: string;
  images?: Dockerode.Image[];
  networks?: any[];
  services?: any[];
  volumes?: any[];
}

export interface ComposeRecipe {
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
  labels?: {} | [];
  ports?: DockerComposePorts[];
  restart?: string;
  volumes?: string[];
}

export type DockerComposePorts = string | DockerComposePortsLongSyntax;

export interface DockerComposePortsLongSyntax {
  target: number;
  published: number;
  protocol: string;
  mode: string;
}

export type Callback<T> = (error?: any, result?: T) => void;
