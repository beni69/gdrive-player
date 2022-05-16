import { resolve } from "node:path";

import("audic").then(audic => {
    const audio = process.env.TEST_AUDIO ?? "data/test.mp3";
    console.log(`playing: ${resolve(audio)}`);
    audic.playAudioFile(audio);
});
