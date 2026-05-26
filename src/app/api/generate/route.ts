import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.5-pro",
].filter((model): model is string => Boolean(model));

const MAX_PDF_TEXT_CHARS = 12000;

async function extractPdfText(file: File) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "";
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule: any = await import("pdf-parse");
    const pdfParse = pdfParseModule.default ?? pdfParseModule;
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(buffer);
    return (parsed.text || "").slice(0, MAX_PDF_TEXT_CHARS).trim();
  } catch (error) {
    console.error(`Failed to extract text from PDF ${file.name}:`, error);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt") as string;
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const files = formData.getAll("files") as File[];

    const inlineDataParts = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();

        return {
          inlineData: {
            data: Buffer.from(buffer).toString("base64"),
            mimeType: file.type || "application/pdf",
          },
        };
      })
    );

    const extractedFileContexts = await Promise.all(
      files.map(async (file) => {
        const extractedText = await extractPdfText(file);

        if (!extractedText) {
          return `File: ${file.name}`;
        }

        return [
          `File: ${file.name}`,
          `Extracted text:`,
          extractedText,
        ].join("\n");
      })
    );

    let fileContext = "";

    if (extractedFileContexts.length > 0) {
      fileContext = `\n\nUploaded file context:\n${extractedFileContexts.join("\n\n")}`;
    } else if (files.length > 0) {
      fileContext = `\n\nThe user uploaded the following files: ${files.map((f) => f.name).join(", ")}. Use their attached document content when relevant.`;
    }

    // Read the Google Gemini API Key from environment variables to prevent public exposure on GitHub
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured. Please configure GEMINI_API_KEY." },
        { status: 500 }
      );
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `You are DomainQA, an AI-powered Machine Learning Domain Question & Answering System. 
    Operate as an ML Expert, Research Assistant, AI Tutor, and Code Generator. 
    Answer the following query concisely and accurately using markdown formatting:
    
    User Query: ${prompt}${fileContext}`;

    let lastError: unknown;

    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          systemPrompt,
          ...inlineDataParts,
        ]);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ response: text });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error("No supported Gemini models were available");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Gemini Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response: " + message },
      { status: 500 }
    );
  }
}
