const Twit = require('twit')
const fetch = require('node-fetch')
const Fb = require('fb')
const download = require('image-downloader')
const fs = require('fs')
const util = require('util');

let post_id

const T = new Twit({
    consumer_key:         'Your key',
    consumer_secret:      'Your key',
    access_token:         'Your key',
    access_token_secret:  'Your key',
})

const FB = new Fb.Facebook(
    {
        version:'v2.10',
        appId: 'Your App Id', 
        appSecret: 'Your App Secret',
    }
)

FB.setAccessToken('Your Token');


async function downloadIMG(url,dest) {
    try {
      const options = {
        url: url,
        dest: dest                  
      }
      const { filename, image } = await download.image(options)
      return filename
    } catch (e) {
      throw e
    }
}

function tweetImage(imagePath, link, from) {
    try {
      var b64content = fs.readFileSync(imagePath, { encoding: 'base64' })
      T.post('media/upload', { media_data: b64content })
      .then( response => {
        var mediaIdStr = response.data.media_id_string
        var altText = "Repost From Facebook Page"
        var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

        T.post('media/metadata/create', meta_params)
        .then( () => {
            var params = { status: `Repost From ${from} :\n${link}`, media_ids: [mediaIdStr] }
            T.post('statuses/update', params)
            .then( response => console.log("Successfuly post to twitter"))
        })
      })

    } catch (error) {
        throw error
    }
}

async function getPostFromFbPage(page) {
    try {
        var response = await FB.api(`${page}/posts?limit=1`, { fields: 'full_picture,type,link' })
        var data = await response
        
        const type = data.data[0].type
        const id = data.data[0].id
        if (type === "photo" && post_id !== id) {
        post_id = id
        const image_src = data.data[0].full_picture
        const link = data.data[0].link
        const postData = { image_src : image_src, link: link, id:id}
        return postData
        } else {
          return "SKIP"
        }
        
    } catch (error) {
       throw error
    }
}
   
const fb_pages = {
    DAMTV:'DikalaAndaMenontonTelevisi',
    PRB:'PenahanRasaBerak',
    KDH:'kesegarandinihari',
}

async function tweetMemeFromFBPage(fb_pages) {
    try {
      const data = await getPostFromFbPage(fb_pages)      
      if (data === 'SKIP') {
        console.log("Skipping Post, Not a picture") 
      } else {
        const options = {
            url: data.image_src,
            dest: `${data.id}.jpg`                  
        }
    
          const { filename, image } = await download.image(options)
    
          tweetImage(filename,data.link,fb_pages)

          fs.unlink(options.dest, (err, data) => {
              console.log(data)
          })
      }
    } catch (error) {
      throw error
    }
}

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

tweetMemeFromFBPage(fb_pages.PRB)