// import { drive_v3, google } from "googleapis";
import { drive_v3, auth, drive as _drive } from "@googleapis/drive";

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

export const listAudio = () =>
    new Promise<drive_v3.Schema$File[]>((res, rej) => {
        drive.files.list({ q: "mimeType='audio/mpeg'" }, (err, data) => {
            if (err || !data) rej(err);
            else res(data.data.files || []);
        });
    });

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
