import { TwitterApi } from 'twitter-api-v2'
import { Bearer_token } from '../config.json'

import { Tweets } from './interfaces'

const twitterClient = new TwitterApi(Bearer_token)
const client = twitterClient.readOnly

export const getLikedTweetsDatas = async (userid: string) => {
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