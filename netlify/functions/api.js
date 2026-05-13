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
  const adminPin = process.env.ADMIN_PIN || "2580";
  const apiSecret = process.env.API_SECRET || "CHANGE_ME_12345";

  if (!appsScriptUrl) {
    return jsonResponse(500, corsHeaders, {
      ok: false,
      error: "Не задана змінна APPS_SCRIPT_URL у Netlify."
    });
  }

  try {
    if (event.httpMethod === "GET") {
      const action = event.queryStringParameters && event.queryStringParameters.action
        ? event.queryStringParameters.action
        : "products";

      const url = appsScriptUrl + "?action=" + encodeURIComponent(action);

      const response = await fetch(url, {
        method: "GET",
        redirect: "follow"
      });

      const text = await response.text();

      return {
        statusCode: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8"
        },
        body: text
      };
    }

    if (event.httpMethod === "POST") {
      let body = {};

      try {
        body = JSON.parse(event.body || "{}");
      } catch (error) {
        return jsonResponse(400, corsHeaders, {
          ok: false,
          error: "Некоректний JSON."
        });
      }

      if (body.action === "updateStock") {
        const pin = String(body.pin || "").trim();

        if (!pin || pin !== adminPin) {
          return jsonResponse(403, corsHeaders, {
            ok: false,
            error: "Невірний PIN-код."
          });
        }

        delete body.pin;
        body.apiSecret = apiSecret;
      }

      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        redirect: "follow"
      });

      const text = await response.text();

      return {
        statusCode: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8"
        },
        body: text
      };
    }

    return jsonResponse(405, corsHeaders, {
      ok: false,
      error: "Метод не підтримується."
    });

  } catch (error) {
    return jsonResponse(500, corsHeaders, {
      ok: false,
      error: error.message || String(error)
    });
  }
};

function jsonResponse(statusCode, headers, data) {
  return {
    statusCode,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(data)
  };
}
