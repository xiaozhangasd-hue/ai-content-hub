import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const execAsync = promisify(exec);

// 临时文件目录
const TMP_DIR = "/tmp/video-compose";

// 确保临时目录存在
async function ensureTmpDir() {
  try {
    await fs.mkdir(TMP_DIR, { recursive: true });
  } catch (error) {
    // 目录可能已存在
  }
}

// 下载文件
async function downloadFile(url: string, filepath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载失败: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  await fs.writeFile(filepath, Buffer.from(buffer));
}

// 生成TTS音频（使用硅基流动API）
async function generateTTS(text: string, voiceId: string): Promise<string> {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  
  if (!apiKey) {
    throw new Error("TTS服务未配置，请设置SILICONFLOW_API_KEY");
  }

  // 映射音色ID到硅基流动支持的音色
  const voiceMap: Record<string, string> = {
    "zh_female_tianmei": "zh_female_tianmei",
    "zh_male_chunhou": "zh_male_chunhou",
    "zh_female_wanwan": "zh_female_wanwan",
    "zh_male_qinglang": "zh_male_qinglang",
    "zh_child_kawaii": "zh_child_kawaii",
  };

  const response = await fetch("https://api.siliconflow.cn/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "FunAudioLLM/SenseVoiceSmall",
      input: text,
      voice: voiceMap[voiceId] || voiceId,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS生成失败: ${error}`);
  }

  const buffer = await response.arrayBuffer();
  const outputPath = path.join(TMP_DIR, `tts-${Date.now()}.mp3`);
  await fs.writeFile(outputPath, Buffer.from(buffer));
  
  return outputPath;
}

export async function POST(request: NextRequest) {
  try {
    await ensureTmpDir();
    
    const body = await request.json();
    const { clips, bgm, voiceover } = body;

    if (!clips || clips.length === 0) {
      return NextResponse.json({ error: "请提供视频片段" }, { status: 400 });
    }

    const taskId = crypto.randomUUID();
    const workDir = path.join(TMP_DIR, taskId);
    await fs.mkdir(workDir, { recursive: true });

    console.log(`[视频合成] 任务ID: ${taskId}, 片段数: ${clips.length}`);

    // 1. 下载所有视频片段
    const videoFiles: string[] = [];
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const filepath = path.join(workDir, `clip-${i}.mp4`);
      console.log(`[视频合成] 下载片段 ${i + 1}/${clips.length}`);
      await downloadFile(clip.url, filepath);
      videoFiles.push(filepath);
    }

    // 2. 生成配音音频（如果需要）
    let voiceoverFile: string | null = null;
    if (voiceover && voiceover.text && voiceover.voiceId) {
      console.log("[视频合成] 生成AI配音...");
      try {
        voiceoverFile = await generateTTS(voiceover.text, voiceover.voiceId);
      } catch (error) {
        console.error("[视频合成] 配音生成失败:", error);
        // 配音失败不影响主流程
      }
    }

    // 3. 创建简单的背景音乐（如果需要）
    // 注意：这里使用占位逻辑，实际需要配置BGM文件
    let bgmFile: string | null = null;
    if (bgm && bgm.url) {
      try {
        const bgmPath = path.join(workDir, "bgm.mp3");
        if (bgm.url.startsWith("http")) {
          console.log("[视频合成] 下载背景音乐...");
          await downloadFile(bgm.url, bgmPath);
          bgmFile = bgmPath;
        }
      } catch (error) {
        console.error("[视频合成] 背景音乐下载失败:", error);
      }
    }

    // 4. 使用FFmpeg合成视频
    const outputFile = path.join(workDir, "output.mp4");
    const listFile = path.join(workDir, "list.txt");

    // 创建视频列表文件
    const listContent = videoFiles.map(f => `file '${f}'`).join("\n");
    await fs.writeFile(listFile, listContent);

    // 简化版：只拼接视频，不添加音频（避免FFmpeg复杂命令）
    let ffmpegCmd: string;
    
    if (bgmFile || voiceoverFile) {
      // 有音频需求
      const audioInputs = [];
      let inputIndex = 1;
      
      if (bgmFile) {
        audioInputs.push(`-i "${bgmFile}"`);
      }
      if (voiceoverFile) {
        audioInputs.push(`-i "${voiceoverFile}"`);
      }

      // 简单的音视频合并
      if (bgmFile && voiceoverFile) {
        // 两个音频源：背景音乐 + 配音
        ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${listFile}" -i "${bgmFile}" -i "${voiceoverFile}" ` +
          `-filter_complex "[1:a]volume=${bgm?.volume || 0.3}[bgm];[2:a]volume=1.0[voice];[bgm][voice]amix=inputs=2:duration=longest[aout]" ` +
          `-map 0:v -map "[aout]" -c:v libx264 -preset fast -crf 23 -c:a aac -shortest "${outputFile}"`;
      } else if (voiceoverFile) {
        // 只有配音
        ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${listFile}" -i "${voiceoverFile}" ` +
          `-map 0:v -map 1:a -c:v libx264 -preset fast -crf 23 -c:a aac -shortest "${outputFile}"`;
      } else {
        // 只有背景音乐
        ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${listFile}" -i "${bgmFile}" ` +
          `-map 0:v -map 1:a -c:v libx264 -preset fast -crf 23 -c:a aac -shortest "${outputFile}"`;
      }
    } else {
      // 无音频需求，只拼接视频
      ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`;
    }

    console.log("[视频合成] 执行FFmpeg命令");
    
    try {
      const { stdout, stderr } = await execAsync(ffmpegCmd, { 
        maxBuffer: 50 * 1024 * 1024,
        timeout: 120000 // 2分钟超时
      });
      console.log("[视频合成] FFmpeg完成");
    } catch (error: any) {
      console.error("[视频合成] FFmpeg错误:", error.message);
      throw new Error(`视频合成失败: ${error.message}`);
    }

    // 5. 检查输出文件
    try {
      const stats = await fs.stat(outputFile);
      console.log(`[视频合成] 输出文件大小: ${stats.size} bytes`);
    } catch {
      throw new Error("视频合成失败，输出文件不存在");
    }

    // 6. 返回文件ID，让前端通过API下载
    console.log("[视频合成] 任务完成:", taskId);

    return NextResponse.json({
      success: true,
      taskId: taskId,
      downloadUrl: `/api/video/file/${taskId}`,
      duration: clips.reduce((sum: number, c: any) => sum + (c.duration || 5), 0),
      message: "视频合成成功",
    });

  } catch (error) {
    console.error("[视频合成] 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "视频合成失败" },
      { status: 500 }
    );
  }
}
