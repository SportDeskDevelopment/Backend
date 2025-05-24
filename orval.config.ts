import { defineConfig, Options } from "orval";

const common: Partial<Options["output"]> = {
  mode: "single",
  client: "zod",
  prettier: true,
  override: {
    zod: {
      coerce: {
        query: true,
      },
      generate: {
        query: true,
        response: true,
        param: true,
        header: true,
        body: true,
      },
    },
  },
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
  training: {
    input: "../contracts/training.yaml",
    output: {
      target: "./src/training/dto/schemas.ts",
      schemas: "./src/training/dto/objects",
      ...common,
    },
  },
});
