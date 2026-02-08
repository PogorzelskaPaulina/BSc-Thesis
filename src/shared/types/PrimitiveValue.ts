export type PrimitiveValue<T extends { valueOf: () => unknown }> = ReturnType<T["valueOf"]>;
