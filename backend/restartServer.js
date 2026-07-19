import { execSync, spawn } from "child_process";
import path from "path";

const killPort5000 = async () => {
  try {
    if (process.platform === "win32") {
      const output = execSync("netstat -ano | findstr :5000").toString();
      const lines = output.split("\n").filter(l => l.includes("LISTENING"));
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && parseInt(pid, 10) !== process.pid && parseInt(pid, 10) > 0) {
          console.log(`Killing old server process on port 5000 (PID: ${pid})...`);
          try { execSync(`taskkill /F /PID ${pid}`); } catch (e) {}
        }
      }
    }
  } catch (err) {
    // Port 5000 is free or netstat had no output
  }
};

const main = async () => {
  await killPort5000();
  // Wait 1 second for Windows to release the TCP socket from TIME_WAIT
  await new Promise(r => setTimeout(r, 1000));

  console.log("🚀 Booting Express + MongoDB server with Cloudinary & JWT Auth...");
  const serverPath = path.join(process.cwd(), "backend", "server.js");
  
  const child = spawn("node", [serverPath], {
    stdio: "inherit",
    cwd: path.join(process.cwd(), "backend")
  });

  child.on("error", (err) => {
    console.error("Failed to start server.js child process:", err);
  });

  child.on("exit", (code) => {
    console.log(`Server child process exited with code ${code}`);
    process.exit(code || 0);
  });
};

main();
