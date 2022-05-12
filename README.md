Vefi NFT Marketplace IPFS & API Doc
====================================


## Models

These models should give an overview of responses to expect in API calls.

**NFT**

```json
{
  "tokenId": 1, // NFT ID
  "collectionId": "0x...", // Collection that this NFT belongs to
  "network": "smartchain", // Network this NFT was minted on
  "timeStamp": 1245555689, // Timestamp this NFT was minted on. Note that to get an accurate date representation, you must multiply by 1000
  "owner": "0x", // Owner of this NFT
  "metadata": {
    "name": "Crypto Boys",
    ...
  } //Metadata pinned to IPFS server
}
```


#### IPFS


For now, our IPFS is deployed at `http://20.118.216.88:7344`. This is the root URL before we get a domain. You can interact with the gateway using the following endpoints:

*Endpoint:* **`/ipfs/file`**

*Method:* **`POST`**

*Content Type:* **`multipart/form-data`**

*Description:* Pin a file to IPFS server

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


*Endpoint:* **`/ipfs/json`**

*Method:* **`POST`**

*Content Type:* **`application/json`**

*Description:* Pin JSON metadata.

*Parameters:* Any JSON body is accepted. Use this endpoint to store metadata for collections/NFTs.

*Response:*

```json
{
  "response": {
    "itemURI": "http://...", // URI for item
    "CID": "Q..." // Item identifier
  }
}
```




#### API

The API for now, is deployed at `http://20.118.216.88:6008/`. Interact with the API using the following endpoints:


*Endpoint:* **`/api/account`**

*Method:* **`POST`**

*Content-Type:* **`application/json`**

*Parameters:*

  - accountId
    * in: `body`
    * type: `string`
    * description: `Address of account owner`
    * required: `true`
  - name
    * in: `body`
    * type: `string`
    * description: `Name of account owner`
    * required: `true`
  - email
    * in: `body`
    * type: `string`
    * description: `Email of account owner`
    * required: `true`
  - imageURI
    * in: `body`
    * type: `string`
    * description: `Image of account owner`
    * required: `false`
  
*Response:*

```json
{
  "result": {
    // User's info
    "token": "5..." // Json web token
  }
}
```


*Endpoint:* **`/api/account`**

*Method:* **`GET`**

*Description:* Retrieve account from request.

*Parameters:* 

  - Authorization
    * in: `header`
    * type: `string`
    * description: `Bearer token`
    * required: `true`

*Response:*

```json
{
  "result": {
    // Decoded user's info
  }
}
```


*Endpoint:* **`/api/collection/:network/all`**

*Method:* **`GET`**

*Description:* Fetch all collections by network. `:network` is path placeholder for network slug.

*Parameters:*

  - network
    * in: `path`
    * type: `string`
    * description: `Network slug`
    * required: `true`


*Endpoint:* **`/api/collection/:network/:collectionId/byNetwork`**

*Method:* **`GET`**

*Description:* Fetch by ID & network. `:collectionId` is path placeholder for collection ID.

*Parameters:*

  - network
    * in: `path`
    * type: `string`
    * description: `Network slug`
    * required: `true`

  - collectionId
    * in: `path`
    * type: `string`
    * description: `Contract address for collection`
    * required: `true`


*Endpoint:* **`/api/collection/:network/byOwner`**

*Method:* **`GET`**

*Description:* Fetch all collections by owner and network.

*Parameters:*

  - network
    * in: `path`
    * type: `string`
    * description: `Network slug`
    * required: `true`

  - Authorization
    * in: `header`
    * type: `string`
    * description: `Bearer token`
    * required: `true`


*Endpoint:* **`/api/nft/:network/byNetwork`**

*Method:* **`GET`**

*Description:* Fetch all NFTs by network.

*Parameters:*

  - network
    * in: `path`
    * type: `string`
    * description: `Network slug`
    * required: `true`


*Endpoint:* **`/api/nft/:network/:tokenId/byId`**

*Method:* **`GET`**

*Description:* Fetch an NFT using its ID & network.

*Parameters:*

  - network
    * in: `path`
    * type: `string`
    * description: `Network slug`
    * required: `true`

  - tokenId
    * in: path
    * type: `number`
    * description: `ID of NFT`
    * required: `true`


*Endpoint:* **`/api/nft/:network/:collectionId/byCollection`**

*Method:* **`GET`**

*Description:* Fetch all NFTs within a collection.

*Parameters:*

  - network
    * in: `path`
    * type: `string`
    * description: `Network slug`
    * required: `true`

  - collectionId
    * in: path
    * type: `string`
    * description: `ID of NFT`
    * required: `true`


*Endpoint:* **`/api/nft/:network/byOwner`**

*Method:* **`GET`**

*Description:* Fetch all NFTs by owner.

*Parameters:*

  - network
    * in: `path`
    * type: `string`
    * description: `Network slug`
    * required: `true`

  - Authorization
    * in: `header`
    * type: `string`
    * description: `Bearer token`
    * required: `true`


*Endpoint:* **`/api/order/:network/:tokenId/byNFT`**

*Method:* **`GET`**

*Description:* Fetch all orders by NFT

*Parameters:*

  - network
    * in: `path`
    * type: `string`
    * description: `Network slug`
    * required: `true`

  - tokenId
    * in: `path`
    * type: `number`
    * description: `Bearer token`
    * required: `true`


*Endpoint:* **`/api/order/:network/countAll`**

*Method:* **`GET`**

*Description:* Count all orders per network.

*Parameters:*
  
- network
    * in: `path`
    * type: `string`
    * description: `Network slug`
    * required: `true`


*Endpoint:* **`/api/order/:network/:tokenId/byNFT`**

*Method:* **`GET`**

*Description:* Fetch all orders by NFT

*Parameters:*

  - network
    * in: `path`
    * type: `string`
    * description: `Network slug`
    * required: `true`

  - tokenId
    * in: `path`
    * type: `number`
    * description: `Bearer token`
    * required: `true`


*Endpoint:* **`/api/order/:network/:collection/countAllByCollection`**

*Method:* **`GET`**

*Description:* Count all orders per collection.

*Parameters:*
  
- network
    * in: `path`
    * type: `string`
    * description: `Network slug`
    * required: `true`


*Endpoint:* **`/api/push/subscribe`**

*Method:* **`POST`**

*Content Type:* `application/json`

*Description:* Subscribe for push notification.

*Parameters:* 
- Authorization
  * in: `header`
  * type: `string`
  * description: `Bearer token`
  * required: `true`
- endpoint
  * in: `body`
  * type: `string`
  * description: `Push endpoint from front-end push registration`
  * required: `true`

- keys
  * in: `body`
  * type: `object`
  * description: `Keys obtained during front-end push registration`


*Endpoint:* **`/api/push/unsubscribe`**

*Method:* **`DELETE`**

*Description:* Cancels a push subscription

*Parameters:* 
- Authorization
  * in: `header`
  * type: `string`
  * description: `Bearer token`
  * required: `true`


*Endpoint:* **`/api/sale/:network/allOngoing`**

*Method:* **`GET`**

*Description:* Gets all on-going sales by network.

*Parameters:* 
  - network
    * in: `path`
    * type: `string`
    * description: `Bearer token`
    * required: `true`


*Endpoint:* **`/api/sale/:network/:collectionId/ongoing/byCollection`**

*Method:* **`GET`**

*Description:* Get all on-going sales by network and collection ID.

*Parameters:* 
  - network
    * in: `path`
    * type: `string`
    * description: `Bearer token`
    * required: `true`
  - collectionId
    * in: `path`
    * type: `string`
    * description: `Bearer token`
    * required: `true`