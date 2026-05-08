import { MigrationSource } from '../../domain/usecases/MigrateData.js';

export type StorageFactory = () => MigrationSource;

export class StorageRegistry {
  private static factories: Map<string, StorageFactory> = new Map();

  static register(name: string, factory: StorageFactory): void {
    this.factories.set(name, factory);
  }

  static get(name: string): MigrationSource {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Storage system '${name}' is not registered.`);
    }
    return factory();
  }

  static getAvailableSystems(): string[] {
    return Array.from(this.factories.keys());
  }
}
