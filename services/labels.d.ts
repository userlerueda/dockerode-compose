import Dockerode = require('dockerode');
import { DockerComposeService } from '../models/compose';
export declare function addServiceLabels(service: DockerComposeService, opts: Dockerode.ContainerCreateOptions): void;
