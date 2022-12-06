import fs from 'fs'
import { TwitterApi } from 'twitter-api-v2'
import moment from 'moment'
import { Bearer_token } from '../config.json'
import Axios from 'axios'

interface Tweets {
  url: any;
  name: any;
  username: any;
  id: any;
  medias: any
}

const twitterClient = new TwitterApi(Bearer_token)
const client = twitterClient.readOnly

let userid: string
userid = '1491856273582673926'

const getLikedTweetsDatas = async (userid: string) => {
  let tweets: Tweets[] = []
  let next_token: string|null = null

  for(let i=0; i < 20; i++) {
    const result: any = await getLikedTweetsData(userid, next_token)
    tweets = tweets.concat(result.tweets)
    next_token = result.next_token
  }

  return tweets
}

const getLikedTweetsData = async (userid: string, next_token: string|null) => {
  try {
    const url = `users/${userid}/liked_tweets`

    const options: any = {
      max_results: 100,
      "expansions": "attachments.media_keys,author_id",
      "media.fields": "url,media_key"
    }
    if(next_token) {
      options.pagination_token = next_token
    }

    const response = await client.v2.get(url, options);

    const data = response.data
    const meta = response.meta
    const includes_media = response.includes.media
    const includes_users = response.includes.users

    const tweets: Tweets[] = []

    data.forEach((data: any) => {
      const user = includes_users.find((user: { id: string }) => user.id == data.author_id)
      const url = data.text.split(' ').slice(-1)[0]
      const medias: any = []

      if(data.attachments) {
        data.attachments.media_keys.forEach((media_key: string) => {
          const media = includes_media.find((media: { media_key: string }) => media.media_key == media_key)
          medias.push(media.url)
        })
      }

      tweets.push({url, name: user.name, username: user.username, id: data.id, medias})
    })

    return { tweets, next_token: meta.next_token };

    //[이미지 하나]
    // 포함될 정보: 글 url, 유저 닉네임(@유저 고닉) x, 트위터 로고
    // 이름: 글 url x
  } catch(err) {
    console.error(err)
    process.exit(1)
  }
}

const makeJson = (fileDir: string, filename: string, mediadata: object) => {
  try {
    const json = JSON.stringify(mediadata, null, 2)
    
    if(!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir)
    }

    fs.writeFileSync(`${fileDir}/${filename}.json`, json)
  } catch(err) {
    console.error(err)
    process.exit(1)
  }
}

const downloadImage = async (url: string, fileDir: string, filename: string) => {
  try {
    const filenameExtension = url.split('.').slice(-1)[0];
    const path = `${fileDir}/${filename}.${filenameExtension}`;

    const response = await Axios.get(url, { responseType: 'stream' });

    if(!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir)
    }

    await response.data.pipe(fs.createWriteStream(path))
    return path
  } catch(err) {
    console.error(err)
    process.exit(1)
  }
}

const app = async () => {
  const likedTweetsData = await getLikedTweetsDatas(userid)
  const timestamp = Date.now()
  const fileDir = `./out/${userid}_${timestamp}`

  makeJson(fileDir, 'info', likedTweetsData)

  likedTweetsData.forEach((tweet: Tweets, dataIndex:number) => {
    if(tweet.medias.length < 1) {
      return
    }

    tweet.medias.forEach((mediaUrl: string, mediaIndex: number) => {
      if(!mediaUrl) {
        return
      }

      downloadImage(mediaUrl, fileDir, `${dataIndex+1}_${mediaIndex+1}`)
    })
  });

  console.log("Success!")
  process.exit(0)
}

app();