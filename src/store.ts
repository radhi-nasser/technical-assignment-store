import "reflect-metadata";

import { ReadNotAllowedError, WriteNotAllowedError } from "./misc/errors";
import { JSONObject } from "./types/json";
import { PERMISSION_METADATA_KEY } from "./misc/constants";
import { isFunction, isObject } from "./misc/utils";
import { IStore, StoreResult, StoreValue } from "./types/store";
import { Permission } from "./types/permission";

export class Store implements IStore {
  defaultPolicy: Permission = "rw";

  private getPermission(key: string) {
    return (
      Reflect.getMetadata(PERMISSION_METADATA_KEY, this, key) ||
      this.defaultPolicy
    );
  }

  allowedToRead(key: string): boolean {
    return ["r", "rw"].includes(this.getPermission(key));
  }

  allowedToWrite(key: string): boolean {
    return ["w", "rw"].includes(this.getPermission(key));
  }

  read(path: string): StoreResult {
    const [key, ...rest] = path.split(":");

    // @ts-ignore
    const value = this[key];

    if (this.allowedToRead(key)) {
      if (rest.length > 0) {
        return isFunction(value)
          ? value().read(rest.join(":"))
          : value.read(rest.join(":"));
      } else {
        return isFunction(value) ? value() : value;
      }
    }

    throw new ReadNotAllowedError();
  }

  write(path: string, value: StoreValue): StoreValue {
    if (isObject(value)) {
      // @ts-ignore
      if (!this[path]) {
        // @ts-ignore
        this[path] = new Store();
      }
      // @ts-ignore
      this[path].writeEntries(value);

      return;
    }

    const [key, ...rest] = path.split(":");

    if (this.allowedToWrite(key)) {
      if (rest.length > 0) {
        // @ts-ignore
        if (!this[key]) {
          // @ts-ignore
          this[key] = new Store();
        }
        // @ts-ignore
        return this[key].write(rest.join(":"), value);
      } else {
        // @ts-ignore
        this[key] = value;
        return value;
      }
    }

    throw new WriteNotAllowedError();
  }

  private getFormattedElementsToWrite(
    entries: JSONObject
  ): { path: string; value: StoreValue }[] {
    return Object.keys(entries)
      .map((key) => {
        if (isObject(entries[key])) {
          // @ts-ignore
          return this.getFormattedElementsToWrite(entries[key]).map(
            (element) => ({
              path: `${key}:${element.path}`,
              value: element.value,
            })
          );
        } else {
          return { path: key, value: entries[key] };
        }
      })
      .flat();
  }

  writeEntries(entries: JSONObject): void {
    this.getFormattedElementsToWrite(entries).forEach((element) => {
      this.write(element.path, element.value);
    });
  }

  entries(): JSONObject {
    return Object.keys(this)
      .filter((property) => this.allowedToRead(property))
      .reduce((result, key) => {
        // @ts-ignore
        result[key] = this[key];
        return result;
      }, {});
  }
}
