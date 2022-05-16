// @ts-expect-error see index.ts
import { Decoder } from "@suldashi/lame";
import { createReadStream } from "fs";
import { resolve } from "node:path";
import Speaker from "speaker";

const audio = resolve(process.env.TEST_AUDIO ?? "data/test.mp3");
console.log(`playing: ${audio}`);

createReadStream(audio)
    .pipe(new Decoder())
    .on("format", () => console.log)
    .pipe(new Speaker());
