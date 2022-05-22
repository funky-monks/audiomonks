const MP3Cutter = require('mp3-cutter');
const fs = require('fs');
const mp3Duration = require('mp3-duration');
const listDirectory = require('./listDirectory');
const mm = require('music-metadata');

const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

const difficulties = ['hard', 'normal', 'easy']

// Create difficulty category path directories
async function createDifficultyDir(album) {
    difficulties.forEach(difficulty => {
        const dir = `./music/${album}/${difficulty}/`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    })
}

// get all files in album directory
async function listDirectoryMP3(pathOfAlbum) {
    const files = await listDirectory(pathOfAlbum, { matchWhat: "ext", match: "mp3" }).then(files => {
        return files
    })
    return files
}

// get duration in seconds minus and cut first and last 5% (song might be fading in/out)
async function getDurationObject(songMetadataDuration) {
    const songDuration = await songMetadataDuration

    const percentFade = 5
    const percentageFinalSeconds = await Math.round((songDuration / 100) * percentFade)

    const songDurationObject = await {
        startTime: percentageFinalSeconds,
        finalTime: Math.round(songDuration - percentageFinalSeconds)
    }
    return songDurationObject
}

async function cutFileMp3(source, targetFile, startTime, finalTime) {
    try {
        MP3Cutter.cut({
            src: source,
            target: targetFile + '.mp3',
            start: startTime,
            end: finalTime
        });
        // console.log(`Success cutting song from ${source}`)
    } catch (error) {
        console.log(error)
        return null
    }
}


const albumName = 'Unlimited Love'
const albumPath = `./music/${albumName}`

async function parseAudioMetadata(filePath) {
    const metadata = await mm.parseFile(filePath);
    return metadata
}

async function mainCut() {
    createDifficultyDir(albumName).then(() => {
        listDirectoryMP3(albumPath).then(files => {
            files.forEach(filepath => {
                parseAudioMetadata(filepath).then(songMetadata => {
                    const artist = songMetadata.common.artist
                    const album = songMetadata.common.album
                    const title = songMetadata.common.title
                    const duration = songMetadata.format.duration

                    getDurationObject(duration).then(songDurationObject => {
                        const startTime = songDurationObject.startTime
                        const finalTime = songDurationObject.finalTime


                        console.log(`Cutting songs for ${title} by ${artist}.`)
                        difficulties.forEach(difficulty => {
                            let durationOfDifficulty = config.hard
                            if (difficulty === 'normal') {
                                durationOfDifficulty = config.normal
                            } else if (difficulty === 'easy') {
                                durationOfDifficulty = config.easy
                            }
                            for (let index = startTime; index < finalTime; index += durationOfDifficulty) {
                                const targetPath = `${albumPath}/${difficulty}/${title}-${index.toFixed(2)}-${index + durationOfDifficulty.toFixed(2)}`
                                cutFileMp3(filepath, targetPath, index, index + durationOfDifficulty).then(() => {
                                })
                                
                            }

                        });
                    })
                })
            });
        })
    })
}

mainCut().then(() => {

})

// metadata object example:
// {
//     format: {
//       tagTypes: [ 'ID3v2.3', 'ID3v1' ],
//       trackInfo: [],
//       lossless: false,
//       container: 'MPEG',
//       codec: 'MPEG 1 Layer 3',
//       sampleRate: 44100,
//       numberOfChannels: 2,
//       bitrate: 256000,
//       codecProfile: 'CBR',
//       tool: 'LAME 3.99.5',
//       trackPeakLevel: undefined,
//       trackGain: -8.7,
//       duration: 331.52
//     },
//     native: {
//       'ID3v2.3': [
//         [Object], [Object],
//         [Object], [Object],
//         [Object], [Object],
//         [Object], [Object],
//         [Object], [Object],
//         [Object], [Object],
//         [Object]
//       ],
//       ID3v1: [ [Object], [Object], [Object], [Object], [Object], [Object] ]
//     },
//     quality: { warnings: [] },
//     common: {
//       track: { no: 16, of: null },
//       disk: { no: 1, of: null },
//       movementIndex: {},
//       album: 'Unlimited Love',
//       albumartist: 'Red Hot Chili Peppers',
//       artists: [ 'Red Hot Chili Peppers' ],
//       artist: 'Red Hot Chili Peppers',
//       bpm: 0,
//       year: 2022,
//       encodedby: 'Switch Trial Version © NCH Software',
//       encodersettings: 'Muziek 1.1.6.37',
//       genre: [ 'Rock' ],
//       title: 'The Heavy Wing',
//       picture: [ [Object] ]
//     }
//   }
