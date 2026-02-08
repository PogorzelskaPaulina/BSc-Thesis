export const transformToPrimitive = (data: any) => {
  const obj: Record<string, unknown> = {};

  Object.keys(data).forEach((key) => {
    switch (typeof data[key]) {
      case "undefined":
        break;
      case "object":
        obj[key] =
          data[key] === null ? data[key] : (data[key] as { valueOf: () => unknown }).valueOf();
        break;
      default:
        obj[key] = (data[key] as { valueOf: () => unknown }).valueOf();
        break;
    }
  });

  return obj;
};
