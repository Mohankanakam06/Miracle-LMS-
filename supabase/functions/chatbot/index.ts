import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  userId: string;
  userRole: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { message, userId, userRole } = await req.json() as ChatRequest;

    // Step 1: Check knowledge base for exact/similar matches
    const { data: kbResults } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("active", true)
      .textSearch("question", message.split(" ").join(" | "));

    // Step 2: Fetch user-specific data based on query intent
    let contextData = "";
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("timetable") || lowerMessage.includes("schedule") || lowerMessage.includes("class")) {
      const { data: timetable } = await supabase
        .from("timetable")
        .select(`
          *,
          classes:class_id (
            section,
            courses:course_id (name, code),
            profiles:teacher_id (full_name)
          )
        `)
        .limit(10);
      
      if (timetable && timetable.length > 0) {
        contextData += `\n\nUser's Timetable:\n${JSON.stringify(timetable, null, 2)}`;
      }
    }

    if (lowerMessage.includes("attendance")) {
      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", userId)
        .order("date", { ascending: false })
        .limit(30);
      
      if (attendance && attendance.length > 0) {
        const present = attendance.filter(a => a.status === "present").length;
        const total = attendance.length;
        contextData += `\n\nAttendance Summary: ${present}/${total} classes attended (${Math.round(present/total*100)}%)`;
      }
    }

    if (lowerMessage.includes("assignment") || lowerMessage.includes("homework") || lowerMessage.includes("due")) {
      const { data: assignments } = await supabase
        .from("assignments")
        .select(`
          *,
          classes:class_id (
            courses:course_id (name)
          ),
          submissions (status, marks)
        `)
        .gte("due_date", new Date().toISOString())
        .order("due_date", { ascending: true })
        .limit(10);
      
      if (assignments && assignments.length > 0) {
        contextData += `\n\nUpcoming Assignments:\n${JSON.stringify(assignments, null, 2)}`;
      }
    }

    if (lowerMessage.includes("fee") || lowerMessage.includes("payment") || lowerMessage.includes("pay")) {
      const { data: fees } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", userId);
      
      if (fees && fees.length > 0) {
        const totalDue = fees.reduce((sum, f) => sum + (f.status === "pending" ? Number(f.amount) : 0), 0);
        const totalPaid = fees.reduce((sum, f) => sum + (f.status === "paid" ? Number(f.amount) : 0), 0);
        contextData += `\n\nFee Status: Paid ₹${totalPaid}, Pending ₹${totalDue}`;
      }
    }

    if (lowerMessage.includes("grade") || lowerMessage.includes("marks") || lowerMessage.includes("result")) {
      const { data: grades } = await supabase
        .from("submissions")
        .select(`
          marks,
          assignments:assignment_id (title, max_marks)
        `)
        .eq("student_id", userId)
        .eq("status", "graded");
      
      if (grades && grades.length > 0) {
        contextData += `\n\nGrades:\n${JSON.stringify(grades, null, 2)}`;
      }
    }

    // Step 3: Build AI prompt
    const kbContext = kbResults && kbResults.length > 0 
      ? `\n\nRelevant Knowledge Base Entries:\n${kbResults.map(k => `Q: ${k.question}\nA: ${k.answer}`).join("\n\n")}`
      : "";

    const systemPrompt = `You are an AI academic assistant for Miracle Educational Society's Learning Management System. 
You help students, teachers, and administrators with academic queries.

Current user role: ${userRole}
${kbContext}
${contextData}

Guidelines:
- Be helpful, concise, and friendly
- For timetable queries, format the schedule clearly
- For attendance, show percentage and recent records
- For assignments, list upcoming deadlines
- For fees, show payment status clearly
- If you cannot answer a query, suggest the user contact support
- Always provide actionable information
- Use emojis sparingly to make responses engaging`;

    // Step 4: Call AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const aiData = await aiResponse.json();
    const botResponse = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your query. Please try again.";

    // Step 5: Determine intent and confidence
    let intent = "general";
    const confidence = 0.8;

    if (lowerMessage.includes("timetable") || lowerMessage.includes("schedule")) intent = "timetable";
    else if (lowerMessage.includes("attendance")) intent = "attendance";
    else if (lowerMessage.includes("assignment")) intent = "assignment";
    else if (lowerMessage.includes("fee") || lowerMessage.includes("payment")) intent = "fees";
    else if (lowerMessage.includes("grade") || lowerMessage.includes("marks")) intent = "grades";
    else if (lowerMessage.includes("syllabus")) intent = "syllabus";
    
    // Step 6: Log conversation
    await supabase.from("chat_logs").insert({
      user_id: userId,
      query: message,
      response: botResponse,
      intent,
      confidence,
      escalated: false,
    });

    return new Response(
      JSON.stringify({
        response: botResponse,
        intent,
        confidence,
        hasContext: contextData.length > 0 || (kbResults && kbResults.length > 0),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chatbot error:", error);
    return new Response(
      JSON.stringify({ 
        error: "An error occurred processing your query",
        response: "I'm having trouble right now. Please try again later or contact support."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
