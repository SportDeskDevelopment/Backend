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
  user: {
    input: "../contracts/user.yaml",
    output: {
      target: "./src/user/dto/schemas.ts",
      schemas: "./src/user/dto/objects",
      ...common,
    },
  },
  trainer: {
    input: "../contracts/trainer.yaml",
    output: {
      target: "./src/trainer/dto/schemas.ts",
      schemas: "./src/trainer/dto/objects",
      ...common,
    },
  },
});
