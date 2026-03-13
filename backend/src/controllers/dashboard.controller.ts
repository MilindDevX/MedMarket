import type { Request, Response } from 'express';
import prisma from '../config/prisma.ts';
import { successResponse, errorResponse } from '../utils/response.ts';

/**
 * GET /api/v1/admin/dashboard
 * Returns platform-wide KPIs for the admin dashboard.
 */
export async function getDashboard(req: Request, res: Response) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      storeStats,
      totalConsumers,
      ordersToday,
      revenueToday,
      totalRevenue,
      recentApplications,
      recentOrders,
    ] = await Promise.all([
      // Store counts by status
      prisma.pharmacyStore.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Total consumers
      prisma.user.count({ where: { role: 'consumer', is_active: true } }),

      // Orders placed today
      prisma.order.count({
        where: { created_at: { gte: todayStart } },
      }),

      // Revenue today (sum of total_amount on delivered orders today)
      prisma.order.aggregate({
        where: { status: 'delivered', delivered_at: { gte: todayStart } },
        _sum: { total_amount: true },
      }),

      // All-time revenue
      prisma.order.aggregate({
        where: { status: 'delivered' },
        _sum: { total_amount: true },
      }),

      // 5 most recent pending applications
      prisma.pharmacyStore.findMany({
        where: { status: 'pending' },
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          created_at: true,
          owner: { select: { name: true, email: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),

      // 5 most recent orders
      prisma.order.findMany({
        select: {
          id: true,
          status: true,
          total_amount: true,
          created_at: true,
          consumer: { select: { name: true } },
          store:    { select: { name: true, city: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
    ]);

    // Map groupBy result into a lookup object
    const storeCounts = { pending: 0, approved: 0, rejected: 0, suspended: 0 };
    for (const row of storeStats) {
      storeCounts[row.status as keyof typeof storeCounts] = row._count.id;
    }

    return successResponse(res, {
      stores: {
        total:     Object.values(storeCounts).reduce((a, b) => a + b, 0),
        ...storeCounts,
      },
      consumers:    totalConsumers,
      ordersToday,
      revenueTodayInr:   Number(revenueToday._sum.total_amount ?? 0).toFixed(2),
      totalRevenueInr:   Number(totalRevenue._sum.total_amount ?? 0).toFixed(2),
      recentApplications,
      recentOrders,
    }, 'Dashboard data fetched');
  } catch (err) {
    console.error('getDashboard error:', err);
    return errorResponse(res, 'Something went wrong', 500);
  }
}
