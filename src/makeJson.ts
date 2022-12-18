import fs from 'fs'

export const makeJson = (fileDir: string, filename: string, mediadata: object) => {
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