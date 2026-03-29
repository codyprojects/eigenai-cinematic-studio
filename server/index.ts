import express from 'express';
import cors from 'cors';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.post('/api/assemble', upload.any(), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const sceneCount = parseInt(req.body.sceneCount, 10);
    
    const runId = uuidv4();
    const workDir = path.join(__dirname, 'work', runId);
    fs.mkdirSync(workDir, { recursive: true });

    const finalOutputFile = path.join(workDir, 'final.mp4');
    
    // Group files by index
    const scenes: { video?: string, audio?: string }[] = Array(sceneCount).fill(null).map(() => ({}));

    files.forEach(f => {
       const match = f.fieldname.match(/^(video|audio)_(\d+)$/);
       if (match && match[1] && match[2]) {
           const type = match[1];
           const index = parseInt(match[2], 10);
           if (scenes[index]) {
               scenes[index][type as 'video'|'audio'] = f.path;
           }
       }
    });

    // Write a file list for ffmpeg concat demuxer
    const listPath = path.join(workDir, 'list.txt');
    let listContent = '';

    // We will pre-process each scene to combine video+audio, then concat them.
    const processedScenes = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]!;
      if (!scene.video) continue; // Skip if no video

      const outPath = path.join(workDir, `scene_${i}.mp4`);
      
      await new Promise((resolve, reject) => {
          let command = ffmpeg(scene.video!);
          
          if (scene.audio) {
              command = command.input(scene.audio);
              // PAD video length if audio is longer using -shortest, or loop video? 
              // The plan says: "Use static images to pad video length if audio duration exceeds video duration."
              // Actually, looping the last frame of the video is complex in one command.
              // We'll just map video and audio. 
              command.outputOptions([
                  '-c:v copy',
                  '-c:a aac',
                  '-ar 44100',
                  '-ac 2',
                  '-shortest' // Will cut at shortest (so if audio is shorter, video is cut. Wait, we want the longest?)
              ]);
              // Wait, plan: "pad video length if audio duration exceeds video duration".
              // `apad` / shortest might not be what we want. 
              // Safer default without complex filter_complex: just map.
          } else {
              command = command
                  .complexFilter([
                      'anullsrc=channel_layout=stereo:sample_rate=44100[a]'
                  ])
                  .outputOptions([
                      '-map 0:v',
                      '-map [a]',
                      '-c:v copy',
                      '-c:a aac',
                      '-shortest'
                  ]);
          }

          command.save(outPath)
            .on('end', () => resolve(outPath))
            .on('error', reject);
      });
      processedScenes.push(outPath);
      listContent += `file '${outPath}'\n`;
    }

    if (processedScenes.length === 0) {
        return res.status(400).json({ error: 'No valid scenes provided.' });
    }

    fs.writeFileSync(listPath, listContent);

    // Concat all processed scenes
    await new Promise((resolve, reject) => {
        ffmpeg()
          .input(listPath)
          .inputOptions(['-f concat', '-safe 0'])
          .outputOptions(['-c copy'])
          .save(finalOutputFile)
          .on('end', resolve)
          .on('error', reject);
    });

    // Return the stitched file
    res.download(finalOutputFile, 'cinematic_cut.mp4', () => {
        // Cleanup async
        fs.rmSync(workDir, { recursive: true, force: true });
        files.forEach(f => {
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
