import { NextRequest, NextResponse } from "next/server";
import { getJson } from "serpapi";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "CPR first aid";
    const api_key = process.env.SERPAPI_API_KEY;

    if (!api_key) {
      return NextResponse.json({ error: "SERPAPI_API_KEY is not set" }, { status: 500 });
    }

    const params = {
      engine: "google",
      q: `first aid for ${query}`,
      hl: "en",
      gl: "in",
      api_key
    };

    const response = await getJson(params);
    
    // We want to extract knowledge graph or direct answer box usually
    const result = {
      answer_box: response.answer_box,
      knowledge_graph: response.knowledge_graph,
      organic_results: response.organic_results?.slice(0, 3) || []
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("SerpApi Emergency Search Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
