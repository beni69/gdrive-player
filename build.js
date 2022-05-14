// vlc-static uses import.meta but i need commonjs modules
const importMeta = {
    name: "import.meta.url",
    setup({ onLoad }) {
        let fs = require("fs");
        let url = require("url");
        onLoad({ filter: /()/, namespace: "file" }, args => {
            let code = fs.readFileSync(args.path, "utf8");
            code = code.replace(
                /\bimport\.meta\b/g,
                JSON.stringify({ url: url.pathToFileURL(args.path) })
            );
            return { contents: code, loader: "default" };
        });
    },
};

require("esbuild")
    .build({
        entryPoints: ["./src/index.ts"],
        platform: "node",
        target: "es2018",
        external: ["internal-ip"],
        format: "cjs",
        bundle: true,
        minify: true,
        plugins: [importMeta],
        outfile: "./dist/bundle.cjs",
    })
    .catch(e => console.error(e) || process.exit(1));
