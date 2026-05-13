exports.handler = async function(event) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ""
    };
  }

  const appsScriptUrl = process.env.APPS_SCRIPT_URL;

  if (!appsScriptUrl) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        ok: false,
        error: "Не задана змінна APPS_SCRIPT_URL у Netlify."
      })
    };
  }

  try {
    if (event.httpMethod === "GET") {
      const queryAction = event.queryStringParameters && event.queryStringParameters.action
        ? event.queryStringParameters.action
        : "products";

      const url = appsScriptUrl + "?action=" + encodeURIComponent(queryAction);

      const response = await fetch(url, {
        method: "GET",
        redirect: "follow"
      });

      const text = await response.text();

      return {
        statusCode: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
        body: text
      };
    }

    if (event.httpMethod === "POST") {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: event.body || "{}",
        redirect: "follow"
      });

      const text = await response.text();

      return {
        statusCode: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
        body: text
      };
    }

    return {
      statusCode: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        ok: false,
        error: "Метод не підтримується"
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        ok: false,
        error: error.message || String(error)
      })
    };
  }
};
