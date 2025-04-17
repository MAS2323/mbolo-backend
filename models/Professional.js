import mongoose from "mongoose";

const professionalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    trim: true,
    maxlength: [100, "El nombre no puede exceder los 100 caracteres"],
  },
  email: {
    type: String,
    required: [true, "El correo electrónico es obligatorio"],
    trim: true,
    lowercase: true,
    match: [
      /^\S+@\S+\.\S+$/,
      "Por favor, ingrese un correo electrónico válido",
    ],
  },
  phone_number: {
    type: String,
    required: [true, "El número de teléfono es obligatorio"],
    trim: true,
    match: [
      /^\+?[1-9]\d{1,14}$/,
      "Por favor, ingrese un número de teléfono válido",
    ],
  },
  description: {
    type: String,
    required: [true, "La descripción es obligatoria"],
    trim: true,
    maxlength: [1000, "La descripción no puede exceder los 1000 caracteres"],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "El propietario es obligatorio"],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "La categoría es obligatoria"],
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcategory",
    required: [true, "La subcategoría es obligatoria"],
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: [true, "La dirección es obligatoria"],
  },
  avatar: {
    url: {
      type: String,
      default: null,
    },
    public_id: {
      type: String,
      default: null,
    },
  },
  capitalOwnership: {
    type: String,
    enum: ["Privadas", "Públicas", "Mixtas"],
    required: [true, "La propiedad del capital es obligatoria"],
  },
  companySize: {
    type: String,
    enum: [
      "Microempresa",
      "Pequeña empresa",
      "Mediana empresa",
      "Gran empresa",
    ],
    required: [true, "El tamaño de la empresa es obligatorio"],
  },
  legalForm: {
    type: String,
    enum: [
      "Empresario individual",
      "Sociedad Anónima",
      "Sociedad de Responsabilidad Limitada",
      "Cooperativas",
      "Sociedad Colectiva",
      "Sociedad Comanditaria",
    ],
    required: [true, "La forma jurídica es obligatoria"],
  },
  economicSector: {
    type: String,
    enum: ["Primarias", "Secundarias", "Terciarias", "Cuaternarias"],
    required: [true, "El sector económico es obligatorio"],
  },
  operationScope: {
    type: String,
    enum: ["Locales", "Nacionales", "Multinacionales"],
    required: [true, "El ámbito de actuación es obligatorio"],
  },
  socialCapital: {
    type: String,
    required: [true, "El capital social es obligatorio"],
  },
  numberOfEstablishments: {
    type: Number,
    required: [true, "El número de establecimientos es obligatorio"],
  },
  numberOfEmployees: {
    type: Number,
    required: [true, "El número de empleados es obligatorio"],
  },
  nif: {
    type: String,
    required: [true, "El NIF es obligatorio"],
    trim: true,
  },
  expedientNumber: {
    type: String,
    required: [true, "El número de expediente es obligatorio"],
    trim: true,
  },
  certificateNumber: {
    type: Number,
    required: [true, "El número de certificado es obligatorio"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update `updatedAt` timestamp on save
professionalSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Professional", professionalSchema);
