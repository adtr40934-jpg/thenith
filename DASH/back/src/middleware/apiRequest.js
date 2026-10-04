// Blocks direct document navigation to API endpoints while allowing fetch/XHR requests.
async function blockDocumentRequests(request, response, next) {
  if (!request.path.startsWith("/api/") || request.path === "/api/health") {
    return next();
  }

  if (request.headers["sec-fetch-dest"] === "document") {
    return response.status(403).json({
      error: "Forbidden",
    });
  }

  next();
}


export default { blockDocumentRequests };
