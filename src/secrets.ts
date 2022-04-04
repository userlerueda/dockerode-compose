import * as Dockerode from "dockerode";
import { ComposeOutput, DockerComposeRecipe } from "./models/dockerCompose";
import * as fs from "fs";

export module Secrets {
  export async function down(
    docker: Dockerode,
    projectName: string,
    recipe: DockerComposeRecipe,
    output: ComposeOutput
  ): Promise<void> {
    return secretsDown(docker, projectName, recipe, output);
  }

  export async function up(
    docker: Dockerode,
    projectName: string,
    recipe: DockerComposeRecipe,
    output: ComposeOutput
  ): Promise<any[]> {
    return secretsUp(docker, projectName, recipe, output);
  }
}

async function secretsUp(
  docker: Dockerode,
  projectName: string,
  recipe: DockerComposeRecipe,
  output: ComposeOutput
) {
  var secrets = [];
  var secretNames = Object.keys(recipe.secrets || []);
  for (var secretName of secretNames) {
    var secret = recipe.secrets[secretName];
    if (secret.external === true) continue;
    var opts = {
      Name: projectName + "_" + secretName,
      Data: fs.readFileSync(secret.file, "utf8"),
    };
    if (secret.name !== undefined) {
      opts.Name = secretName;
    }
    secrets.push(await docker.createSecret(opts));
  }
  return secrets;
}

async function secretsDown(
  docker: Dockerode,
  projectName: string,
  recipe: DockerComposeRecipe,
  output: ComposeOutput
) {
  console.log("Not implemented");
}
