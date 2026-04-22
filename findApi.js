// findApi.js
// ========
const { MongoClient, ObjectId } = require("mongodb");
const http = require("http");

const PORT = 3000;
const DEFAULT_DB = "u24_luad";
const DEFAULT_COLLECTION = "objects";
const MAX_LIMIT = 10000;
const ALLOWED_DBS = new Set([DEFAULT_DB]);
const ALLOWED_COLLECTIONS = new Set([DEFAULT_COLLECTION]);

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;

const monhost = process.env.MONHOST;
const monport = process.env.MONPORT;

let mongoUrl = "";
if (monhost && monport) {
    mongoUrl = "mongodb://" + monhost + ":" + monport + "/";
} else {
    mongoUrl = "mongodb://172.17.0.1:27015/";
}

const requestCounts = new Map();

setInterval(function () {
    requestCounts.clear();
}, RATE_LIMIT_WINDOW_MS);

function getClientIp(request) {
    return request.socket.remoteAddress || "unknown";
}

function isRateLimited(request) {
    const ip = getClientIp(request);
    const count = requestCounts.get(ip) || 0;
    requestCounts.set(ip, count + 1);
    return count + 1 > RATE_LIMIT_MAX;
}

function sanitizeQuery(query) {
    if (query === null || query === undefined) return query;
    if (typeof query !== "object") return query;

    const sanitized = {};
    for (const key of Object.keys(query)) {
        if (key.startsWith("$")) {
            continue;
        }
        const value = query[key];
        if (typeof value === "object" && value !== null) {
            sanitized[key] = sanitizeQuery(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

function parseQueryParams(urlString) {
    if (urlString.endsWith(";")) {
        urlString = urlString.slice(0, -1);
    }

    let searchIndex = urlString.indexOf("?");
    if (searchIndex === -1) return null;

    let str = urlString.slice(searchIndex + 1);
    if (str.indexOf("&_=") > -1) {
        str = str.substring(0, str.indexOf("&_="));
    }

    const parms = {};
    str.split("&").forEach(function (pp) {
        pp = pp.split("=");
        if (parseFloat(pp[1])) {
            pp[1] = parseFloat(pp[1]);
        }
        parms[pp[0]] = pp[1];
    });

    return parms;
}

function recode(enc, parms) {
    try {
        let dec = decodeURI(enc);
        if (dec.indexOf("'") > -1) {
            dec = dec.replace(/'/g, '"');
        }
        return JSON.parse(dec);
    } catch (err) {
        parms.err = { error: err };
        return {};
    }
}

function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "null",
        "X-Content-Type-Options": "nosniff"
    });
    response.end(JSON.stringify(body));
}

async function handleRequest(request, response) {
    const urlString = request.url;

    if (urlString.indexOf("favicon.ico") !== -1) {
        response.end("");
        return;
    }

    if (isRateLimited(request)) {
        sendJson(response, 429, { error: "too many requests" });
        return;
    }

    const parms = parseQueryParams(urlString);

    if (!parms) {
        sendJson(response, 200, { required: "limit=#" });
        return;
    }

    if (!parms.limit || parms.limit === 0) {
        response.end("");
        return;
    }

    if (parms.limit > MAX_LIMIT) {
        parms.limit = MAX_LIMIT;
    }

    const dbName = parms.db || DEFAULT_DB;
    const collectionName = parms.collection || DEFAULT_COLLECTION;

    if (!ALLOWED_DBS.has(dbName)) {
        sendJson(response, 403, { error: "database not allowed" });
        return;
    }

    if (!ALLOWED_COLLECTIONS.has(collectionName)) {
        sendJson(response, 403, { error: "collection not allowed" });
        return;
    }

    const connectionUrl = mongoUrl + dbName;

    let findQuery = {};
    if (parms.find) {
        findQuery = recode(parms.find, parms);
        if (parms.err) {
            sendJson(response, 400, { error: "invalid find parameter" });
            return;
        }
        findQuery = sanitizeQuery(findQuery);
    }

    if (parms.offset) {
        const offsetValue = recode(parms.offset, parms);
        if (parms.err) {
            sendJson(response, 400, { error: "invalid offset parameter" });
            return;
        }
        if (typeof offsetValue === "string" && /^[0-9a-fA-F]{24}$/.test(offsetValue)) {
            findQuery._id = { $gt: ObjectId.createFromHexString(offsetValue) };
        }
    }

    let projectQuery = {};
    if (parms.project) {
        projectQuery = recode(parms.project, parms);
        if (parms.err) {
            sendJson(response, 400, { error: "invalid project parameter" });
            return;
        }
        projectQuery = sanitizeQuery(projectQuery);
    }

    let client;
    try {
        client = await MongoClient.connect(connectionUrl);
        const db = client.db(dbName);
        const docs = await db.collection(collectionName)
            .find(findQuery)
            .project(projectQuery)
            .limit(parms.limit)
            .toArray();
        sendJson(response, 200, docs || []);
    } catch (err) {
        sendJson(response, 500, { error: "database query failed" });
    } finally {
        if (client) {
            await client.close();
        }
    }
}

const server = http.createServer(handleRequest);
server.listen(PORT, function () {
    console.log("listening on port " + PORT);
});
