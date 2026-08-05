'use server';

import { assertInventorySession } from './inventory-auth';
import type { MarketplaceListing } from './inventory-types';
import {
  bulkSyncInventoryToDatabase as persistBulkInventory,
  deleteInventoryFromDatabase as persistDeleteInventory,
  getInventoryForEmployee as fetchEmployeeInventory,
  logToServer as persistServerLog,
  resetAndSyncFullInventory as persistInventoryReset,
  syncInventoryToDatabase as persistInventoryItem,
} from './inventory-persistence';

export async function logToServer(message: string, data?: unknown) {
  await assertInventorySession();
  return persistServerLog(message, data);
}

export async function syncInventoryToDatabase(inputItem: MarketplaceListing) {
  await assertInventorySession();
  return persistInventoryItem(inputItem);
}

export async function bulkSyncInventoryToDatabase(items: MarketplaceListing[]) {
  await assertInventorySession();
  return persistBulkInventory(items);
}

export async function deleteInventoryFromDatabase(rawSlug: string) {
  await assertInventorySession();
  return persistDeleteInventory(rawSlug);
}

export async function getInventoryForEmployee() {
  await assertInventorySession();
  return fetchEmployeeInventory();
}

export async function resetAndSyncFullInventory(items: MarketplaceListing[]) {
  await assertInventorySession();
  return persistInventoryReset(items);
}
