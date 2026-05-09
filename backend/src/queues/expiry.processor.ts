/**
 * expiry.processor.ts
 *
 * Core business logic for the nightly expiry notification job.
 * Deliberately kept separate from queue wiring so it can be:
 *   - unit-tested without BullMQ/Redis
 *   - triggered manually via the admin API for demo purposes
 *
 * What it does:
 *   1. Finds all active inventory items expiring within 60 days
 *   2. Groups them by pharmacy_owner
 *   3. Creates a single batched in_app Notification per owner per run
 *      (de-duplicated: skips owners already notified today)
 *   4. Returns a summary object for logging / job return value
 */

import prisma from '../config/prisma.ts';
import { createNotification } from '../controllers/notification.controller.ts';

export interface ExpiryJobResult {
  scanned:       number;   // total active inventory items checked
  ownersNotified: number;  // pharmacy owners who received a notification
  skipped:       number;   // owners skipped (already notified today)
  criticalItems: number;   // items expiring within 30 days
  warningItems:  number;   // items expiring in 31-60 days
  ranAt:         string;   // ISO timestamp
}

export async function runExpiryNotificationJob(): Promise<ExpiryJobResult> {
  const now      = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // Threshold dates
  const in30  = new Date(now); in30.setDate(now.getDate() + 30);
  const in60  = new Date(now); in60.setDate(now.getDate() + 60);

  // ── 1. Fetch all at-risk active inventory ──────────────────────────────
  const atRisk = await prisma.storeInventory.findMany({
    where: {
      status:   'active',
      quantity: { gt: 0 },
      exp_date: { lte: in60 },
    },
    include: {
      medicine: { select: { name: true } },
      store: {
        select: {
          id:       true,
          name:     true,
          owner_id: true,
        },
      },
    },
    orderBy: { exp_date: 'asc' },
  });

  // ── 2. Group by owner ──────────────────────────────────────────────────
  type ItemGroup = {
    ownerId:       string;
    storeName:     string;
    criticalItems: Array<{ name: string; daysLeft: number; qty: number }>;
    warningItems:  Array<{ name: string; daysLeft: number; qty: number }>;
  };

  const byOwner = new Map<string, ItemGroup>();

  for (const item of atRisk) {
    const ownerId = item.store.owner_id;
    const daysLeft = Math.floor(
      (new Date(item.exp_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (!byOwner.has(ownerId)) {
      byOwner.set(ownerId, {
        ownerId,
        storeName:     item.store.name,
        criticalItems: [],
        warningItems:  [],
      });
    }

    const group = byOwner.get(ownerId)!;
    const entry = { name: item.medicine.name, daysLeft, qty: item.quantity };

    if (daysLeft <= 30) group.criticalItems.push(entry);
    else                group.warningItems.push(entry);
  }

  // ── 3. De-duplicate: skip owners already notified today ───────────────
  let skipped        = 0;
  let ownersNotified = 0;

  for (const [ownerId, group] of byOwner) {
    const alreadySent = await prisma.notification.findFirst({
      where: {
        recipient_id: ownerId,
        type:         'expiry_alert',
        created_at:   {
          gte: new Date(`${todayStr}T00:00:00.000Z`),
          lte: new Date(`${todayStr}T23:59:59.999Z`),
        },
      },
    });

    if (alreadySent) {
      skipped++;
      continue;
    }

    // ── 4. Build notification message ────────────────────────────────────
    const critCount = group.criticalItems.length;
    const warnCount = group.warningItems.length;
    const total     = critCount + warnCount;

    const title = critCount > 0
      ? `🚨 ${critCount} item${critCount > 1 ? 's' : ''} expiring within 30 days — ${group.storeName}`
      : `⚠️ ${warnCount} item${warnCount > 1 ? 's' : ''} expiring within 60 days — ${group.storeName}`;

    // List up to 5 critical items, then up to 3 warning items in the body
    const lines: string[] = [];

    const topCritical = group.criticalItems.slice(0, 5);
    if (topCritical.length > 0) {
      lines.push('Critical (≤30 days):');
      for (const i of topCritical) {
        lines.push(`  • ${i.name} — ${i.daysLeft}d left, qty ${i.qty}`);
      }
      if (group.criticalItems.length > 5) {
        lines.push(`  … and ${group.criticalItems.length - 5} more`);
      }
    }

    const topWarning = group.warningItems.slice(0, 3);
    if (topWarning.length > 0) {
      lines.push('Warning (31-60 days):');
      for (const i of topWarning) {
        lines.push(`  • ${i.name} — ${i.daysLeft}d left, qty ${i.qty}`);
      }
      if (group.warningItems.length > 3) {
        lines.push(`  … and ${group.warningItems.length - 3} more`);
      }
    }

    lines.push('');
    lines.push(`${total} item${total > 1 ? 's' : ''} total. Review your inventory to discount or return stock before expiry.`);

    const body = lines.join('\n');

    await createNotification(ownerId, 'expiry_alert', title, body);
    ownersNotified++;
  }

  const totalCritical = [...byOwner.values()].reduce((s, g) => s + g.criticalItems.length, 0);
  const totalWarning  = [...byOwner.values()].reduce((s, g) => s + g.warningItems.length,  0);

  return {
    scanned:        atRisk.length,
    ownersNotified,
    skipped,
    criticalItems:  totalCritical,
    warningItems:   totalWarning,
    ranAt:          now.toISOString(),
  };
}
