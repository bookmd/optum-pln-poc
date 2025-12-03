import { Env } from "./context-env";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Forward the request to the actual API endpoint
  const apiUrl = new URL("/api/token", context.request.url);
  
  const response = await fetch(apiUrl.toString(), {
    method: "POST",
    headers: context.request.headers,
    body: context.request.body,
  });

  return response;
}; 