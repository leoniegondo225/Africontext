import type { Proof } from "./types";

export const PROOFS: Record<string, Proof> = {
  "wave-checkout-api": {
    prompt: "Ajoute un paiement Wave dans ma route Next.js /api/pay.",
    model: "Claude Sonnet, Cursor (agent)",
    without: `export async function POST(req: Request) {
  const { phone, amount } = await req.json();
  const res = await fetch("https://api.wave.com/v1/pay", {
    method: "POST",
    headers: { "X-API-KEY": process.env.WAVE_KEY },
    body: JSON.stringify({
      phone_number: phone,
      amount: amount.toFixed(2),
      currency: "FCFA",
    }),
  });
  const { payment_url } = await res.json();
  return Response.redirect(payment_url);
}`,
    withContext: `export async function POST(req: Request) {
  const { orderId, amount } = await req.json();
  const res = await fetch("https://api.wave.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.WAVE_API_KEY,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      amount: String(amount),
      currency: "XOF",
      client_reference: orderId,
      success_url: APP_URL + "/paiement/succes",
      error_url: APP_URL + "/paiement/erreur",
    }),
  });
  const { wave_launch_url } = await res.json();
  return Response.redirect(wave_launch_url);
}`,
    inventions: [
      { text: "https://api.wave.com/v1/pay", note: "Endpoint inexistant" },
      { text: '"X-API-KEY"', note: "Header inventé" },
      { text: "phone_number", note: "Champ inconnu" },
      { text: "amount.toFixed(2)", note: "Décimales refusées en XOF" },
      { text: '"FCFA"', note: "Devise invalide" },
      { text: "payment_url", note: "Champ absent de la réponse" },
    ],
    fixes: [
      "https://api.wave.com/v1/checkout/sessions",
      "Authorization",
      "Idempotency-Key",
      "String(amount)",
      '"XOF"',
      "client_reference",
      "success_url",
      "error_url",
      "wave_launch_url",
    ],
    withoutResult: "404 Not Found",
    withResult: "200 OK · session cos-18qq5z…",
    variants: {
      python: {
        prompt: "Ajoute un paiement Wave dans ma vue Django /pay.",
        without: `def pay(request):
    data = json.loads(request.body)
    res = requests.post(
        "https://api.wave.com/v1/pay",
        headers={"X-API-KEY": os.environ["WAVE_KEY"]},
        json={
            "phone_number": data["phone"],
            "amount": f"{data['amount']:.2f}",
            "currency": "FCFA",
        },
    )
    return redirect(res.json()["payment_url"])`,
        withContext: `def pay(request):
    data = json.loads(request.body)
    res = requests.post(
        "https://api.wave.com/v1/checkout/sessions",
        headers={
            "Authorization": "Bearer " + os.environ["WAVE_API_KEY"],
            "Idempotency-Key": str(uuid.uuid4()),
        },
        json={
            "amount": str(data["amount"]),
            "currency": "XOF",
            "client_reference": data["order_id"],
            "success_url": APP_URL + "/paiement/succes",
            "error_url": APP_URL + "/paiement/erreur",
        },
    )
    return redirect(res.json()["wave_launch_url"])`,
        inventions: [
          { text: "https://api.wave.com/v1/pay", note: "Endpoint inexistant" },
          { text: '"X-API-KEY"', note: "Header inventé" },
          { text: '"phone_number"', note: "Champ inconnu" },
          { text: ":.2f", note: "Décimales refusées en XOF" },
          { text: '"FCFA"', note: "Devise invalide" },
          { text: '"payment_url"', note: "Champ absent de la réponse" },
        ],
        fixes: [
          "https://api.wave.com/v1/checkout/sessions",
          '"Authorization"',
          '"Idempotency-Key"',
          'str(data["amount"])',
          '"XOF"',
          '"client_reference"',
          '"success_url"',
          '"error_url"',
          '"wave_launch_url"',
        ],
      },
      php: {
        prompt: "Ajoute un paiement Wave dans mon contrôleur Laravel.",
        without: `public function pay(Request $request)
{
    $res = Http::withHeaders(["X-API-KEY" => env("WAVE_KEY")])
        ->post("https://api.wave.com/v1/pay", [
            "phone_number" => $request->phone,
            "amount" => number_format($request->amount, 2),
            "currency" => "FCFA",
        ]);
    return redirect($res["payment_url"]);
}`,
        withContext: `public function pay(Request $request)
{
    $res = Http::withToken(config("services.wave.key"))
        ->withHeaders(["Idempotency-Key" => (string) Str::uuid()])
        ->post("https://api.wave.com/v1/checkout/sessions", [
            "amount" => (string) $request->amount,
            "currency" => "XOF",
            "client_reference" => $request->order_id,
            "success_url" => config("app.url") . "/paiement/succes",
            "error_url" => config("app.url") . "/paiement/erreur",
        ]);
    return redirect($res["wave_launch_url"]);
}`,
        inventions: [
          { text: "https://api.wave.com/v1/pay", note: "Endpoint inexistant" },
          { text: '"X-API-KEY"', note: "Header inventé" },
          { text: '"phone_number"', note: "Champ inconnu" },
          { text: "number_format($request->amount, 2)", note: "Décimales refusées en XOF" },
          { text: '"FCFA"', note: "Devise invalide" },
          { text: '"payment_url"', note: "Champ absent de la réponse" },
        ],
        fixes: [
          "withToken",
          '"Idempotency-Key"',
          "https://api.wave.com/v1/checkout/sessions",
          "(string) $request->amount",
          '"XOF"',
          '"client_reference"',
          '"success_url"',
          '"error_url"',
          '"wave_launch_url"',
        ],
      },
      cpp: {
        prompt: "Ajoute un paiement Wave dans mon backend C++ (cpr).",
        without: `auto res = cpr::Post(
    cpr::Url{"https://api.wave.com/v1/pay"},
    cpr::Header{{"X-API-KEY", std::getenv("WAVE_KEY")}},
    cpr::Body{json{
        {"phone_number", phone},
        {"amount", std::format("{:.2f}", amount)},
        {"currency", "FCFA"},
    }.dump()});
auto url = json::parse(res.text)["payment_url"].get<std::string>();`,
        withContext: `auto res = cpr::Post(
    cpr::Url{"https://api.wave.com/v1/checkout/sessions"},
    cpr::Header{
        {"Authorization", "Bearer " + env("WAVE_API_KEY")},
        {"Content-Type", "application/json"},
        {"Idempotency-Key", uuid4()},
    },
    cpr::Body{json{
        {"amount", std::to_string(amount)},
        {"currency", "XOF"},
        {"client_reference", orderId},
        {"success_url", appUrl + "/paiement/succes"},
        {"error_url", appUrl + "/paiement/erreur"},
    }.dump()});
auto url = json::parse(res.text)["wave_launch_url"].get<std::string>();`,
        inventions: [
          { text: "https://api.wave.com/v1/pay", note: "Endpoint inexistant" },
          { text: '"X-API-KEY"', note: "Header inventé" },
          { text: '"phone_number"', note: "Champ inconnu" },
          { text: '"{:.2f}"', note: "Décimales refusées en XOF" },
          { text: '"FCFA"', note: "Devise invalide" },
          { text: '"payment_url"', note: "Champ absent de la réponse" },
        ],
        fixes: [
          "https://api.wave.com/v1/checkout/sessions",
          '"Authorization"',
          '"Idempotency-Key"',
          "std::to_string(amount)",
          '"XOF"',
          '"client_reference"',
          '"success_url"',
          '"error_url"',
          '"wave_launch_url"',
        ],
      },
    },
  },
  "orange-money-webpay": {
    prompt: "Intègre Orange Money Web Payment au Sénégal dans mon backend Node.",
    model: "GPT-4o, Cursor",
    without: `const token = await fetch("https://api.orange.com/oauth/v2/token", {
  method: "POST",
  body: JSON.stringify({ client_id, client_secret }),
});
const pay = await fetch("https://api.orange.com/orange-money/v1/payment", {
  method: "POST",
  body: JSON.stringify({ phone_number: "+221770000000", amount: 5000, currency: "XOF" }),
});`,
    withContext: `const token = await fetch("https://api.orange.com/oauth/v3/token", {
  method: "POST",
  headers: { Authorization: "Basic " + basic, "Content-Type": "application/x-www-form-urlencoded" },
  body: "grant_type=client_credentials",
});
const pay = await fetch("https://api.orange.com/orange-money-webpay/dev/v1/webpayment", {
  method: "POST",
  headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
  body: JSON.stringify({ merchant_key, currency: "OUV", order_id, amount: 5000, return_url, cancel_url, notif_url, lang: "fr", reference: "Boutique" }),
});`,
    inventions: [
      { text: "oauth/v2/token", note: "Version obsolète" },
      { text: "JSON.stringify({ client_id, client_secret })", note: "Identifiants dans le corps" },
      { text: "orange-money/v1/payment", note: "Endpoint inexistant" },
      { text: "phone_number", note: "Champ inconnu" },
    ],
    fixes: ["oauth/v3/token", "grant_type=client_credentials", "orange-money-webpay/dev/v1/webpayment", "merchant_key", '"OUV"', "notif_url"],
    withoutResult: "404 Resource not found",
    withResult: "201 Created · pay_token reçu",
    variants: {
      python: {
        prompt: "Intègre Orange Money Web Payment au Sénégal dans mon backend Python.",
        without: `token = requests.post(
    "https://api.orange.com/oauth/v2/token",
    json={"client_id": client_id, "client_secret": client_secret},
)
pay = requests.post(
    "https://api.orange.com/orange-money/v1/payment",
    json={"phone_number": "+221770000000", "amount": 5000, "currency": "XOF"},
)`,
        withContext: `token = requests.post(
    "https://api.orange.com/oauth/v3/token",
    headers={"Authorization": "Basic " + basic},
    data={"grant_type": "client_credentials"},
)
pay = requests.post(
    "https://api.orange.com/orange-money-webpay/dev/v1/webpayment",
    headers={"Authorization": "Bearer " + access_token},
    json={"merchant_key": merchant_key, "currency": "OUV", "order_id": order_id, "amount": 5000,
          "return_url": return_url, "cancel_url": cancel_url, "notif_url": notif_url, "lang": "fr", "reference": "Boutique"},
)`,
        inventions: [
          { text: "oauth/v2/token", note: "Version obsolète" },
          { text: 'json={"client_id": client_id, "client_secret": client_secret}', note: "Identifiants dans le corps" },
          { text: "orange-money/v1/payment", note: "Endpoint inexistant" },
          { text: '"phone_number"', note: "Champ inconnu" },
        ],
        fixes: ["oauth/v3/token", '"grant_type": "client_credentials"', "orange-money-webpay/dev/v1/webpayment", '"merchant_key"', '"OUV"', '"notif_url"'],
      },
      php: {
        prompt: "Intègre Orange Money Web Payment au Sénégal dans mon backend PHP.",
        without: `$token = $http->post("https://api.orange.com/oauth/v2/token", [
    "json" => ["client_id" => $clientId, "client_secret" => $clientSecret],
]);
$pay = $http->post("https://api.orange.com/orange-money/v1/payment", [
    "json" => ["phone_number" => "+221770000000", "amount" => 5000, "currency" => "XOF"],
]);`,
        withContext: `$token = $http->post("https://api.orange.com/oauth/v3/token", [
    "headers" => ["Authorization" => "Basic " . $basic],
    "form_params" => ["grant_type" => "client_credentials"],
]);
$pay = $http->post("https://api.orange.com/orange-money-webpay/dev/v1/webpayment", [
    "headers" => ["Authorization" => "Bearer " . $accessToken],
    "json" => ["merchant_key" => $merchantKey, "currency" => "OUV", "order_id" => $orderId, "amount" => 5000,
        "return_url" => $returnUrl, "cancel_url" => $cancelUrl, "notif_url" => $notifUrl, "lang" => "fr", "reference" => "Boutique"],
]);`,
        inventions: [
          { text: "oauth/v2/token", note: "Version obsolète" },
          { text: '"json" => ["client_id" => $clientId, "client_secret" => $clientSecret]', note: "Identifiants dans le corps" },
          { text: "orange-money/v1/payment", note: "Endpoint inexistant" },
          { text: '"phone_number"', note: "Champ inconnu" },
        ],
        fixes: ["oauth/v3/token", '"grant_type" => "client_credentials"', "orange-money-webpay/dev/v1/webpayment", '"merchant_key"', '"OUV"', '"notif_url"'],
      },
      cpp: {
        prompt: "Intègre Orange Money Web Payment au Sénégal dans mon backend C++.",
        without: `auto token = cpr::Post(
    cpr::Url{"https://api.orange.com/oauth/v2/token"},
    cpr::Body{json{{"client_id", clientId}, {"client_secret", clientSecret}}.dump()});
auto pay = cpr::Post(
    cpr::Url{"https://api.orange.com/orange-money/v1/payment"},
    cpr::Body{json{{"phone_number", "+221770000000"}, {"amount", 5000}, {"currency", "XOF"}}.dump()});`,
        withContext: `auto token = cpr::Post(
    cpr::Url{"https://api.orange.com/oauth/v3/token"},
    cpr::Header{{"Authorization", "Basic " + basic}},
    cpr::Payload{{"grant_type", "client_credentials"}});
auto pay = cpr::Post(
    cpr::Url{"https://api.orange.com/orange-money-webpay/dev/v1/webpayment"},
    cpr::Header{{"Authorization", "Bearer " + accessToken}, {"Content-Type", "application/json"}},
    cpr::Body{json{{"merchant_key", merchantKey}, {"currency", "OUV"}, {"order_id", orderId}, {"amount", 5000},
                   {"return_url", returnUrl}, {"cancel_url", cancelUrl}, {"notif_url", notifUrl}, {"lang", "fr"}, {"reference", "Boutique"}}.dump()});`,
        inventions: [
          { text: "oauth/v2/token", note: "Version obsolète" },
          { text: 'json{{"client_id", clientId}, {"client_secret", clientSecret}}', note: "Identifiants dans le corps" },
          { text: "orange-money/v1/payment", note: "Endpoint inexistant" },
          { text: '"phone_number"', note: "Champ inconnu" },
        ],
        fixes: ["oauth/v3/token", '{"grant_type", "client_credentials"}', "orange-money-webpay/dev/v1/webpayment", '"merchant_key"', '"OUV"', '"notif_url"'],
      },
    },
  },
  "fedapay-transactions": {
    prompt: "Crée un lien de paiement FedaPay pour une commande de 2500 XOF.",
    model: "Claude Sonnet, Claude Code",
    without: `const res = await fetch("https://api.fedapay.com/v1/payments", {
  method: "POST",
  headers: { Authorization: "Bearer " + key },
  body: JSON.stringify({ amount: 250000, currency: "XOF" }),
});
const { payment_url } = await res.json();`,
    withContext: `const created = await fetch(BASE + "/transactions", {
  method: "POST",
  headers,
  body: JSON.stringify({ description: "Commande 42", amount: 2500, currency: { iso: "XOF" } }),
});
const tx = (await created.json())["v1/transaction"];
const { url } = await (await fetch(BASE + "/transactions/" + tx.id + "/token", { method: "POST", headers })).json();`,
    inventions: [
      { text: "/v1/payments", note: "Endpoint inexistant" },
      { text: "250000", note: "Multiplié par 100 à tort" },
      { text: 'currency: "XOF"', note: "Doit être un objet" },
      { text: "payment_url", note: "Champ inconnu" },
    ],
    fixes: ["/transactions", "amount: 2500", 'currency: { iso: "XOF" }', '["v1/transaction"]', "/token"],
    withoutResult: "404 Not Found",
    withResult: "200 OK · url de paiement",
    variants: {
      python: {
        prompt: "Crée un lien de paiement FedaPay pour une commande de 2500 XOF, en Python.",
        without: `res = requests.post(
    "https://api.fedapay.com/v1/payments",
    headers={"Authorization": "Bearer " + key},
    json={"amount": 250000, "currency": "XOF"},
)
payment_url = res.json()["payment_url"]`,
        withContext: `created = requests.post(
    BASE + "/transactions",
    headers=headers,
    json={"description": "Commande 42", "amount": 2500, "currency": {"iso": "XOF"}},
)
tx = created.json()["v1/transaction"]
url = requests.post(f"{BASE}/transactions/{tx['id']}/token", headers=headers).json()["url"]`,
        inventions: [
          { text: "/v1/payments", note: "Endpoint inexistant" },
          { text: "250000", note: "Multiplié par 100 à tort" },
          { text: '"currency": "XOF"', note: "Doit être un objet" },
          { text: '"payment_url"', note: "Champ inconnu" },
        ],
        fixes: ["/transactions", '"amount": 2500', '"currency": {"iso": "XOF"}', '["v1/transaction"]', "/token"],
      },
      php: {
        prompt: "Crée un lien de paiement FedaPay pour une commande de 2500 XOF, en PHP.",
        without: `$res = $http->post("https://api.fedapay.com/v1/payments", [
    "headers" => ["Authorization" => "Bearer " . $key],
    "json" => ["amount" => 250000, "currency" => "XOF"],
]);
$paymentUrl = json_decode($res->getBody(), true)["payment_url"];`,
        withContext: `$created = $http->post($base . "/transactions", [
    "headers" => $headers,
    "json" => ["description" => "Commande 42", "amount" => 2500, "currency" => ["iso" => "XOF"]],
]);
$tx = json_decode($created->getBody(), true)["v1/transaction"];
$token = $http->post($base . "/transactions/" . $tx["id"] . "/token", ["headers" => $headers]);
$url = json_decode($token->getBody(), true)["url"];`,
        inventions: [
          { text: "/v1/payments", note: "Endpoint inexistant" },
          { text: "250000", note: "Multiplié par 100 à tort" },
          { text: '"currency" => "XOF"', note: "Doit être un objet" },
          { text: '"payment_url"', note: "Champ inconnu" },
        ],
        fixes: ["/transactions", '"amount" => 2500', '"currency" => ["iso" => "XOF"]', '["v1/transaction"]', "/token"],
      },
      cpp: {
        prompt: "Crée un lien de paiement FedaPay pour une commande de 2500 XOF, en C++.",
        without: `auto res = cpr::Post(
    cpr::Url{"https://api.fedapay.com/v1/payments"},
    cpr::Header{{"Authorization", "Bearer " + key}},
    cpr::Body{json{{"amount", 250000}, {"currency", "XOF"}}.dump()});
auto paymentUrl = json::parse(res.text)["payment_url"];`,
        withContext: `auto created = cpr::Post(
    cpr::Url{base + "/transactions"},
    headers,
    cpr::Body{json{{"description", "Commande 42"}, {"amount", 2500}, {"currency", {{"iso", "XOF"}}}}.dump()});
auto tx = json::parse(created.text)["v1/transaction"];
auto token = cpr::Post(cpr::Url{base + "/transactions/" + std::to_string(tx["id"].get<long>()) + "/token"}, headers);
auto url = json::parse(token.text)["url"];`,
        inventions: [
          { text: "/v1/payments", note: "Endpoint inexistant" },
          { text: "250000", note: "Multiplié par 100 à tort" },
          { text: '{"currency", "XOF"}', note: "Doit être un objet" },
          { text: '"payment_url"', note: "Champ inconnu" },
        ],
        fixes: ["/transactions", '{"amount", 2500}', '{"currency", {{"iso", "XOF"}}}', '["v1/transaction"]', "/token"],
      },
    },
  },
  "mtn-momo-collection": {
    prompt: "Demande un paiement MTN MoMo de 100 sur le numéro du client (sandbox).",
    model: "Claude Sonnet, Cursor",
    without: `await fetch("https://sandbox.momodeveloper.mtn.com/collection/v1/payments", {
  method: "POST",
  headers: { Authorization: "Bearer " + token },
  body: JSON.stringify({ amount: 100, currency: "XOF", phone: msisdn }),
});`,
    withContext: `await fetch("https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay", {
  method: "POST",
  headers: { Authorization: "Bearer " + token, "X-Reference-Id": referenceId, "X-Target-Environment": "sandbox", "Ocp-Apim-Subscription-Key": key },
  body: JSON.stringify({ amount: "100", currency: "EUR", externalId: referenceId, payer: { partyIdType: "MSISDN", partyId: msisdn } }),
});`,
    inventions: [
      { text: "collection/v1/payments", note: "Endpoint inexistant" },
      { text: '"XOF"', note: "Sandbox : EUR uniquement" },
      { text: "phone: msisdn", note: "Champ inconnu" },
    ],
    fixes: ["collection/v1_0/requesttopay", "X-Reference-Id", "X-Target-Environment", "Ocp-Apim-Subscription-Key", '"EUR"', "partyIdType"],
    withoutResult: "404 Resource Not Found",
    withResult: "202 Accepted",
    variants: {
      python: {
        prompt: "Demande un paiement MTN MoMo de 100 sur le numéro du client (sandbox), en Python.",
        without: `requests.post(
    "https://sandbox.momodeveloper.mtn.com/collection/v1/payments",
    headers={"Authorization": "Bearer " + token},
    json={"amount": 100, "currency": "XOF", "phone": msisdn},
)`,
        withContext: `requests.post(
    "https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay",
    headers={
        "Authorization": "Bearer " + token,
        "X-Reference-Id": reference_id,
        "X-Target-Environment": "sandbox",
        "Ocp-Apim-Subscription-Key": key,
    },
    json={"amount": "100", "currency": "EUR", "externalId": reference_id,
          "payer": {"partyIdType": "MSISDN", "partyId": msisdn}},
)`,
        inventions: [
          { text: "collection/v1/payments", note: "Endpoint inexistant" },
          { text: '"XOF"', note: "Sandbox : EUR uniquement" },
          { text: '"phone": msisdn', note: "Champ inconnu" },
        ],
        fixes: ["collection/v1_0/requesttopay", "X-Reference-Id", "X-Target-Environment", "Ocp-Apim-Subscription-Key", '"EUR"', "partyIdType"],
      },
      php: {
        prompt: "Demande un paiement MTN MoMo de 100 sur le numéro du client (sandbox), en PHP.",
        without: `$http->post("https://sandbox.momodeveloper.mtn.com/collection/v1/payments", [
    "headers" => ["Authorization" => "Bearer " . $token],
    "json" => ["amount" => 100, "currency" => "XOF", "phone" => $msisdn],
]);`,
        withContext: `$http->post("https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay", [
    "headers" => [
        "Authorization" => "Bearer " . $token,
        "X-Reference-Id" => $referenceId,
        "X-Target-Environment" => "sandbox",
        "Ocp-Apim-Subscription-Key" => $key,
    ],
    "json" => ["amount" => "100", "currency" => "EUR", "externalId" => $referenceId,
        "payer" => ["partyIdType" => "MSISDN", "partyId" => $msisdn]],
]);`,
        inventions: [
          { text: "collection/v1/payments", note: "Endpoint inexistant" },
          { text: '"XOF"', note: "Sandbox : EUR uniquement" },
          { text: '"phone" => $msisdn', note: "Champ inconnu" },
        ],
        fixes: ["collection/v1_0/requesttopay", "X-Reference-Id", "X-Target-Environment", "Ocp-Apim-Subscription-Key", '"EUR"', "partyIdType"],
      },
      cpp: {
        prompt: "Demande un paiement MTN MoMo de 100 sur le numéro du client (sandbox), en C++.",
        without: `cpr::Post(
    cpr::Url{"https://sandbox.momodeveloper.mtn.com/collection/v1/payments"},
    cpr::Header{{"Authorization", "Bearer " + token}},
    cpr::Body{json{{"amount", 100}, {"currency", "XOF"}, {"phone", msisdn}}.dump()});`,
        withContext: `cpr::Post(
    cpr::Url{"https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay"},
    cpr::Header{
        {"Authorization", "Bearer " + token},
        {"X-Reference-Id", referenceId},
        {"X-Target-Environment", "sandbox"},
        {"Ocp-Apim-Subscription-Key", key},
        {"Content-Type", "application/json"},
    },
    cpr::Body{json{{"amount", "100"}, {"currency", "EUR"}, {"externalId", referenceId},
                   {"payer", {{"partyIdType", "MSISDN"}, {"partyId", msisdn}}}}.dump()});`,
        inventions: [
          { text: "collection/v1/payments", note: "Endpoint inexistant" },
          { text: '"XOF"', note: "Sandbox : EUR uniquement" },
          { text: '{"phone", msisdn}', note: "Champ inconnu" },
        ],
        fixes: ["collection/v1_0/requesttopay", "X-Reference-Id", "X-Target-Environment", "Ocp-Apim-Subscription-Key", '"EUR"', "partyIdType"],
      },
    },
  },
  "paystack-transactions": {
    prompt: "Initialise un paiement Paystack de 5 000 NGN.",
    model: "GPT-4o, Cursor",
    without: `const res = await fetch("https://api.paystack.co/charge/initialize", {
  method: "POST",
  headers: { Authorization: "Bearer " + key },
  body: JSON.stringify({ email, amount: 5000 }),
});`,
    withContext: `const res = await fetch("https://api.paystack.co/transaction/initialize", {
  method: "POST",
  headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
  body: JSON.stringify({ email, amount: 5000 * 100, reference: crypto.randomUUID() }),
});`,
    inventions: [
      { text: "charge/initialize", note: "Mauvais endpoint" },
      { text: "amount: 5000 }", note: "50 NGN au lieu de 5 000" },
    ],
    fixes: ["transaction/initialize", "5000 * 100", "reference"],
    withoutResult: "Montant facturé : 50 NGN",
    withResult: "200 OK · authorization_url",
    variants: {
      python: {
        prompt: "Initialise un paiement Paystack de 5 000 NGN, en Python.",
        without: `res = requests.post(
    "https://api.paystack.co/charge/initialize",
    headers={"Authorization": "Bearer " + key},
    json={"email": email, "amount": 5000},
)`,
        withContext: `res = requests.post(
    "https://api.paystack.co/transaction/initialize",
    headers={"Authorization": "Bearer " + key},
    json={"email": email, "amount": 5000 * 100, "reference": str(uuid.uuid4())},
)`,
        inventions: [
          { text: "charge/initialize", note: "Mauvais endpoint" },
          { text: '"amount": 5000}', note: "50 NGN au lieu de 5 000" },
        ],
        fixes: ["transaction/initialize", "5000 * 100", '"reference"'],
      },
      php: {
        prompt: "Initialise un paiement Paystack de 5 000 NGN, en PHP.",
        without: `$res = $http->post("https://api.paystack.co/charge/initialize", [
    "headers" => ["Authorization" => "Bearer " . $key],
    "json" => ["email" => $email, "amount" => 5000],
]);`,
        withContext: `$res = $http->post("https://api.paystack.co/transaction/initialize", [
    "headers" => ["Authorization" => "Bearer " . $key],
    "json" => ["email" => $email, "amount" => 5000 * 100, "reference" => bin2hex(random_bytes(16))],
]);`,
        inventions: [
          { text: "charge/initialize", note: "Mauvais endpoint" },
          { text: '"amount" => 5000]', note: "50 NGN au lieu de 5 000" },
        ],
        fixes: ["transaction/initialize", "5000 * 100", '"reference"'],
      },
      cpp: {
        prompt: "Initialise un paiement Paystack de 5 000 NGN, en C++.",
        without: `auto res = cpr::Post(
    cpr::Url{"https://api.paystack.co/charge/initialize"},
    cpr::Header{{"Authorization", "Bearer " + key}},
    cpr::Body{json{{"email", email}, {"amount", 5000}}.dump()});`,
        withContext: `auto res = cpr::Post(
    cpr::Url{"https://api.paystack.co/transaction/initialize"},
    cpr::Header{{"Authorization", "Bearer " + key}, {"Content-Type", "application/json"}},
    cpr::Body{json{{"email", email}, {"amount", 5000 * 100}, {"reference", uuid4()}}.dump()});`,
        inventions: [
          { text: "charge/initialize", note: "Mauvais endpoint" },
          { text: '{"amount", 5000}}', note: "50 NGN au lieu de 5 000" },
        ],
        fixes: ["transaction/initialize", "5000 * 100", '"reference"'],
      },
    },
  },
};
