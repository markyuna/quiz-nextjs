import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const topic = searchParams.get("topic");
    const difficulty = searchParams.get("difficulty");
    const limit = Math.min(Number(searchParams.get("limit") ?? 5), 20);

    let query = supabaseAdmin
      .from("quiz_questions")
      .select("*")
      .eq("is_active", true)
      .limit(limit);

    if (topic) {
      query = query.eq("topic", topic);
    }

    if (
      difficulty === "easy" ||
      difficulty === "medium" ||
      difficulty === "hard"
    ) {
      query = query.eq("difficulty", difficulty);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const shuffled = [...(data ?? [])].sort(() => Math.random() - 0.5);

    return NextResponse.json({
      success: true,
      questions: shuffled.slice(0, limit),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}