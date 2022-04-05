import { createHash } from "crypto";
import * as Dockerode from "dockerode";
import * as fs from "fs";
import * as path from "path";
import { stdout } from "process";
import * as stream from "stream";
import * as tar from "tar-fs";
import {
  ComposeUpOptions,
  DockerComposeRecipe,
  DockerComposeService,
} from "./models/dockerCompose";

//ToDo: complete the compose specification
export function buildHostConfig(
  projectName: string,
  service: DockerComposeService,
  recipe: DockerComposeRecipe
): Dockerode.ContainerCreateOptions["HostConfig"] {
  let hostConfig: Dockerode.ContainerCreateOptions["HostConfig"] = {
    RestartPolicy: { Name: service.restart },
  };

  if (service.volumes_from !== undefined) {
    for (var volume_from of service.volumes_from) {
      var vf = volume_from.split(":");
      var svf = recipe.services[vf[0]];
      this.buildVolumesHostconfig(projectName, svf.volumes, hostConfig, vf[1]);
    }
  }

  if (service.volumes !== undefined) {
    this.buildVolumesHostconfig(projectName, service.volumes, hostConfig);
  }

  if (service.autoremove !== undefined) {
    hostConfig.AutoRemove = service.autoremove;
  }
  if (service.cpu_count !== undefined) {
    hostConfig.CpuCount = service.cpu_count;
  }
  if (service.cpu_percent !== undefined) {
    hostConfig.CpuPercent = service.cpu_percent;
  }
  if (service.cpu_shares !== undefined) {
    hostConfig.CpuShares = service.cpu_shares;
  }
  if (service.cpu_period !== undefined) {
    hostConfig.CpuPeriod = service.cpu_period;
  }
  if (service.cpu_quota !== undefined) {
    hostConfig.CpuQuota = service.cpu_quota;
  }
  if (service.cpu_rt_runtime !== undefined) {
    hostConfig.CpuRealtimeRuntime = service.cpu_rt_runtime;
  }
  if (service.cpu_rt_period !== undefined) {
    hostConfig.CpuRealtimePeriod = service.cpu_rt_period;
  }
  if (service.cpuset !== undefined) {
    hostConfig.CpusetCpus = service.cpuset;
  }
  if (service.cap_add !== undefined) {
    hostConfig.CapAdd = service.cap_add;
  }
  if (service.cap_drop !== undefined) {
    hostConfig.CapDrop = service.cap_drop;
  }
  if (service.cgroup_parent !== undefined) {
    hostConfig.CgroupParent = service.cgroup_parent;
  }
  if (service.device_cgroup_rules !== undefined) {
    hostConfig.DeviceCgroupRules = service.device_cgroup_rules;
  }
  if (service.dns !== undefined) {
    hostConfig.Dns = service.dns;
  }
  if (service.dns_opt !== undefined) {
    hostConfig.DnsOptions = service.dns_opt;
  }
  if (service.dns_search !== undefined) {
    if (typeof service.dns_search === "string") {
      hostConfig.DnsSearch = [service.dns_search];
    } else {
      hostConfig.DnsSearch = service.dns_search;
    }
  }
  if (service.extra_hosts !== undefined) {
    hostConfig.ExtraHosts = service.extra_hosts;
  }
  if (service.group_add !== undefined) {
    hostConfig.GroupAdd = service.group_add;
  }
  if (service.init !== undefined) {
    hostConfig.Init = service.init;
  }
  if (service.ipc !== undefined) {
    hostConfig.IpcMode = service.ipc;
  }
  if (service.isolation !== undefined) {
    hostConfig.Isolation = service.isolation;
  }
  if (service.mem_swappiness !== undefined) {
    hostConfig.MemorySwappiness = service.mem_swappiness;
  }
  if (service.oom_kill_disable !== undefined) {
    hostConfig.OomKillDisable = service.oom_kill_disable;
  }
  if (service.oom_score_adj !== undefined) {
    hostConfig.OomScoreAdj = service.oom_score_adj;
  }
  if (service.pid !== undefined) {
    hostConfig.PidMode = service.pid;
  }
  if (service.pids_limit !== undefined) {
    hostConfig.PidsLimit = service.pids_limit;
  }
  if (service.privileged !== undefined) {
    hostConfig.Privileged = service.privileged;
  }
  if (service.read_only !== undefined) {
    hostConfig.ReadonlyRootfs = service.read_only;
  }
  if (service.runtime !== undefined) {
    hostConfig.Runtime = service.runtime;
  }
  if (service.security_opt !== undefined) {
    hostConfig.SecurityOpt = service.security_opt;
  }
  if (service.shm_size !== undefined) {
    hostConfig.ShmSize = service.shm_size;
  }
  if (service.storage_opt !== undefined) {
    hostConfig.StorageOpt = service.storage_opt;
  }
  if (service.sysctls !== undefined) {
    if (Array.isArray(service.sysctls)) {
      var sysctls = {};
      for (var sysctlsb of service.sysctls) {
        let p = sysctlsb.split("=");
        sysctls[p[0]] = p[1];
      }
      hostConfig.Sysctls = sysctls;
    } else {
      let sysctlKeys = Object.keys(service.sysctls);
      let newSysctls = {};
      for (let key of sysctlKeys) {
        newSysctls[key] = service.sysctls[key].toString();
      }
      hostConfig.Sysctls = newSysctls;
    }
  }
  if (service.userns_mode !== undefined) {
    hostConfig.UsernsMode = service.userns_mode;
  }
  if (service.tmpfs !== undefined) {
    var tmpfs = {};
    if (Array.isArray(service.tmpfs)) {
      for (var tmpfsb of service.tmpfs) {
        let p = tmpfsb.split(":");
        if (p[1] === undefined) {
          p[1] = "";
        }
        tmpfs[p[0]] = p[1];
      }
      hostConfig.Tmpfs = tmpfs;
    } else {
      let p = service.tmpfs.split(":");
      if (p[1] === undefined) {
        p[1] = "";
      }
      tmpfs[p[0]] = p[1];
      hostConfig.Tmpfs = tmpfs;
    }
  }
  if (service.ulimits !== undefined) {
    let ulimitsKeys = Object.keys(service.ulimits);
    let ulimitsArray = [];
    for (let key of ulimitsKeys) {
      let ulimitsObject: DockerComposeService["ulimits"] = {};
      if (typeof service.ulimits[key] === "object") {
        ulimitsObject.Name = key;
        ulimitsObject.Soft = service.ulimits[key].soft;
        ulimitsObject.Hard = service.ulimits[key].hard;
        ulimitsArray.push(ulimitsObject);
      } else {
        ulimitsObject.Name = key;
        ulimitsObject.Soft = service.ulimits[key];
        ulimitsObject.Hard = service.ulimits[key];
        ulimitsArray.push(ulimitsObject);
      }
    }
    hostConfig.Ulimits = ulimitsArray;
  }
  if (service.blkio_config !== undefined) {
    if (service.blkio_config.weight !== undefined) {
      hostConfig.BlkioWeight = service.blkio_config.weight;
    }
    if (service.blkio_config.weight_device !== undefined) {
      let weight_device = [{}];
      weight_device[0]["Path"] = service.blkio_config.weight_device[0].path;
      weight_device[0]["Weight"] = service.blkio_config.weight_device[0].weight;
      hostConfig.BlkioWeightDevice = weight_device;
    }
    if (service.blkio_config.device_read_bps !== undefined) {
      hostConfig.BlkioDeviceReadBps = convertSizeStringToByteValue(
        service.blkio_config.device_read_bps
      );
    }
    if (service.blkio_config.device_read_iops !== undefined) {
      let device_read_iops = [{}];
      device_read_iops[0]["Path"] =
        service.blkio_config.device_read_iops[0].path;
      device_read_iops[0]["Rate"] =
        service.blkio_config.device_read_iops[0].rate;
      hostConfig.BlkioDeviceReadIOps = device_read_iops;
    }
    if (service.blkio_config.device_write_bps !== undefined) {
      hostConfig.BlkioDeviceWriteBps = convertSizeStringToByteValue(
        service.blkio_config.device_write_bps
      );
    }
    if (service.blkio_config.device_write_iops !== undefined) {
      let device_write_iops = [{}];
      device_write_iops[0]["Path"] =
        service.blkio_config.device_write_iops[0].path;
      device_write_iops[0]["Rate"] =
        service.blkio_config.device_write_iops[0].rate;
      hostConfig.BlkioDeviceWriteIOps = device_write_iops;
    }
  }
  if (service.logging !== undefined) {
    let logging: DockerComposeService["logging"] = {};
    logging.Type = service.logging.driver;
    logging.Config = service.logging.options;
    hostConfig.LogConfig = logging;
  }
  return hostConfig;
}

