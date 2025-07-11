#!/usr/bin/env bun

import { spawn, execSync } from "child_process";
import { homedir } from "os";
import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

const PACKAGE_NAME = "espresso3389/pdf-splitter-mcp";

async function getVersion() {
  try {
    const packageJsonPath = join(import.meta.dir, '..', 'package.json');
    const packageContent = await Bun.file(packageJsonPath).text();
    const packageJson = JSON.parse(packageContent);
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

async function showUsage() {
  const version = await getVersion();
  console.log(`
PDF Splitter MCP Server v${version} - Easy Installation Tool

Usage:
  bunx ${PACKAGE_NAME} install claudecode    Install for Claude Code
  bunx ${PACKAGE_NAME} install geminicli     Install for Gemini CLI
  bunx ${PACKAGE_NAME} serve                 Run the MCP server
  bunx ${PACKAGE_NAME}                       Show this help message

Examples:
  # Install for Claude Code
  bunx ${PACKAGE_NAME} install claudecode

  # Install for Gemini CLI
  bunx ${PACKAGE_NAME} install geminicli

  # Run the server directly
  bunx ${PACKAGE_NAME} serve
`);
}

async function installClaudeCode() {
  try {
    console.log("Installing PDF Splitter MCP for Claude Code...");
    
    const isNetworkInvocation = process.env.npm_lifecycle_event === "bunx";
    const command = "claude";
    const args = isNetworkInvocation
      ? ["mcp", "add", "pdf-splitter", "--", "bunx", PACKAGE_NAME, "serve"]
      : ["mcp", "add", "pdf-splitter", "--", "bun", "run", join(import.meta.dir, "cli.ts"), "serve"];
    
    const child = spawn(command, args, { stdio: "inherit" });
    
    child.on("error", (error) => {
      console.error("Failed to run claude command:", error.message);
      console.error("Make sure Claude Code CLI is installed and in your PATH");
      process.exit(1);
    });
    
    child.on("exit", (code) => {
      if (code === 0) {
        console.log("\n✅ Successfully installed PDF Splitter MCP for Claude Code!");
        console.log("Restart Claude Code to use the PDF splitter tools.");
      } else {
        console.error(`\n❌ Installation failed with code ${code}`);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Installation error:", error);
    process.exit(1);
  }
}

async function installGeminiCLI() {
  try {
    console.log("Installing PDF Splitter MCP for Gemini CLI...");
    
    const isNetworkInvocation = process.env.npm_lifecycle_event === "bunx";
    const configDir = join(homedir(), ".config", "gemini-cli");
    const configPath = join(configDir, "config.json");
    
    // Create config directory if it doesn't exist
    if (!existsSync(configDir)) {
      await mkdir(configDir, { recursive: true });
    }
    
    let config: any = {};
    
    // Read existing config if it exists
    if (existsSync(configPath)) {
      try {
        const content = await readFile(configPath, "utf-8");
        config = JSON.parse(content);
      } catch {
        console.warn("Warning: Could not parse existing config.json, creating new one");
      }
    }
    
    // Initialize mcpServers if it doesn't exist
    config.mcpServers ??= {};
    
    // Add our server configuration
    config.mcpServers["pdf-splitter"] = isNetworkInvocation
      ? {
          command: "bunx",
          args: [PACKAGE_NAME, "serve"]
        }
      : {
          command: "bun",
          args: ["run", join(import.meta.dir, "cli.ts"), "serve"]
        };
    
    // Write updated config
    await writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log("\n✅ Successfully installed PDF Splitter MCP for Gemini CLI!");
    console.log(`Configuration written to: ${configPath}`);
    console.log("Restart Gemini CLI to use the PDF splitter tools.");
  } catch (error) {
    console.error("Installation error:", error);
    process.exit(1);
  }
}

async function serve() {
  // Import and run the MCP server
  await import("./index.js");
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await showUsage();
    return;
  }
  
  const command = args[0];
  
  if (command === '--version' || command === '-v') {
    const version = await getVersion();
    const commit = getGitCommit();
    console.log(`${version} (${commit})`);
    return;
  }
  
  switch (command) {
    case "install": {
      const target = args[1]?.toLowerCase();
      if (target === "claudecode") {
        await installClaudeCode();
      } else if (target === "geminicli") {
        await installGeminiCLI();
      } else {
        console.error(`Unknown installation target: ${target}`);
        console.error("Use 'claudecode' or 'geminicli'");
        process.exit(1);
      }
      break;
    }
      
    case "serve":
      await serve();
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      await showUsage();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});