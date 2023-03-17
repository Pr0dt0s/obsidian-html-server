import { spawn } from "node:child_process";
import { config } from "dotenv";
config();

spawn(process.env.OBSIDIAN_PATH);
