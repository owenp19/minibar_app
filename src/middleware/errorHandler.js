function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: "Endpoint not found",
    path: req.originalUrl
  });
}

function errorHandler(err, req, res, next) {
  console.error("Unexpected error:", err);

  if (res.headersSent) {
    return next(err);
  }

  // Multer errors (file too large, wrong type, etc.)
  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "La imagen excede el tamaño máximo de 2MB.",
      LIMIT_UNEXPECTED_FILE: "Campo de archivo inesperado."
    };
    return res.status(400).json({ error: messages[err.code] || "Error al subir el archivo." });
  }

  // Custom multer fileFilter errors
  if (err.message && err.message.includes("Formato no permitido")) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({
    message: "Internal server error"
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
