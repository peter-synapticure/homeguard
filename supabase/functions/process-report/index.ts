import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { reportId } = await req.json();
    if (!reportId) throw new Error("Missing reportId");
    console.log("Starting processing for report:", reportId);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: report, error: reportErr } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (reportErr || !report) throw new Error("Report not found");

    if (!["UPLOADED", "ERROR"].includes(report.status)) {
      return new Response(JSON.stringify({ status: report.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (report.status === "ERROR" && report.retry_count >= 5) {
      return new Response(JSON.stringify({ error: "Max retries exceeded" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("reports")
      .update({ status: "PROCESSING", retry_count: (report.retry_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", reportId);

    console.log("Downloading PDF from:", report.file_path);
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("reports")
      .download(report.file_path);

    if (dlErr || !fileData) throw new Error("Failed to download PDF: " + (dlErr?.message || "unknown"));

    console.log("PDF downloaded, size:", (fileData.size / 1024 / 1024).toFixed(2) + "MB");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OPENAI_API_KEY not set");

    // Upload directly to OpenAI — no base64 conversion needed
    console.log("Uploading to OpenAI Files API...");
    const formData = new FormData();
    formData.append("purpose", "assistants");
    formData.append("file", fileData, report.file_name || "report.pdf");

    const uploadRes = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: { Authorization: "Bearer " + openaiKey },
      body: formData,
    });

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text();
      console.error("File upload error:", uploadErr);
      throw new Error("Failed to upload to OpenAI: " + uploadRes.status);
    }

    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;
    console.log("File uploaded, id:", fileId);

    // Free memory
    const fileName = report.file_name;
    const homeId = report.home_id;
    const userId = report.user_id;

    console.log("Calling GPT-4o...");
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + openaiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 16384,
        messages: [
          {
            role: "system",
            content: "You are a home inspection report parser. Return a JSON object with this structure:\n{\"inspector\":string|null,\"company\":string|null,\"inspection_date\":string|null,\"address\":string|null,\"city\":string|null,\"state\":string|null,\"zip\":string|null,\"year_built\":number|null,\"items\":[{\"category\":\"Roof/Exterior\"|\"HVAC\"|\"Plumbing\"|\"Electrical\"|\"Appliances\"|\"Structure\"|\"Landscape\"|\"Interior\"|\"Safety\",\"name\":string,\"location\":string|null,\"manufacturer\":string|null,\"model\":string|null,\"serial\":string|null,\"year_installed\":string|null,\"year_confidence\":\"exact\"|\"est\"|\"unknown\",\"condition\":\"poor\"|\"fair\"|\"functional\"|\"good\",\"urgency\":\"critical\"|\"attention\"|\"monitor\"|\"ok\",\"lifespan_min_years\":number|null,\"lifespan_max_years\":number|null,\"cost_min\":number|null,\"cost_max\":number|null,\"notes\":string|null,\"deficiencies\":[string],\"recommendations\":[string],\"maintenance\":[{\"task\":string,\"frequency_months\":number,\"estimated_cost\":number,\"diy\":boolean,\"season\":string|null}]}],\"warranties\":[{\"product\":string,\"provider\":string|null,\"coverage\":string|null,\"expires\":string|null,\"registered\":boolean|null}]}\n\nRules: Extract ALL components. Only facts from the document. null if not stated. urgency: critical=safety/must fix, attention=plan/budget, monitor=watch, ok=good. Cost estimates in USD national averages.",
          },
          {
            role: "user",
            content: [
              { type: "file", file: { file_id: fileId } },
              { type: "text", text: "Parse this home inspection report. Extract every component inspected." },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error("OpenAI chat error:", errBody);
      throw new Error("OpenAI API error: " + openaiRes.status);
    }

    const openaiData = await openaiRes.json();
    console.log("GPT-4o responded, tokens:", openaiData.usage?.total_tokens);

    const rawText = openaiData.choices[0]?.message?.content;
    if (!rawText) throw new Error("No content in OpenAI response");

    const parsed = JSON.parse(rawText);
    console.log("Extracted", (parsed.items?.length || 0), "items");

    await supabase
      .from("reports")
      .update({
        status: "EXTRACTED",
        raw_openai: openaiData,
        parsed_json: parsed,
        inspector: parsed.inspector,
        company: parsed.company,
        inspected_at: parsed.inspection_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (parsed.items && parsed.items.length > 0) {
      const itemRows = parsed.items.map((item) => ({
        report_id: reportId,
        home_id: homeId,
        user_id: userId,
        category: item.category,
        name: item.name,
        location: item.location,
        manufacturer: item.manufacturer,
        model: item.model,
        serial: item.serial,
        year_installed: item.year_installed,
        year_confidence: item.year_confidence || "unknown",
        condition: item.condition,
        urgency: item.urgency || "monitor",
        lifespan_min: item.lifespan_min_years,
        lifespan_max: item.lifespan_max_years,
        cost_min: item.cost_min,
        cost_max: item.cost_max,
        notes: item.notes,
        deficiencies: item.deficiencies || [],
        recommendations: item.recommendations || [],
        maintenance: item.maintenance || [],
      }));

      const { error: insertErr } = await supabase.from("items").insert(itemRows);
      if (insertErr) console.error("Insert items error:", insertErr);
      else console.log("Inserted", itemRows.length, "items");
    }

    if (parsed.warranties && parsed.warranties.length > 0) {
      const warRows = parsed.warranties.map((w) => ({
        user_id: userId,
        product: w.product,
        provider: w.provider,
        coverage: w.coverage,
        expires_at: w.expires,
        registered: w.registered,
      }));

      const { error: wErr } = await supabase.from("warranties").insert(warRows);
      if (wErr) console.error("Insert warranties error:", wErr);
    }

    if (parsed.address || parsed.year_built) {
      const h = {};
      if (parsed.city) h.city = parsed.city;
      if (parsed.state) h.state = parsed.state;
      if (parsed.zip) h.zip = parsed.zip;
      if (parsed.year_built) h.year_built = parsed.year_built;
      if (Object.keys(h).length > 0) {
        await supabase.from("homes").update(h).eq("id", homeId);
      }
    }

    try {
      await fetch("https://api.openai.com/v1/files/" + fileId, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + openaiKey },
      });
    } catch (_) {}

    await supabase
      .from("reports")
      .update({ status: "COMPLETE", updated_at: new Date().toISOString() })
      .eq("id", reportId);

    console.log("Processing complete!");
    return new Response(
      JSON.stringify({ status: "COMPLETE", items: parsed.items?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Processing error:", err);

    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { reportId } = await req.clone().json();
      if (reportId) {
        await supabase
          .from("reports")
          .update({ status: "ERROR", error_msg: err.message, updated_at: new Date().toISOString() })
          .eq("id", reportId);
      }
    } catch (_) {}

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
