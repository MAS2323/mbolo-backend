const jwt = require("jsonwebtoken");

const getUserId = (req) => {
  // Obtener el encabezado de autorización de la solicitud
  const authorizationHeader = req.headers.authorization;

//   Si el encabezado de autorización no está presente, arrojar un error
  if (!authorizationHeader) {
    throw new Error("Authorization header is missing");
  }

//   Separar el token del encabezado de autorización
  const token = authorizationHeader.split(" ")[1];

//   Verificar el token y obtener el ID de usuario
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  return decodedToken.id;
};

module.exports = { getUserId };
