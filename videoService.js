const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

class VideoService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  async extractAudio(videoUrl) {
    try {
      const videoId = this.extractVideoId(videoUrl);
      const audioPath = path.join(this.tempDir, `${videoId}-${uuidv4()}.wav`);
      
      if (this.isYouTubeUrl(videoUrl)) {
        return await this.extractYouTubeAudio(videoUrl, audioPath);
      } else if (this.isInstagramUrl(videoUrl)) {
        return await this.extractInstagramAudio(videoUrl, audioPath);
      } else {
        throw new Error('Unsupported video platform');
      }
    } catch (error) {
      console.error('Audio extraction error:', error);
      throw new Error('Failed to extract audio from video');
    }
  }

  async extractYouTubeAudio(videoUrl, audioPath) {
    return new Promise((resolve, reject) => {
      const stream = ytdl(videoUrl, { 
        quality: 'highestaudio',
        filter: 'audioonly'
      });

      ffmpeg(stream)
        .audioBitrate(128)
        .audioChannels(1)
        .audioFrequency(16000)
        .format('wav')
        .on('end', () => {
          console.log('Audio extraction completed');
          resolve(audioPath);
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .save(audioPath);
    });
  }

  async extractInstagramAudio(videoUrl, audioPath) {
    // Instagram video processing would require Instagram Basic Display API
    // This is a placeholder implementation
    try {
      // For now, we'll use a generic approach
      // In production, you'd need proper Instagram API integration
      throw new Error('Instagram video processing requires additional API setup');
    } catch (error) {
      throw new Error('Instagram video extraction not yet implemented');
    }
  }

  async transcribeAudio(audioPath) {
    try {
      const audioFile = await fs.readFile(audioPath);
      
      const response = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'json',
        timestamp_granularities: ['segment']
      });

      // Clean up audio file
      await this.cleanupFile(audioPath);

      return {
        text: response.text,
        segments: response.segments || [],
        duration: this.calculateDuration(response.segments),
        language: response.language || 'en'
      };
    } catch (error) {
      console.error('Transcription error:', error);
      await this.cleanupFile(audioPath);
      throw new Error('Failed to transcribe audio');
    }
  }

  async analyzeVisuals(videoUrl) {
    try {
      // Extract frames from video for visual analysis
      const frames = await this.extractFrames(videoUrl);
      const visualAnalysis = await this.analyzeFrames(frames);
      
      // Clean up frames
      for (const frame of frames) {
        await this.cleanupFile(frame);
      }

      return visualAnalysis;
    } catch (error) {
      console.error('Visual analysis error:', error);
      return {
        keyVisualElements: [],
        textInImages: [],
        sceneChanges: [],
        importantVisuals: []
      };
    }
  }

  async extractFrames(videoUrl, frameCount = 10) {
    const videoId = this.extractVideoId(videoUrl);
    const frames = [];

    return new Promise((resolve, reject) => {
      const tempVideoPath = path.join(this.tempDir, `${videoId}-temp.mp4`);
      // Download video temporarily
      const stream = ytdl(videoUrl, { quality: 'highest' });
      const writeStream = require('fs').createWriteStream(tempVideoPath);
      stream.pipe(writeStream);
      writeStream.on('finish', () => {
        // Extract frames
        ffmpeg(tempVideoPath)
          .on('end', () => {
            this.cleanupFile(tempVideoPath);
            resolve(frames);
          })
          .on('error', (err) => {
            this.cleanupFile(tempVideoPath);
            reject(err);
          })
          .screenshots({
            count: frameCount,
            folder: this.tempDir,
            filename: `${videoId}-frame-%i.png`,
            size: '1280x720'
          });
        // Collect frame paths
        for (let i = 1; i <= frameCount; i++) {
          frames.push(path.join(this.tempDir, `${videoId}-frame-${i}.png`));
        }
      });
    });
  }

  async analyzeFrames(framePaths) {
    try {
      const analyses = [];
      
      for (const framePath of framePaths) {
        try {
          const frameBuffer = await fs.readFile(framePath);
          const base64Image = frameBuffer.toString('base64');
          
          const response = await this.openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Analyze this video frame and extract any important visual information, text, charts, diagrams, or key visual elements that should not be missed in a summary."
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/png;base64,${base64Image}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 300
          });

          analyses.push({
            frame: framePath,
            analysis: response.choices[0].message.content,
            timestamp: new Date().toISOString()
          });
        } catch (frameError) {
          console.error(`Frame analysis error for ${framePath}:`, frameError);
          continue;
        }
      }

      return {
        frameAnalyses: analyses,
        keyVisualElements: this.extractKeyVisualElements(analyses),
        textInImages: this.extractTextFromAnalyses(analyses),
        importantVisuals: this.identifyImportantVisuals(analyses)
      };
    } catch (error) {
      console.error('Frame analysis error:', error);
      return {
        frameAnalyses: [],
        keyVisualElements: [],
        textInImages: [],
        importantVisuals: []
      };
    }
  }

  async getVideoInfo(videoUrl) {
    try {
      if (this.isYouTubeUrl(videoUrl)) {
        const info = await ytdl.getInfo(videoUrl);
        return {
          title: info.videoDetails.title,
          description: info.videoDetails.description,
          duration: parseInt(info.videoDetails.lengthSeconds),
          author: info.videoDetails.author.name,
          viewCount: info.videoDetails.viewCount,
          uploadDate: info.videoDetails.uploadDate,
          thumbnails: info.videoDetails.thumbnails,
          keywords: info.videoDetails.keywords || []
        };
      } else {
        throw new Error('Video info extraction not supported for this platform');
      }
    } catch (error) {
      console.error('Video info error:', error);
      throw new Error('Failed to get video information');
    }
  }

  async processInstagramVideo(videoUrl, format) {
    // Placeholder for Instagram video processing
    // Would require Instagram Basic Display API implementation
    throw new Error('Instagram video processing requires additional setup');
  }

  extractVideoId(videoUrl) {
    if (this.isYouTubeUrl(videoUrl)) {
      const regExp = /^.(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]).*/;
      const match = videoUrl.match(regExp);
      return match && match[2].length === 11 ? match[2] : uuidv4();
    } else if (this.isInstagramUrl(videoUrl)) {
      const match = videoUrl.match(/\/p\/([A-Za-z0-9_-]+)/);
      return match ? match[1] : uuidv4();
    } else {
      return uuidv4();
    }
  }

  isYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;
    return youtubeRegex.test(url);
  }

  isInstagramUrl(url) {
    const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\//;
    return instagramRegex.test(url);
  }

  calculateDuration(segments) {
    if (!segments || segments.length === 0) return 0;
    const lastSegment = segments[segments.length - 1];
    return lastSegment.end || 0;
  }

  extractKeyVisualElements(analyses) {
    const elements = [];
    analyses.forEach(analysis => {
      const text = analysis.analysis.toLowerCase();
      if (text.includes('chart') || text.includes('graph')) {
        elements.push('Charts/Graphs detected');
      }
      if (text.includes('text') || text.includes('title')) {
        elements.push('Important text elements');
      }
      if (text.includes('diagram') || text.includes('flowchart')) {
        elements.push('Diagrams/Flowcharts');
      }
    });
    return [...new Set(elements)];
  }

  extractTextFromAnalyses(analyses) {
    const textElements = [];
    analyses.forEach(analysis => {
      const matches = analysis.analysis.match(/"([^"]+)"/g);
      if (matches) {
        textElements.push(...matches.map(match => match.replace(/"/g, '')));
      }
    });
    return textElements;
  }

  identifyImportantVisuals(analyses) {
    return analyses
      .filter(analysis => 
        analysis.analysis.toLowerCase().includes('important') ||
        analysis.analysis.toLowerCase().includes('key') ||
        analysis.analysis.toLowerCase().includes('significant')
      )
      .map(analysis => ({
        description: analysis.analysis,
        timestamp: analysis.timestamp
      }));
  }

  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to cleanup file ${filePath}:`, error);
    }
  }
}

module.exports = new VideoService();