const start = Date.now();
require("esbuild")
    .build({
        entryPoints: ["./src/index.ts"],
        platform: "node",
        target: "es2018",
        external: ["speaker", "@suldashi/lame"],
        format: "cjs",
        bundle: true,
        minify: true,
        outfile: "./dist/bundle.cjs",
    })
    .catch(e => console.error(e) || process.exit(1))
    .then(() => console.log(`Done in ${Date.now() - start}ms`));