export function buildVolumesHostconfig(
  projectName: string,
  volumes,
  output,
  type
) {
  if (output["Binds"] === undefined) {
    output["Binds"] = [];
  }
  for (var volume of volumes) {
    if (typeof volume === "string" || volume instanceof String) {
      var aux = volume;
      if (type == "ro") {
        aux += ":ro";
      }
      output["Binds"].push(aux);
    } else {
      var volumestr = "";
      if (volume.source && volume.target) {
        volumestr += volume.source + ":" + volume.target + ":";
      }
      if (volume.read_only || type == "ro") {
        volumestr += "ro,";
      }
      if (volume.volume && volume.volume.nocopy) {
        volumestr += "nocopy,";
      }
      if (volume.bind && volume.bind.propagation) {
        volumestr += volume.bind.propagation + ",";
      }
      volumestr = volumestr.slice(0, -1);
      output["Binds"].push(volumestr);
    }
  }
}

export function buildVolumes(
  volumes: DockerComposeService["volumes"],
  opts: Dockerode.ContainerCreateOptions
) {
  if (opts["Volumes"] === undefined) {
    opts["Volumes"] = {};
  }
  for (var volume of volumes) {
    if (typeof volume === "object") {
      // Long syntax
      if (volume.target) {
        opts["Volumes"][volume.target] = {};
      }
    } else {
      // Short syntax
      var v = volume.split(":");
      opts["Volumes"][v[1]] = {};
    }
  }
}

