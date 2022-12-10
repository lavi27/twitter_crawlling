import Axios from 'axios'
import fs from 'fs'

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

export default downloadImage