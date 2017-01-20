## findapi

###RESTful API FOR SEARCHING MongoDB

**Parameters:**

* collection
* db
* find
* limit
* mongoUrl
* project

`find` and `project` must be **valid mongo syntax**, contained inside `{}`

You MUST put a `limit=`. It is sufficient to say `limit=1`.

**Example:** [http://your.domain.com:3000/?limit=1&find={"object_type":"nucleus"}](http://your.domain.com:3000/?limit=1&find={"object_type":"nucleus"})

**Longer Example<br>(using most of the parameters, and subject to the data existing in the database at a given point in time):**<br>[http://your.domain.com:3000/?limit=1&find={"provenance.analysis.execution_id":"luad:bg:20160520","provenance.image.case_id":"TCGA-05-4245-01Z-00-DX1"}&db=u24_luad&collection=objects&project={"geometry":1}](http://your.domain.com:3000/?limit=1&find={"provenance.analysis.execution_id":"luad:bg:20160520","provenance.image.case_id":"TCGA-05-4245-01Z-00-DX1"}&db=u24_luad&collection=objects&project={"geometry":1})



**Note:** It's a URL; do not include spaces in the find parameter.

