// @ts-expect-error fork, incorrect type-defs
// https://github.com/TooTallNate/node-lame/issues/92
import { Decoder } from "@suldashi/lame";
import { extname } from "node:path";
import Speaker from "speaker";
import { downloadFile, listAudio } from "./gdrive";
// import "./playtest"; // for debugging purposes

const DATA: Map<string, Date> = new Map();

interface Item {
    id: string;
    timestamp: Date;
}

// run now
main();

// run once every hour
setInterval(main, 1000 * 60 * 60);

const validTimestamp = (ts: string | null | undefined): ts is string =>
    new Date(ts || "").getTime() > new Date().getTime();

async function main() {
    let files = await listAudio();
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
        };
        if (DATA.has(item.id)) {
            const old = DATA.get(item.id);
            if (old && old.getTime() === item.timestamp.getTime()) {
                console.debug(`${item.id} is up to date`);
                continue;
            }
            console.debug(
                `${item.id} is outdated: ${old} -> ${item.timestamp}`
            );
        }

        DATA.set(item.id, item.timestamp);

        const remaining = item.timestamp.getTime() - new Date().getTime();
        setTimeout(async () => {
            console.info(`Playing ${item.id}`);

            (await downloadFile({ fileId: item.id }))
                .pipe(new Decoder())
                .on("format", () => console.log)
                .pipe(
                    new Speaker().on("finish", () =>
                        console.info(`Finished ${item.id}`)
                    )
                );
        }, remaining);
        console.log(`${f.name} - ${remaining}ms`);
    }

    console.debug(DATA);
}
