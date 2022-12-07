import fs from 'fs'
import { TwitterApi } from 'twitter-api-v2'
import moment from 'moment'
import { Bearer_token } from '../config.json'
import Axios from 'axios'
import cliProgress from 'cli-progress'
// import { getLikedTweetsDatas } from '../sdfg/getLikedTweets'

interface Tweets {
  url: any;
  name: any;
  username: any;
  id: any;
  medias: any
}

const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const twitterClient = new TwitterApi(Bearer_token)
const client = twitterClient.readOnly

let userid: string
// userid = '1491856273582673926'
userid = '1533011206448918530'

const getLikedTweetsDatas = async (userid: string) => {
  console.log('Get liked tweets.')
  let tweets: Tweets[] = []
  let next_token: string|null = null


  while (true) {
    const result: any = await getLikedTweetsData(userid, next_token)

    if(result.end) {
      return tweets
    }

    tweets = tweets.concat(result.tweets)
    next_token = result.next_token
  }

  // for(let i=0; i < 5; i++) {
  //   const result: any = await getLikedTweetsData(userid, next_token)

  //   if(result.end) {
  //     console.log('done.')
  //     return tweets
  //   }

  //   tweets = tweets.concat(result.tweets)
  //   next_token = result.next_token
  // }

  // console.log('done.')
  // return tweets
}

const getLikedTweetsData = async (userid: string, next_token: string|null) => {
  try {
    const options: any = {
      max_results: 100,
      "expansions": "attachments.media_keys,author_id",
      "media.fields": "url,media_key"
    }
    if(next_token) {
      options.pagination_token = next_token
    }

    const response = await client.v2.get(`users/${userid}/liked_tweets`, options);

    const data = response.data
    const meta = response.meta

    if (meta.result_count == 0) {
      return { end: true }
    }

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

    return { tweets, next_token: meta.next_token, end: false };
  } catch(err: any) {
    throw new Error(err)
  }
}

const makeJson = (fileDir: string, filename: string, mediadata: object) => {
  console.log('Making json file.')
  try {
    const json = JSON.stringify(mediadata, null, 2)
    
    if(!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir)
    }

    fs.writeFileSync(`${fileDir}/${filename}.json`, json)
    console.log('done.')
  } catch(err: any) {
    throw new Error(err)
  }
}

const downloadImage = async (url: string, fileDir: string, filename: string) => {
  try {
    const filenameExtension = url.split('.').slice(-1)[0];
    const path = `${fileDir}/${filename}.${filenameExtension}`;

    const response = await Axios.get(url, { responseType: 'stream' })

    if(!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir)
    }

    await response.data.pipe(fs.createWriteStream(path))
    return path
  } catch(err: any) {
    throw new Error(err)
  }
}

const convertMsToTime = (ms: number) => {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;
  hours = hours % 24;

  let result: string = '';

  if(hours) {
    result += `${hours}h `;
  }
  if(minutes) {
    result += `${minutes}m `;
  }
  if(seconds) {
    result += `${seconds}s`;
  }
  
  return result;
}

const wait = (timeout: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null);
    }, timeout);
  });
}

const app = async () => {
  const time_start = Date.now()
  const likedTweetsData = await getLikedTweetsDatas(userid)
  const fileDir = `./out/${userid}_${time_start}`

  makeJson(fileDir, 'info', likedTweetsData)

  console.log('Downloading image files.')
  bar1.start(likedTweetsData.length, 0);
  likedTweetsData.forEach((tweet: Tweets, dataIndex:number) => {
    bar1.increment();
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
  bar1.stop();
  console.log('Done.')

  const elapsedMSec = new Date().getTime() - time_start;
  console.log(`\nSuccess! (${convertMsToTime(elapsedMSec)})`)
}

app()