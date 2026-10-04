// Returns a consistent response when no route matches the request.
async function notFound(request, response) {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
  });
}


export default { notFound };
