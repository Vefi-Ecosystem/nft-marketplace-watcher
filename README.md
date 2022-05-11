Vefi NFT Marketplace IPFS & API Doc
====================================


#### IPFS


For now, our IPFS is deployed at `http://20.118.216.88:7344`. This is the root URL before we get a domain. You can interact with the gateway using the following endpoints:

*Endpoint:* **`/ipfs/file`**

*Method:* **`POST`**

*Content Type:* **`multipart/form-data`**

*Parameters:* 

  - file:
      * in: **`body`**
      * type: **`file`**

*Response:*

```json
{
  "response": {
    "fileURI": "http://...", // URI for image
    "CID": "Q..." // Image identifier
  }
}
```