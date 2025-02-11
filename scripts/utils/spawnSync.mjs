import childProcess from "child_process";

export const spawnSync = async (command) => {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(" ");
    const child = childProcess.spawn(cmd, args, {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });
};
