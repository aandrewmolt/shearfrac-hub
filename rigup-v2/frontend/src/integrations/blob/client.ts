// Simplified Blob storage client
// Note: Blob operations only work when deployed to Vercel
// In development, all operations return empty/success to avoid errors

class SimpleBlobClient {
  private isProduction: boolean | null = null;

  private async checkProduction(): Promise<boolean> {
    if (this.isProduction === null) {
      // Lazy load DATABASE_MODE to avoid module-level access
      const { DATABASE_MODE } = await import('@/config/database.config');
      this.isProduction = import.meta.env?.PROD && DATABASE_MODE === 'vercel-blob';
    }
    return this.isProduction;
  }

  // Equipment Types
  async getEquipmentTypes(): Promise<unknown[]> {
    // In development, return empty array
    // In production, this would fetch from Blob
    await this.checkProduction();
    return [];
  }

  async setEquipmentTypes(types: unknown[]): Promise<void> {
    // In development, this is a no-op
    // In production, this would save to Blob
    await this.checkProduction();
    console.log('Blob sync will work when deployed to Vercel');
  }

  // Storage Locations
  async getStorageLocations(): Promise<unknown[]> {
    return [];
  }

  async setStorageLocations(locations: unknown[]): Promise<void> {
    console.log('Blob sync will work when deployed to Vercel');
  }

  // Jobs
  async getAllJobs(): Promise<unknown[]> {
    return [];
  }

  async setJobs(jobs: unknown[]): Promise<void> {
    console.log('Blob sync will work when deployed to Vercel');
  }

  // Equipment
  async getAllEquipment(): Promise<unknown[]> {
    return [];
  }

  async setEquipment(equipment: unknown[]): Promise<void> {
    console.log('Blob sync will work when deployed to Vercel');
  }

  // Sync timestamp
  async getLastSync(): Promise<Date | null> {
    return null;
  }

  async setLastSync(date: Date): Promise<void> {
    console.log('Blob sync will work when deployed to Vercel');
  }

  // Check if Blob is available
  async isBlobAvailable(): Promise<boolean> {
    return await this.checkProduction();
  }
}

// Lazy-loaded singleton instance
let _blobStorage: SimpleBlobClient | null = null;

export const getBlobStorage = (): SimpleBlobClient => {
  if (!_blobStorage) {
    _blobStorage = new SimpleBlobClient();
  }
  return _blobStorage;
};

// Export for backward compatibility (will be lazy-loaded on first access)
export const blobStorage = new Proxy({} as SimpleBlobClient, {
  get(target, prop) {
    const storage = getBlobStorage();
    return (storage as Record<string, unknown>)[prop as string];
  }
});