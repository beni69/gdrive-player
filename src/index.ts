import Audic from "audic";
import { createWriteStream, mkdirSync, statSync } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { downloadFile, getSvcAccClient, listAudio } from "./gdrive.js";

const DATA_DIR = "data",
    DATA: Map<string, Item> = new Map();

interface Item {
    id: string;
    timestamp: Date;
    path: string;
}

const auth = getSvcAccClient();

// create data directory if it doesn't exist
try {
    statSync(DATA_DIR);
} catch (e) {
    mkdirSync(DATA_DIR);
}

// run now
main();

// run once every hour
setInterval(main, 1000 * 60 * 60);

const exists = async (p: string) => {
    try {
        await stat(p);
        return true;
    } catch (e) {
        return false;
    }
};

const validTimestamp = (ts: string | null | undefined): ts is string =>
    new Date(ts || "").getTime() > new Date().getTime();

async function main() {
    let files = await listAudio(auth);
    console.debug(files);

    for (const f of files) {
        let name = f.name?.replace(extname(f.name), "");
        if (!validTimestamp(name)) {
            console.warn(`${name} is not valid timestamp - skipping`);
            continue;
        }
        const item: Item = {
            id: f.id!,
            timestamp: new Date(name),
            path: join(DATA_DIR, f.id! + ".mp3"),
        };
        DATA.set(item.id!, item);

        (await exists(item.path)) ||
            (await downloadFile(auth, { fileId: item.id })).pipe(
                createWriteStream(item.path)
            );

        const remaining = item.timestamp.getTime() - new Date().getTime();
        setTimeout(async () => {
            console.info(`Playing ${item.path}`);

            const a = new Audic(item.path);
            a.loop = false;
            a.play();

            a.addEventListener("ended", () => {
                a.destroy();
                console.info(`Finished ${item.path}`);
            });
        }, remaining);
        console.log(`${f.name} - ${remaining}ms`);
    }

    console.debug(DATA);
}
