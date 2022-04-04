import * as Dockerode from "dockerode";
import * as _ from "lodash";
import { DockerComposeService } from "../models/dockerCompose";
import { fillPortArray } from "./utils";

export function addServicePorts(
  service: DockerComposeService,
  opts: Dockerode.ContainerCreateOptions
): void {
  const servicePorts = service.ports;
  let ports: Dockerode.ContainerCreateOptions["HostConfig"]["PortBindings"] =
    {};

  for (const port of servicePorts) {
    if (typeof port === "object") {
      // LONG SYNTAX
      // !!! INCOMPLETE - NOT USING DIFFERENT MODES - `mode`: `host` for publishing a host port on each node, or `ingress` for a port to be load balanced.
      ports[port.target + "/" + port.protocol] = [
        { HostPort: port.published.toString() },
      ];
    } else {
      // SHORT SYNTAX
      // TODO: SIMPLIFY THIS BLOCK OF CODE! MAYBE!
      var port_split = port.split(":");

      if (port_split.length == 2) {
        // "xxxx:xxxx"
        if (port_split[1].includes("-")) {
          // "9090-9091:8080-8081"
          let split_port_split0 = port_split[0].split("-");
          let split_port_split0_array = [];
          split_port_split0_array = fillPortArray(
            parseInt(split_port_split0[0]),
            parseInt(split_port_split0[1])
          );

          let split_port_split1 = port_split[1].split("-");
          let split_port_split1_array = [];
          split_port_split1_array = fillPortArray(
            parseInt(split_port_split1[0]),
            parseInt(split_port_split1[1])
          );

          for (let index in split_port_split0_array) {
            ports[split_port_split1_array[index] + "/tcp"] = [
              { HostPort: split_port_split0_array[index].toString() },
            ];
          }
        } else if (port_split[0].includes("-")) {
          // "3000-3005"
          let split_port_split = port_split[0].split("-");
          ports[port_split[1] + "/tcp"] = [];
          for (
            let i = parseInt(split_port_split[0]);
            i <= parseInt(split_port_split[1]);
            i++
          ) {
            ports[port_split[1] + "/tcp"].push({ HostPort: i.toString() });
          }
        } else if (port_split[1].includes("/")) {
          // "6060:6060/udp"
          ports[port_split[1]] = [{ HostPort: port_split[0] }];
        } else {
          // "8000:8000"
          ports[port_split[1] + "/tcp"] = [{ HostPort: port_split[0] }];
        }
      } else if (port_split.length == 3) {
        // "x.x.x.x:xxxx:xxxx"
        if (port_split[2].includes("-")) {
          // "127.0.0.1:5000-5010:5000-5010"
          let split_port_split1 = port_split[1].split("-");
          let split_port_split1_array = [];
          split_port_split1_array = fillPortArray(
            parseInt(split_port_split1[0]),
            parseInt(split_port_split1[1])
          );

          let split_port_split2 = port_split[2].split("-");
          let split_port_split2_array = [];
          split_port_split2_array = fillPortArray(
            parseInt(split_port_split2[0]),
            parseInt(split_port_split2[1])
          );

          for (let index in split_port_split1_array) {
            ports[split_port_split2_array[index] + "/tcp"] = [
              {
                HostPort: split_port_split1_array[index].toString(),
                HostIp: port_split[0],
              },
            ];
          }
        } else if (port_split[1] == "") {
          // "127.0.0.1::5000
          ports[port_split[2] + "/tcp"] = [
            { HostPort: port_split[2], HostIp: port_split[0] },
          ];
        } else {
          // "127.0.0.1:8001:8001"
          ports[port_split[2] + "/tcp"] = [
            { HostPort: port_split[1], HostIp: port_split[0] },
          ];
        }
      } else {
        // "xxxx"
        if (port_split[0].includes("-")) {
          // "3000-3005"
          let split_port_split = port_split[0].split("-");
          for (
            let i = parseInt(split_port_split[0]);
            i <= parseInt(split_port_split[1]);
            i++
          ) {
            ports[i + "/tcp"] = [{ HostPort: i.toString() }];
          }
        } else {
          // "3000"
          ports[port + "/tcp"] = [{ HostPort: port }];
        }
      }
    }
  }

  let additionalOpts: Dockerode.ContainerCreateOptions = {
    HostConfig: { PortBindings: ports },
  };
  Object.keys(ports).map((port) => {
    additionalOpts["ExposedPorts"] = {};
    additionalOpts["ExposedPorts"][port] = {};
  });

  console.debug(`additionalOpts: ${JSON.stringify(additionalOpts)}`);

  opts = _.merge(opts, additionalOpts);
}
