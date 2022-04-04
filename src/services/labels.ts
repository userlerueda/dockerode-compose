import * as Dockerode from "dockerode";
import { DockerComposeService } from "../models/dockerCompose";

export function addServiceLabels(
  service: DockerComposeService,
  opts: Dockerode.ContainerCreateOptions
): void {
  // https://github.com/compose-spec/compose-spec/blob/master/spec.md#labels
  if (Array.isArray(service.labels)) {
    // Array
    let labels: Dockerode.ContainerCreateOptions["Labels"] = {};
    if (service.labels.length > 0) {
      // Array with values
      for (const label of service.labels) {
        let p = label.split("=");
        if (p[1] === undefined) {
          p[1] = "";
        }
        labels[p[0]] = p[1];
      }
      opts.Labels = { ...labels, ...opts.Labels };
    } else {
      // Array is empty
      opts.Labels = { ...labels, ...opts.Labels };
    }
  } else {
    // Map
    opts.Labels = { ...service.labels, ...opts.Labels };
  }
}
