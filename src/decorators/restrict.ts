import { PERMISSION_METADATA_KEY } from "../misc/constants";
import { Permission } from "../types/permission";

export function Restrict(permission?: Permission) {
  return function (target: any, propertyKey: string): void {
    Reflect.defineMetadata(
      PERMISSION_METADATA_KEY,
      permission,
      target,
      propertyKey
    );
  };
}
