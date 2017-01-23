# findapi
findapi is a RESTful API for querying MongoDB

##Docker container deployment

Please pull the docker container. Then use the Python script to start the container, providing your MongoDB instance host and port, and the HTTP port you would like to use:

* `docker pull sbubmi/findapi`
* `git clone https://github.com/SBU-BMI/findapi.git`
* `cd findapi`
* Substitute your parameters:
* `python run_docker_findapi.py -m <mongohost> -p <mongoport> -w <webport>`


##Usage

**Parameters to findapi:**

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
