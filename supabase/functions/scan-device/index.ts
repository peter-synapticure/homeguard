import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { photoPath, homeId } = await req.json();
    if (!photoPath) throw new Error("Missing photoPath");
    if (!homeId) throw new Error("Missing homeId");
    console.log("Scanning device photo:", photoPath, "for home:", homeId);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Download photo from storage
    console.log("Downloading photo from storage...");
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("reports")
      .download(photoPath);

    if (dlErr || !fileData) throw new Error("Failed to download photo: " + (dlErr?.message || "unknown"));
    console.log("Photo downloaded:", (fileData.size / 1024).toFixed(1) + "KB");

    // Convert to base64 for GPT-4o vision
    const arrayBuf = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));
    const mimeType = fileData.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OPENAI_API_KEY not set");

    console.log("Calling GPT-4o vision...");
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + openaiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content: `You are a home device identifier and cost estimator. You analyze photos of home devices, appliances, and systems to extract component information.

Return a JSON object with this exact structure:
{
  "category": one of "Roof/Exterior", "HVAC", "Plumbing", "Electrical", "Appliances", "Structure", "Landscape", "Interior", "Safety",
  "name": string (common name like "Water Heater", "Furnace", "Dishwasher"),
  "manufacturer": string or null,
  "model": string or null,
  "serial": string or null,
  "year_installed": string or null (4-digit year),
  "year_confidence": "exact" or "est" or "unknown",
  "condition": "poor" or "fair" or "functional" or "good",
  "urgency": "critical" or "attention" or "monitor" or "ok",
  "lifespan_min_years": number,
  "lifespan_max_years": number,
  "cost_min": number (USD replacement cost),
  "cost_max": number (USD replacement cost),
  "notes": string or null,
  "deficiencies": [string],
  "recommendations": [string],
  "maintenance": [{"task": string, "frequency_months": number, "estimated_cost": number, "diy": boolean, "season": string or null}]
}

RULES:
1. Read any visible nameplate, label, sticker, or tag to extract manufacturer, model, and serial number. Transcribe exactly what you see.
2. If a manufacture date or installation date is visible, use it. Mark year_confidence as "exact" if clearly stamped, "est" if inferred from serial number format, "unknown" if not visible.
3. Assess condition based on visible wear, rust, discoloration, or damage: "good" = looks new or well-maintained, "functional" = working but showing age, "fair" = notable wear, "poor" = visible damage or deterioration.
4. urgency: "ok" for good/functional items, "monitor" for fair items, "attention" for aging items past typical lifespan, "critical" only for visible safety hazards.
5. COST ESTIMATES ARE REQUIRED. Use national average replacement costs in USD. Never leave as null or 0.
6. LIFESPAN IS REQUIRED. Use industry standard expected useful life ranges.
7. MAINTENANCE IS REQUIRED. Include at least one maintenance task with realistic frequency and cost.
8. deficiencies: only include if you can see a clear problem in the photo. Otherwise empty array.
9. recommendations: include practical advice based on what you see. Can be empty if device looks fine.
10. If the photo is unclear or doesn't show a home device, still return your best guess with notes explaining uncertainty.`,
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
              { type: "text", text: "Identify this home device. Extract all visible information from any nameplates, labels, or tags. Provide cost estimates, lifespan, and maintenance schedule." },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error("OpenAI error:", errBody);
      throw new Error("OpenAI API error: " + openaiRes.status);
    }

    const openaiData = await openaiRes.json();
    console.log("GPT-4o responded, tokens:", openaiData.usage?.total_tokens);

    const rawText = openaiData.choices[0]?.message?.content;
    if (!rawText) throw new Error("No content in OpenAI response");

    const device = JSON.parse(rawText);
    console.log("Identified device:", device.name, "by", device.manufacturer);

    return new Response(
      JSON.stringify({ status: "SUCCESS", device, photoPath }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Scan error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
