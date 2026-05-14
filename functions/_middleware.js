export async function onRequest(context) {
  const country = context.request.headers.get("cf-ipcountry");

  if (country !== "KR") {
    return new Response("Access denied", {
      status: 403,
    });
  }

  return context.next();
}
