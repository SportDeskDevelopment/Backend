import { defineConfig, Options } from "orval";

const common: Partial<Options["output"]> = {
  mode: "single",
  client: "zod",
  prettier: true,
};

export default defineConfig({
  auth: {
    input: "../contracts/auth.yaml",
    output: {
      target: "./src/auth/dto/schemas.ts",
      schemas: "./src/auth/dto/objects",
      ...common,
    },
  },
});
