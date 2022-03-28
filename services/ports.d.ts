import Dockerode = require('dockerode');
import { DockerComposeService } from '../models/compose';
export declare function addServicePorts(service: DockerComposeService, opts: Dockerode.ContainerCreateOptions): void;
