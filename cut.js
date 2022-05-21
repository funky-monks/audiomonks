const MP3Cutter = require('mp3-cutter');
const fs = require('fs');
const mp3Duration = require('mp3-duration');
const listDirectory = require('./listDirectory');

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
function getDuration(filePath) {
    const songDuration = mp3Duration(filePath, (err, duration) => {
        if (err) return console.log(err.message);

        const percentFade = 5
        const percentageFinalSeconds = Math.round((duration / 100) * percentFade)

        const songDurationObject = {
            startTime: percentageFinalSeconds,
            finalTime: Math.round(duration - percentageFinalSeconds)
        }
        return songDurationObject
    });
    console.log(songDuration)
}

async function cutFileMp3(source, targetFile, startTime, finalTime) {
    try {
        MP3Cutter.cut({
            src: source,
            target: targetFile,
            start: startTime,
            end: finalTime
        });
        console.log(`Success cutting song from ${source}`)
    } catch (error) {
        console.log(error)
        return null
    }
}


const albumName = 'Unlimited Love'
const albumPath = `./music/${albumName}`

createDifficultyDir(albumName).then(e => {
    listDirectoryMP3(albumPath).then(files => {
        files.forEach(filepath => {
            getDuration(filepath).then(songObject => {
                console.log(songObject)
            })
            // difficulties.forEach(difficulty => {
            //     targetPath = `./music/${difficulty}/${songDuration.startTime}-${songDuration.finalTime}`
            //     // cutFileMp3(filepath, targetPath, songDuration.startTime, songDuration.finalTime).then(e => {

            //     // })
            // });
        });
    })
})

// MP3Cutter.cut({
//     src: './music/Unlimited Love/01 Black Summer.mp3',
//     target: './music/Unlimited Love/hard/ds323d.mp3',
//     start: 121,
//     end: 122
// });

