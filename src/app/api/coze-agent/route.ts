import { NextRequest } from "next/server";

// 扣子智能体API配置
const COZE_API_URL = "https://sw98q8ksyf.coze.site/stream_run";
const COZE_PROJECT_ID = "7620816249181814825";
const COZE_AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjJlYzY4MDQ4LTUwN2MtNDgzOS1hZmQxLTM1YmJhODcyMmRkZCJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkRyZUFFZ2dMV1dta242TFVkOTBxMjJoWUVLYUJlRElPIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzc0MzY1OTQ2LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjIwODI0MDc1NjI3MTM1MDE5Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjIwODQzNzEwMTc5MTgwNTgyIn0.R8-80v7UfZvRdEKpUqNF1ttcnNnkTGDxqn7s1UXlrUx313aMjQEKrjXMIGEuirItyw1vaMLM9UtAR1aGlfHnJrJuuQmxhSb0uzvwOy9fTZn96PR6vw2-NbMOzmkAswyxm9T2p3utL-QGktM4I-5RSYaS65rmghEUTeJPQr97Hc81DSq9OouppDsYN-L5ShpZV8tDscZD6m8grYBdZepEkJd-hR5Fh4XLc-MHmorSwXYprZPcdhFSQvY5-qwqug7yCIB4j04N4qo6qHLTZN_4nI8azrl4aFrbS0SAL2gC8g6e8y1R7tdGSBEVqSDOSwVlaf3_kccenOHJbRQRmISkuA";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, content, sessionId } = body;

    // 构建发送给扣子智能体的请求
    const prompt = buildPrompt(action, content);

    console.log("[Coze Agent] Calling API with prompt:", prompt.substring(0, 100) + "...");

    const response = await fetch(COZE_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COZE_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
      },
      body: JSON.stringify({
        content: {
          query: {
            prompt: [
              {
                type: "text",
                content: {
                  text: prompt,
                },
              },
            ],
          },
        },
        type: "query",
        session_id: sessionId || `session_${Date.now()}`,
        project_id: COZE_PROJECT_ID,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Coze Agent] API error:", errorText);
      return new Response(
        JSON.stringify({ error: `智能体请求失败: ${response.status}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!response.body) {
      return new Response(
        JSON.stringify({ error: "无响应内容" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 流式响应 - 处理扣子SSE格式
    const encoder = new TextEncoder();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        let fullContent = "";
        let pptDownloadUrl: string | null = null;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // 流结束，发送最终内容
              if (fullContent) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "final", content: fullContent, pptDownloadUrl })}\n\n`)
                );
              }
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "done", pptDownloadUrl })}\n\n`)
              );
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            
            // 解析SSE格式: event: message\ndata: {...}\n\n
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (line.startsWith("data:")) {
                const dataText = line.slice(5).trim();
                if (!dataText) continue;

                try {
                  const parsed = JSON.parse(dataText);
                  
                  // 处理扣子API的响应格式
                  if (parsed.type === "answer" && parsed.content?.answer) {
                    // 增量文本内容
                    const text = parsed.content.answer;
                    fullContent += text;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "delta", content: text })}\n\n`)
                    );
                  } else if (parsed.type === "tool_response" && parsed.content?.tool_response?.result) {
                    // 工具响应 - 检查是否包含PPT下载链接
                    const toolResult = parsed.content.tool_response.result;
                    
                    // 检测PPT下载链接
                    const urlMatch = toolResult.match(/Download URL:\s*(https?:\/\/[^\s]+)/i) ||
                                    toolResult.match(/(https?:\/\/[^\s]+\.pptx[^\s]*)/i);
                    
                    if (urlMatch) {
                      pptDownloadUrl = urlMatch[1];
                      console.log("[Coze Agent] Found PPT download URL:", pptDownloadUrl);
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "ppt_ready", url: pptDownloadUrl })}\n\n`)
                      );
                    }
                  } else if (parsed.type === "message_start") {
                    // 消息开始
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "start", sessionId: parsed.session_id })}\n\n`)
                    );
                  }
                } catch (parseError) {
                  // JSON解析失败，忽略
                }
              }
            }
          }
        } catch (error) {
          console.error("[Coze Agent] Stream error:", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(error) })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Coze Agent] API error:", error);
    return new Response(
      JSON.stringify({ error: "服务器错误" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// 根据不同action构建提示词
function buildPrompt(action: string, content: any): string {
  switch (action) {
    case "generate_ppt":
      return `请根据以下内容生成PPT课件：

课程类型：${content.courseType || "口才课程"}
目标学员：${content.targetAudience || "3-5岁幼儿"}
设计风格：${content.style || "童趣活泼"}

文档内容：
${content.documentContent || content.content || "请帮我生成一个关于口才训练的PPT"}

请生成PPT课件。`;

    case "generate_recommendations":
      return `请分析以下PPT内容，并给出优化建议：

PPT信息：
- 总页数：${content.totalSlides || 5}
- 是否有互动环节：${content.hasInteractive ? "是" : "否"}
- 是否有总结页：${content.hasSummary ? "是" : "否"}
- 预计时长：${content.estimatedDuration || 30}分钟
- 目标学员：${content.targetAudience || "3-5岁幼儿"}

请给出3-5条优化建议。`;

    case "generate_lesson_plan":
      return `请根据以下PPT内容生成配套教案：

课程类型：${content.courseType || "口才课程"}
目标学员：${content.targetAudience || "3-5岁幼儿"}
PPT页面：
${JSON.stringify(content.slides, null, 2)}

请生成完整教案。`;

    case "optimize_script":
      return `请优化以下教师话术，使其更适合${content.targetAudience || "3-5岁幼儿"}：

${content.script || "小朋友们好，今天我们来学习..."}`;

    default:
      return content.prompt || content.query || content.content || "请帮我处理这个请求";
  }
}
