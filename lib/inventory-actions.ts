'use server';

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
  return persistServerLog(message, data);
}

export async function syncInventoryToDatabase(inputItem: MarketplaceListing) {
  return persistInventoryItem(inputItem);
}

export async function bulkSyncInventoryToDatabase(items: MarketplaceListing[]) {
  return persistBulkInventory(items);
}

export async function deleteInventoryFromDatabase(rawSlug: string) {
  return persistDeleteInventory(rawSlug);
}

export async function getInventoryForEmployee() {
  return fetchEmployeeInventory();
}

export async function resetAndSyncFullInventory(items: MarketplaceListing[]) {
  return persistInventoryReset(items);
}
