import Docker from "dockerode";

let docker: Docker | null = null;

/**
 * Get or create the dockerode instance.
 * Connects via Docker socket at /var/run/docker.sock.
 */
export function getDocker(): Docker {
  if (!docker) {
    docker = new Docker({ socketPath: "/var/run/docker.sock" });
  }
  return docker;
}
