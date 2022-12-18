import cliProgress from 'cli-progress'

import { getLikedTweetsDatas } from './getLikedTweets'
import { convertMsToTime } from './convertMsToTime'
import { downloadImage } from './downloadImage'
import { makeJson } from './makeJson'
import { wait } from './wait'

import { Tweets } from './interfaces'

const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

let userid: string
// userid = '1491856273582673926'
userid = '1533011206448918530'
// userid = '1485290985353408519'

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
  process.exit(0)
}

app()