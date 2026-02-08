import { Entity } from "../../adapters/models/Entity";

export type PrimitiveEntityValue<T extends Entity<unknown>> = ReturnType<T["toPrimitive"]>;
