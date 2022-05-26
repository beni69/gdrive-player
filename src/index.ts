// @ts-expect-error fork, incorrect type-defs
// https://github.com/TooTallNate/node-lame/issues/92
import { Decoder } from "@suldashi/lame";
import { extname } from "node:path";
import Speaker from "speaker";
import { downloadFile, listAudio, renameFile } from "./gdrive";
import log from "./log";
// import "./playtest"; // for debugging purposes

log("starting");

// run now
main();

// run once every hour
setInterval(main, 1000 * 60 * 60);

const DATA: Map<string, Date> = new Map();

interface Item {
    id: string;
    timestamp: Date;
    name: string;
    state: State;
}
enum State {
    NONE,
    INVALID,
    LOADED,
    PLAYING,
    FINISHED,
}
const updateState = (item: Item, state: State) => {
    log(`${item.id}: ${State[item.state]} -> ${State[state]}`);
    item.state = state;
    renameFile(item.id, `[${State[state]}] ${item.name}`);
};

const validTimestamp = (ts: string | null | undefined): ts is string =>
    new Date(ts || "").getTime() > new Date().getTime();

async function main() {
    let files = await listAudio();

    for (const f of files) {
        let name = f.name
            ?.replace(/\[.*\]/, "")
            .replace(extname(f.name), "")
            .trim();

        if (!validTimestamp(name)) {
            updateState(
                { id: f.id!, name: name!, state: State.NONE } as Item,
                State.INVALID
            );
            continue;
        }

        const item: Item = {
            id: f.id!,
            timestamp: new Date(name),
            name: name,
            state: State.NONE,
        };

        if (DATA.has(item.id)) {
            const old = DATA.get(item.id);
            if (old && old.getTime() === item.timestamp.getTime()) {
                log(`${item.id} is up to date`);
                continue;
            }
            log(`${item.id} is outdated: ${old} -> ${item.timestamp}`);
        }
        updateState(item, State.LOADED);
        DATA.set(item.id, item.timestamp);

        const remaining = item.timestamp.getTime() - new Date().getTime();
        setTimeout(async () => {
            updateState(item, State.PLAYING);

            (await downloadFile({ fileId: item.id }))
                .pipe(new Decoder())
                .on("format", () => log)
                .pipe(
                    new Speaker().on("finish", () => {
                        updateState(item, State.FINISHED);
                    })
                );
        }, remaining);
        log(`${f.name} - ${remaining}ms`);
    }

    log(DATA);
}
