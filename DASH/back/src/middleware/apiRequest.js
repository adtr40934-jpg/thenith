// Allow all requests without blocking
async function blockDocumentRequests(request, response, next) {
  next();
}

export default { blockDocumentRequests };
