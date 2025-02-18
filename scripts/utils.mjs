import { spawnSync as _spawnSync } from "child_process";

export function spawnSync(str, options) {
  const [command, ...args] = str.split(" ");
  return _spawnSync(command, args, {
    ...options,
    stdio: "inherit",
    shell: true,
    encoding: "utf-8",
  });
}
