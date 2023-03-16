import { cpSync } from "fs";

console.log("Copying mainjs file");
cpSync("./dist/main.js", "./main.js");
console.log("Done!");
