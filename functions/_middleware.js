// One canonical host for search engines: bare domain -> www, and keep *.pages.dev copies out of the index.
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === 'aloudedu.com') {
    url.hostname = 'www.aloudedu.com';
    return Response.redirect(url.toString(), 301);
  }
  const response = await next();
  if (url.hostname.endsWith('.pages.dev')) {
    const tagged = new Response(response.body, response);
    tagged.headers.set('X-Robots-Tag', 'noindex');
    return tagged;
  }
  return response;
}