export function buildEnvVars(service): Dockerode.ContainerCreateOptions["Env"] {
  var output: Dockerode.ContainerCreateOptions["Env"] = [];

  if (service.env_file !== undefined) {
    if (Array.isArray(service.env_file)) {
      for (let env_file_path of service.env_file) {
        buildEnvVarsFromFile(env_file_path, output);
      }
    } else {
      buildEnvVarsFromFile(service.env_file, output);
    }
  }

  if (service.environment !== undefined) {
    if (Array.isArray(service.environment)) {
      for (let environment_line of service.environment) {
        output.push(environment_line);
      }
    } else {
      var envsNames = Object.keys(service.environment);
      for (var envName of envsNames) {
        output.push(envName + "=" + service.environment[envName]);
      }
    }
  }
  return output;
}

export function buildNetworks(
  projectName: string,
  serviceName: string,
  serviceNetworks,
  networksToAttach,
  opts: Dockerode.ContainerCreateOptions
) {
  console.debug({
    buildNetworks: { projectName, serviceNetworks, networksToAttach, opts },
  });
  if (Array.isArray(serviceNetworks)) {
    for (let index = 0; index < serviceNetworks.length; index++) {
      let networkName = projectName + "_" + serviceNetworks[index];
      let networkTemplate = {
        NetworkingConfig: {
          EndpointsConfig: {},
        },
      };
      networkTemplate.NetworkingConfig.EndpointsConfig[networkName] = {};
      networkTemplate.NetworkingConfig.EndpointsConfig[networkName]["Aliases"] =
        [serviceName];
      if (index === 0)
        opts.NetworkingConfig.EndpointsConfig =
          networkTemplate.NetworkingConfig.EndpointsConfig;

      networksToAttach.push(networkTemplate.NetworkingConfig.EndpointsConfig);
    }
  } else {
    let networkNames = Object.keys(serviceNetworks);
    for (let index = 0; index < networkNames.length; index++) {
      let network = serviceNetworks[networkNames[index]] || {};
      let networkName = projectName + "_" + networkNames[index];
      let networkTemplate = {
        NetworkingConfig: {
          EndpointsConfig: {},
        },
      };
      networkTemplate.NetworkingConfig.EndpointsConfig[networkName] = {};
      networkTemplate.NetworkingConfig.EndpointsConfig[networkName][
        "IPAMConfig"
      ] = {};
      if (network.aliases !== undefined) {
        networkTemplate.NetworkingConfig.EndpointsConfig[networkName][
          "Aliases"
        ] = network.aliases;
      }
      if (network.ipv4_address !== undefined) {
        networkTemplate.NetworkingConfig.EndpointsConfig[
          networkName
        ].IPAMConfig["IPv4Address"] = network.ipv4_address;
      }
      if (network.ipv6_address !== undefined) {
        networkTemplate.NetworkingConfig.EndpointsConfig[
          networkName
        ].IPAMConfig["IPv6Address"] = network.ipv6_address;
      }
      if (network.link_local_ips !== undefined) {
        networkTemplate.NetworkingConfig.EndpointsConfig[
          networkName
        ].IPAMConfig["LinkLocalIPs"] = network.link_local_ips;
      }
      if (network.priority !== undefined) {
        networkTemplate.NetworkingConfig.EndpointsConfig[networkName].priority =
          network.priority;
      } else {
        networkTemplate.NetworkingConfig.EndpointsConfig[
          networkName
        ].priority = 0;
      }
      if (index === 0) {
        opts.NetworkingConfig.EndpointsConfig =
          networkTemplate.NetworkingConfig.EndpointsConfig;
      }
      networksToAttach.push(networkTemplate.NetworkingConfig.EndpointsConfig);
    }
  }
  console.debug({
    buildNetworks: { projectName, serviceNetworks, networksToAttach, opts },
  });
}

