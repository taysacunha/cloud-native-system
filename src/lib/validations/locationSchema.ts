import { z } from "zod";

export const locationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  cep: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido. Use o formato XXXXX-XXX")
    .max(9, "CEP inválido"),
  street: z
    .string()
    .trim()
    .min(3, "Rua deve ter pelo menos 3 caracteres")
    .max(200, "Rua muito longa"),
  number: z
    .string()
    .trim()
    .max(10, "Número inválido")
    .optional(),
  complement: z
    .string()
    .trim()
    .max(100, "Complemento muito longo")
    .optional(),
  neighborhood: z
    .string()
    .trim()
    .min(2, "Bairro deve ter pelo menos 2 caracteres")
    .max(100, "Bairro muito longo"),
  city: z
    .string()
    .trim()
    .min(2, "Cidade deve ter pelo menos 2 caracteres")
    .max(100, "Cidade muito longa"),
  state: z
    .string()
    .trim()
    .length(2, "Estado deve ter exatamente 2 caracteres (UF)"),
  location_type: z.enum(["internal", "external"], {
    errorMap: () => ({ message: "Tipo de local inválido" }),
  }),
  shift_config_mode: z.enum(["weekday", "specific_date"]).optional(),
});

export type LocationFormData = z.infer<typeof locationSchema>;
