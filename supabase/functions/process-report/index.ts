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
    console.log("PDF downloaded:", (fileData.size / 1024 / 1024).toFixed(2) + "MB");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OPENAI_API_KEY not set");

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
            content: `You are a home inspection report parser and cost estimator. Return a JSON object with this structure:
{
  "inspector": string or null,
  "company": string or null,
  "inspection_date": string or null,
  "address": string or null,
  "city": string or null,
  "state": string or null,
  "zip": string or null,
  "year_built": number or null,
  "items": [
    {
      "category": one of "Roof/Exterior", "HVAC", "Plumbing", "Electrical", "Appliances", "Structure", "Landscape", "Interior", "Safety",
      "name": string,
      "location": string or null,
      "manufacturer": string or null,
      "model": string or null,
      "serial": string or null,
      "year_installed": string or null,
      "year_confidence": "exact" or "est" or "unknown",
      "condition": "poor" or "fair" or "functional" or "good",
      "urgency": "critical" or "attention" or "monitor" or "ok",
      "lifespan_min_years": number,
      "lifespan_max_years": number,
      "cost_min": number,
      "cost_max": number,
      "notes": string or null,
      "deficiencies": [string],
      "recommendations": [string],
      "maintenance": [{"task": string, "frequency_months": number, "estimated_cost": number, "diy": boolean, "season": string or null}],
      "photo_pages": [number]
    }
  ],
  "warranties": [{"product": string, "provider": string or null, "coverage": string or null, "expires": string or null, "registered": boolean or null}],
  "photo_map": [{"page": number, "description": string, "item_name": string}]
}

CRITICAL RULES — YOU MUST FOLLOW ALL OF THESE:

1. COST ESTIMATES ARE REQUIRED FOR EVERY ITEM. Never leave cost_min or cost_max as null or 0. Use national average replacement/repair costs in USD. Examples:
   - Roof replacement: $8,000–$25,000
   - HVAC system: $3,000–$8,000
   - Water heater: $1,200–$3,500
   - Electrical panel: $1,500–$4,000
   - Windows (whole house): $5,000–$20,000
   - Smoke detectors: $30–$100
   Even structural items like "grading" or "exterior walls" have repair costs. Estimate them.

2. LIFESPAN IS REQUIRED FOR EVERY ITEM. Use industry standard expected useful life ranges. Never leave as null.

3. MAINTENANCE IS REQUIRED FOR EVERY ITEM. Every home component needs at least one maintenance task. Use industry-standard schedules. Include realistic costs. Examples:
   - Roof: Visual inspection every 6 months ($0, DIY), Professional inspection every 24 months ($300-500)
   - HVAC: Replace filter every 3 months ($25, DIY), Professional tune-up every 12 months ($150-200)
   - Plumbing: Check for leaks every 6 months ($0, DIY)
   - Electrical: Visual inspection every 12 months ($0, DIY)
   - Smoke detectors: Test monthly ($0, DIY), Replace batteries every 12 months ($10, DIY)

4. Extract ALL components mentioned in the report — do not skip any.

5. For appliances: ALWAYS extract manufacturer, model, serial if visible in photos or text.

6. year_confidence: "exact" if year stated, "est" if estimated, "unknown" if not mentioned.

7. urgency: "critical" = safety hazard or must fix immediately, "attention" = plan/budget within 1-2 years, "monitor" = watch over time, "ok" = good condition.

8. photo_pages: list the 1-based page numbers where photos of this item appear.

9. photo_map: for every page with an inspection photo, list page number, description, and matching item_name.`,
          },
          {
            role: "user",
            content: [
              { type: "file", file: { file_id: fileId } },
              { type: "text", text: "Parse this home inspection report. Extract every component. You MUST provide cost estimates, lifespan ranges, and maintenance schedules for every single item — no exceptions. Identify all photo pages." },
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
    console.log("Extracted", (parsed.items?.length || 0), "items,", (parsed.photo_map?.length || 0), "photo mappings");

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