// TODO: OPTIMIZE!
export function convertSizeStringToByteValue(obj) {
  let rate = obj[0].rate.toLowerCase();
  let new_obj = [{}];
  if (rate.includes("k")) {
    if (rate.indexOf("k") == rate.length - 1) {
      rate = rate.replace("k", "");
    } else if (rate.indexOf("k") == rate.length - 2) {
      rate = rate.replace("kb", "");
    }
    new_obj[0]["Path"] = obj[0].path;
    new_obj[0]["Rate"] = rate * 1024;
    return new_obj;
  } else if (rate.includes("m")) {
    if (rate.indexOf("m") == rate.length - 1) {
      rate = rate.replace("m", "");
    } else if (rate.indexOf("m") == rate.length - 2) {
      rate = rate.replace("mb", "");
    }
    new_obj[0]["Path"] = obj[0].path;
    new_obj[0]["Rate"] = rate * 1024 * 1024;
    return new_obj;
  } else if (rate.includes("g")) {
    if (rate.indexOf("g") == rate.length - 1) {
      rate = rate.replace("g", "");
    } else if (rate.indexOf("g") == rate.length - 2) {
      rate = rate.replace("gb", "");
    }
    new_obj[0]["Path"] = obj[0].path;
    new_obj[0]["Rate"] = rate * 1024 * 1024 * 1024;
    return new_obj;
  }
  return obj;
}

export function buildEnvVarsFromFile(
  env_file_path: fs.PathOrFileDescriptor,
  output: Dockerode.ContainerCreateOptions["Env"]
) {
  // Each line in an env file MUST be in `VAR=VAL` format.
  let env_file = fs.readFileSync(env_file_path, "utf8").toString().split("\n");
  for (let env_line of env_file) {
    // Lines beginning with `#` MUST be ignored. Blank lines MUST also be ignored.
    if (env_line != "" && env_line.indexOf("#") != 0) {
      let env_line_split = env_line.split("=");
      // `VAL` MAY be omitted, sin such cases the variable value is empty string. `=VAL` MAY be omitted, in such cases the variable is **unset**.
      if (env_line_split[0] != "" && env_line_split[1] != "") {
        output.push(env_line);
      }
    }
  }
}

export async function buildDockerImage(
  docker: Dockerode,
  buildPath: string,
  obj: Dockerode.ImageBuildOptions,
  dockerfile: string,
  options: ComposeUpOptions
) {
  options = options || {};
  if (dockerfile !== null) {
    obj["dockerfile"] = path.basename(dockerfile);
    let streami = await docker.buildImage(
      {
        context: buildPath,
        src: [dockerfile],
      },
      obj
    );
    if (options.verbose === true) {
      streami.pipe(stdout);
    } else {
      streami.pipe(new stream.PassThrough());
    }
    await new Promise((fulfill) => streami.once("end", fulfill));
  } else {
    var tarStream: NodeJS.ReadableStream = tar.pack(buildPath);
    let streami = await docker.buildImage(tarStream, obj);
    if (options.verbose === true) {
      streami.pipe(stdout);
    } else {
      streami.pipe(new stream.PassThrough());
    }
    await new Promise((fulfill) => streami.once("end", fulfill));
  }
}

export function buildSHA256(serviceString: string) {
  return createHash("sha256").update(serviceString).digest("hex");
}
