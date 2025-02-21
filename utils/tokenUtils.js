import jwt from "jsonwebtoken";

const createToken = (_id) => {
  return jwt.sign({ user: { id: _id } }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

export default { createToken };
