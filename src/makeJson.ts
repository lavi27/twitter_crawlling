import fs from 'fs'

const makeJson = (fileDir: string, filename: string, mediadata: object) => {
  try {
    const json = JSON.stringify(mediadata, null, 2)
    
    if(!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir)
    }

    fs.writeFileSync(`${fileDir}/${filename}.json`, json)
  } catch(err: any) {
    throw new Error(err)
  }
}

export default makeJson