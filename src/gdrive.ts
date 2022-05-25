import { auth, drive as _drive, drive_v3 } from "@googleapis/drive";

const SERVICE_ACC_PATH = "svcacc.json",
    SCOPES = ["https://www.googleapis.com/auth/drive.readonly"],
    login = () =>
        new auth.GoogleAuth({
            keyFile: SERVICE_ACC_PATH,
            scopes: SCOPES,
        });

const drive = _drive({ version: "v3", auth: login() });

export const listFiles = () => {
    drive.files.list(
        {
            pageSize: 10,
            fields: "nextPageToken, files(id, name, mimeType)",
        },
        (err, res) => {
            if (err || !res)
                return console.log("The API returned an error: " + err);
            const files = res.data.files;
            if (files?.length) {
                console.log("Files:");
                files.map(file => {
                    // console.log(`${file.name} (${file.id})`);
                    console.log(file);
                });
            } else {
                console.log("No files found.");
            }
        }
    );
};

export const getSharedFolder = () =>
    drive.files
        .list({
            q: "sharedWithMe=true and mimeType='application/vnd.google-apps.folder'",
        })
        .then(x => x.data.files?.[0]);

const FOLDER: Promise<string> = process.env["GDRIVE_FOLDER"]
    ? Promise.resolve(process.env["GDRIVE_FOLDER"])
    : getSharedFolder().then(f => f?.id ?? "");

export const listAudio = () =>
    FOLDER.then(f =>
        drive.files.list({
            q: `mimeType='audio/mpeg' and '${f}' in parents`,
        })
    ).then(x => x.data.files || Promise.reject());

export const getFile = (p: drive_v3.Params$Resource$Files$Get) =>
    drive.files.get(p);

export const downloadFile = async (p: drive_v3.Params$Resource$Files$Get) => {
    const f = await drive.files.get(
        {
            alt: "media",
            ...p,
        },
        { responseType: "stream" }
    );
    return f.data;
};
