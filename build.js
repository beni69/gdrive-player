// vlc-static uses import.meta but i need commonjs modules
const importMeta = {
    name: "createEsmUtils(import.meta)",
    setup({ onLoad }) {
        let fs = require("fs");
        const { dirname, join } = require("path");
        onLoad(
            { filter: /vlc-static(\/|\\)index\.js$/, namespace: "file" },
            args => {
                let code = fs.readFileSync(args.path, "utf8");
                const x = JSON.stringify({
                    dirname: join(
                        "..",
                        dirname(args.path).replace(__dirname, ".")
                    ),
                });
                console.log(x, args.path);
                code = code.replace(
                    /createEsmUtils\(import\.meta\)/g,
                    `{dirname: require("path").join(__dirname,${JSON.stringify(
                        join("..", dirname(args.path).replace(__dirname, "."))
                    )})}`
                );
                return { contents: code, loader: "default" };
            }
        );
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
        // minify: true,
        plugins: [importMeta],
        outfile: "./dist/bundle.cjs",
    })
    .catch(e => console.error(e) || process.exit(1));

// node_modules\.pnpm\vlc-static@2.0.0\node_modules\vlc-static\index.js
