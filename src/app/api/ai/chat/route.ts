import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AI聊天接口 - 支持流式输出
 * POST /api/ai/chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, stream = true } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "请提供有效的消息" }, { status: 400 });
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    if (stream) {
      // 流式输出
      const encoder = new TextEncoder();
      const streamGenerator = client.stream(messages, {
        model: "doubao-seed-1-6-lite-251015", // 使用轻量级模型，更快响应
        temperature: 0.7,
      });

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamGenerator) {
              if (chunk.content) {
                const data = JSON.stringify({ content: chunk.content.toString() });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("流式输出错误:", error);
            controller.error(error);
          }
        },
      });

      return new NextResponse(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // 非流式输出
      const response = await client.invoke(messages, {
        model: "doubao-seed-1-6-lite-251015",
        temperature: 0.7,
      });

      return NextResponse.json({
        success: true,
        content: response.content,
      });
    }
  } catch (error) {
    console.error("AI聊天错误:", error);
    const errorMessage = error instanceof Error ? error.message : "生成失败";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
