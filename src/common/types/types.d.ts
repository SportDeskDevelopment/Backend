declare type Simplify<T> = {
  [KeyType in keyof T]: T[KeyType];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};
