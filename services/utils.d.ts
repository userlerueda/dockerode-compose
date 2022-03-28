import Dockerode = require('dockerode');
import { DockerComposeService } from '../models/compose';
export declare function isServiceUpToDate(docker: Dockerode, projectName: string, serviceName: string, configHash: string): Promise<{
    isServiceUpToDate: boolean;
    existingContainer: Dockerode.Container;
}>;
export declare function fillPortArray(start: number, end: number): number[];
export declare function getServiceNetworks(projectName: string, service: DockerComposeService): string[];
