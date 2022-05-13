import { readFile, writeFile } from "fs/promises";
import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { drive_v3, google } from "googleapis";
import readline from "readline";

type Client = GoogleAuth | OAuth2Client;

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json",
    OAUTH_CREDENTIALS_PATH = "oauth.json",
    SERVICE_ACC_PATH = "svcacc.json";

export const getSvcAccClient = (): Client => {
    const auth = new GoogleAuth({ keyFile: SERVICE_ACC_PATH, scopes: SCOPES });
    return auth;
};

export const getOAuthClient = async (interactive = true): Promise<Client> => {
    const credentials = JSON.parse(
        (await readFile(OAUTH_CREDENTIALS_PATH)).toString()
    );
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    // Check if we have previously stored a token.
    try {
        const token = JSON.parse((await readFile(TOKEN_PATH)).toString());
        oAuth2Client.setCredentials(token);
        return oAuth2Client;
    } catch (e) {
        if (interactive) return getAccessToken(oAuth2Client);
        else throw "No token found";
    }
};

const getAccessToken = (oAuth2Client: OAuth2Client) =>
    new Promise<OAuth2Client>((res, rej) => {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES,
        });
        console.log("Authorize this app by visiting this url:", authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question("Enter the code from that page here: ", code => {
            rl.close();
            oAuth2Client.getToken(code, async (err, token) => {
                if (err) throw `Error retrieving access token: ${err}`;
                oAuth2Client.setCredentials(token!);
                writeFile(TOKEN_PATH, JSON.stringify(token))
                    .then(_ => console.log("Token stored to", TOKEN_PATH))
                    .catch(err => {
                        throw err;
                    });
                res(oAuth2Client);
            });
        });
    });

export const listFiles = (auth: Client) => {
    const drive = google.drive({ version: "v3", auth });
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

export const listAudio = (auth: Client) =>
    new Promise<drive_v3.Schema$File[]>((res, rej) => {
        google
            .drive({ version: "v3", auth })
            .files.list({ q: "mimeType='audio/mpeg'" }, (err, data) => {
                if (err || !data) rej(err);
                else res(data.data.files || []);
            });
    });

export const getFile = (auth: Client, p: drive_v3.Params$Resource$Files$Get) =>
    google.drive({ version: "v3", auth }).files.get(p);

export const downloadFile = async (
    auth: Client,
    p: drive_v3.Params$Resource$Files$Get
) => {
    const drive = google.drive({ version: "v2", auth });
    const f = await drive.files.get(
        {
            alt: "media",
            ...p,
        },
        { responseType: "stream" }
    );
    return f.data;
};
