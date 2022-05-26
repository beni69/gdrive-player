import { appendFile } from "node:fs/promises";
import { format } from "node:util";

export default (msg: any) => {
    const str = format("[%s] %s", new Date().toISOString(), msg);
    console.debug(str);
    appendFile("player.log", str + "\n").catch(console.error);
};
