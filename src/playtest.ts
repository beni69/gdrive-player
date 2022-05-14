async function main() {
    const { playAudioFile } = await import("audic");

    playAudioFile("data/test.mp3");
}
main();
