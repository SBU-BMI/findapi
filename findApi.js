// findApi.js
// ========
const mongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const url = require("url");

const PORT = 3000;
const DEFAULT_DB = "u24_luad";
const DEFAULT_COLLECTION = "objects";
const MAX_LIMIT = 10000;
const ALLOWED_DBS = new Set([DEFAULT_DB]);
const ALLOWED_COLLECTIONS = new Set([DEFAULT_COLLECTION]);

const http = require("http");

const monhost = process.env.MONHOST;
const monport = process.env.MONPORT;

let mongoUrl = "";

if (monhost && monport) {
    mongoUrl = "mongodb://" + monhost + ":" + monport + "/";
} else {
    mongoUrl = "mongodb://172.17.0.1:27015/";
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

    const urlObject = url.parse(urlString);
    if (!urlObject.search) return null;

    let str = urlObject.search.slice(1);
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

function handleRequest(request, response) {
    const urlString = request.url;

    if (urlString.indexOf("favicon.ico") !== -1) {
        response.end("");
        return;
    }

    const parms = parseQueryParams(urlString);

    if (!parms) {
        response.end(JSON.stringify({"required": "limit=#"}));
        return;
    }

    if (!parms.limit) {
        response.end("");
        return;
    }

    if (parms.limit === 0) {
        response.end("");
        return;
    }

    if (parms.limit > MAX_LIMIT) {
        parms.limit = MAX_LIMIT;
    }

    const dbName = parms.db || DEFAULT_DB;
    const collectionName = parms.collection || DEFAULT_COLLECTION;

    if (!ALLOWED_DBS.has(dbName)) {
        response.writeHead(403, {"Content-Type": "application/json"});
        response.end(JSON.stringify({"error": "database not allowed"}));
        return;
    }

    if (!ALLOWED_COLLECTIONS.has(collectionName)) {
        response.writeHead(403, {"Content-Type": "application/json"});
        response.end(JSON.stringify({"error": "collection not allowed"}));
        return;
    }

    // User cannot control the MongoDB connection URL
    const connectionUrl = mongoUrl + dbName;

    let findQuery = {};
    if (parms.find) {
        findQuery = recode(parms.find, parms);
        if (parms.err) {
            response.writeHead(400, {"Content-Type": "application/json"});
            response.end(JSON.stringify({"error": "invalid find parameter"}));
            return;
        }
        findQuery = sanitizeQuery(findQuery);
    }

    if (parms.offset) {
        const offsetValue = recode(parms.offset, parms);
        if (parms.err) {
            response.writeHead(400, {"Content-Type": "application/json"});
            response.end(JSON.stringify({"error": "invalid offset parameter"}));
            return;
        }
        if (typeof offsetValue === "string" && /^[0-9a-fA-F]{24}$/.test(offsetValue)) {
            findQuery._id = {"$gt": new ObjectID.createFromHexString(offsetValue)};
        }
    }

    let projectQuery = {};
    if (parms.project) {
        projectQuery = recode(parms.project, parms);
        if (parms.err) {
            response.writeHead(400, {"Content-Type": "application/json"});
            response.end(JSON.stringify({"error": "invalid project parameter"}));
            return;
        }
        projectQuery = sanitizeQuery(projectQuery);
    }

    response.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "null",
        "X-Content-Type-Options": "nosniff"
    });

    mongoClient.connect(connectionUrl, function (err, db) {
        if (err) {
            response.end(JSON.stringify({"error": "database connection failed"}));
            return;
        }

        db.collection(collectionName).find(findQuery, projectQuery, {
            limit: parms.limit
        }).toArray(function (err1, docs) {
            db.close();
            if (err1) {
                response.end(JSON.stringify({}));
                return;
            }
            response.end(JSON.stringify(docs || {}));
        });
    });
}

function recode(enc, parms) {
    try {
        let dec = decodeURI(enc);
        if (dec.indexOf("'") > -1) {
            dec = dec.replace(/'/g, '"');
        }
        return JSON.parse(dec);
    } catch (err) {
        parms.err = {error: err};
        return {};
    }
}

const server = http.createServer(handleRequest);
server.listen(PORT, function () {
    console.log("listening on port " + PORT);
});
