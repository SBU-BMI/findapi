## findapi

###RESTful API for querying MongoDB

**Parameters:**

* collection
* db
* find
* limit
* mongoUrl
* project

`find` and `project` must be **valid mongo syntax**, contained inside `{}`

You MUST put a `limit=`. It is sufficient to say `limit=1`.

You can pass mongoUrl like this: `http://[yourhost:yourport]/?limit=1&mongoUrl=mongodb://[mongohost:mongoport]`

**Example (mongoUrl, db, collection, find, project):**
`http://localhost:3000/?limit=1&mongoUrl=mongodb://127.0.0.1:27017&db=u24_luad&collection=objects&find={"object_type":"nucleus"}&project={"geometry":1}`

**Note:** It's a URL; do not include spaces in the find parameter.

