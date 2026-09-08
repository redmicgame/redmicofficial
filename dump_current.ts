
import { REAL_WORLD_DISCOGRAPHIES } from "./realWorldDiscographies";
import * as fs from "fs";
const current = { ...REAL_WORLD_DISCOGRAPHIES };
fs.writeFileSync("temp_current_discog.json", JSON.stringify(current));
