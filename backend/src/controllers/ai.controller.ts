/**
 * MedMarket — AI Controller
 * Handles two AI-powered endpoints:
 *  1. POST /admin/applications/:id/ai-verify  — KYB document verification
 *  2. GET  /ai/pharmacy/ai-insights           — Pharmacy business insights
 *
 * Uses `generateWithFallback` which tries Gemini first, then Groq automatically.
 */
import type { Request, Response } from 'express';
import prisma from '../config/prisma.ts';
import { generateWithFallback, AiUnavailableError, type ImageData } from '../lib/ai.ts';
import { successResponse, errorResponse } from '../utils/response.ts';
import { cloudinary } from '../lib/cloudinary.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Map AiUnavailableError to a friendly HTTP response
// ─────────────────────────────────────────────────────────────────────────────
function handleAiError(res: Response, err: AiUnavailableError) {
  if (err.isQuota) {
    return errorResponse(
      res,
      'AI services are temporarily at capacity. Please try again in a few minutes.',
      503,
    );
  }
  // Config / key missing
  return errorResponse(
    res,
    'AI service is not properly configured on this server. Contact the administrator.',
    503,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature 2: AI KYB — Document Verification
// POST /api/v1/admin/applications/:id/ai-verify
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyPharmacyDocuments(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const store = await prisma.pharmacyStore.findUnique({
      where: { id },
      include: { documents: true } as any,
    }) as any;

    if (!store) return errorResponse(res, 'Application not found', 404);

    // Build Cloudinary URLs for each document
    const docsWithUrls = (store.documents || []).map((doc: any) => {
      const resourceType = doc.mime_type === 'application/pdf' ? 'raw' : 'image';
      const url = doc.s3_key
        ? cloudinary.url(doc.s3_key, { resource_type: resourceType, secure: true })
        : null;
      return { ...doc, url };
    });

    const drugLicenseDoc = docsWithUrls.find((d: any) => d.doc_type === 'drug_license');
    const gstDoc         = docsWithUrls.find((d: any) => d.doc_type === 'gst_certificate');

    if (!drugLicenseDoc?.url && !gstDoc?.url) {
      return errorResponse(res, 'No Drug License or GST Certificate documents found to verify.', 422);
    }

    // Helper: fetch image from Cloudinary URL and convert to base64
    async function fetchImageAsBase64(url: string): Promise<ImageData | null> {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        // PDFs can't be sent inline — fall back to text-only prompt
        if (contentType.includes('pdf')) return null;
        const buffer = await response.arrayBuffer();
        const base64  = Buffer.from(buffer).toString('base64');
        return { base64, mimeType: contentType };
      } catch {
        return null;
      }
    }

    let drugLicenseExtracted: string | null = null;
    let gstinExtracted: string | null       = null;

    // ── Extract Drug License Number ────────────────────────────────────────────
    if (drugLicenseDoc?.url) {
      const imgData = await fetchImageAsBase64(drugLicenseDoc.url);
      const prompt  = `You are an expert at reading Indian pharmacy regulatory documents.
Examine this Drug License document carefully.
Extract ONLY the Drug License Number (also called Form 20/21 number, DL No., or Drug Licence No.).
Return ONLY the license number string — no extra text, no labels, no explanation.
If you cannot find or read a license number, return exactly: UNREADABLE`;

      try {
        drugLicenseExtracted = await generateWithFallback(prompt, imgData);
      } catch (err) {
        if (err instanceof AiUnavailableError) {
          return handleAiError(res, err);
        }
        drugLicenseExtracted = 'EXTRACTION_FAILED';
      }
    }

    // ── Extract GSTIN ──────────────────────────────────────────────────────────
    if (gstDoc?.url) {
      const imgData = await fetchImageAsBase64(gstDoc.url);
      const prompt  = `You are an expert at reading Indian GST registration certificates.
Examine this GST Certificate document carefully.
Extract ONLY the GSTIN (Goods and Services Tax Identification Number) — it is a 15-character alphanumeric code.
Return ONLY the GSTIN string — no extra text, no labels, no explanation.
If you cannot find or read a GSTIN, return exactly: UNREADABLE`;

      try {
        gstinExtracted = await generateWithFallback(prompt, imgData);
      } catch (err) {
        if (err instanceof AiUnavailableError) {
          return handleAiError(res, err);
        }
        gstinExtracted = 'EXTRACTION_FAILED';
      }
    }

    // ── Cross-reference with submitted values ──────────────────────────────────
    const normalize = (s: string | null | undefined) =>
      (s || '').toUpperCase().replace(/[\s\-\/\.]/g, '');

    const licenseMatch =
      drugLicenseExtracted &&
      !['UNREADABLE', 'EXTRACTION_FAILED'].includes(drugLicenseExtracted) &&
      normalize(drugLicenseExtracted) === normalize(store.drug_license_no)
        ? 'match'
        : drugLicenseExtracted && ['UNREADABLE', 'EXTRACTION_FAILED'].includes(drugLicenseExtracted)
        ? 'unreadable'
        : drugLicenseExtracted
        ? 'mismatch'
        : 'not_provided';

    const gstMatch =
      gstinExtracted &&
      !['UNREADABLE', 'EXTRACTION_FAILED'].includes(gstinExtracted) &&
      normalize(gstinExtracted) === normalize(store.gst_number)
        ? 'match'
        : gstinExtracted && ['UNREADABLE', 'EXTRACTION_FAILED'].includes(gstinExtracted)
        ? 'unreadable'
        : gstinExtracted
        ? 'mismatch'
        : 'not_provided';

    const overallConfidence =
      [licenseMatch, gstMatch].filter(m => m === 'match').length === 2
        ? 'high'
        : [licenseMatch, gstMatch].some(m => m === 'mismatch')
        ? 'low'
        : 'medium';

    return successResponse(res, {
      storeId:               store.id,
      storeName:             store.name,
      submittedDrugLicense:  store.drug_license_no,
      submittedGstin:        store.gst_number,
      drugLicenseExtracted,
      gstinExtracted,
      licenseMatch,
      gstMatch,
      overallConfidence,
    }, 'AI document verification complete');

  } catch (err: any) {
    console.error('verifyPharmacyDocuments error:', err);

    if (err instanceof AiUnavailableError) {
      return handleAiError(res, err);
    }

    return errorResponse(res, 'AI verification failed. Please try again.', 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature 3: AI Pharmacy Insights
// GET /api/v1/ai/pharmacy/ai-insights
// ─────────────────────────────────────────────────────────────────────────────
export async function getPharmacyInsights(req: Request, res: Response) {
  try {
    const store = await prisma.pharmacyStore.findFirst({
      where: { owner_id: req.userId as string, status: 'approved' },
    });

    if (!store) return errorResponse(res, 'Approved store not found', 404);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    // Aggregate data in parallel
    const [recentOrders, inventory] = await Promise.all([
      prisma.order.findMany({
        where: { store_id: store.id, created_at: { gte: thirtyDaysAgo } },
        include: { items: true },
        orderBy: { created_at: 'desc' },
      }),
      prisma.storeInventory.findMany({
        where: { store_id: store.id, status: 'active' },
        include: { medicine: { select: { name: true, category: true } } },
      }),
    ]);

    const delivered = recentOrders.filter(o => o.status === 'delivered');
    const rejected  = recentOrders.filter(o => o.status === 'rejected');

    // Top medicines by units sold
    const medMap: Record<string, number> = {};
    delivered.forEach(o => {
      (o.items as any[]).forEach(item => {
        medMap[item.medicine_name] = (medMap[item.medicine_name] || 0) + item.quantity;
      });
    });
    const topMedicines = Object.entries(medMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, units]) => ({ name, units }));

    // Dead stock: active items with no recent sales
    const soldInventoryIds = new Set(
      delivered.flatMap(o => (o.items as any[]).map(i => i.inventory_id))
    );
    const deadStockItems = inventory
      .filter(inv => inv.quantity > 0 && !soldInventoryIds.has(inv.id))
      .map(inv => ({
        name:     (inv.medicine as any)?.name,
        quantity: inv.quantity,
        value:    Number(inv.selling_price) * inv.quantity,
      }))
      .slice(0, 5);

    // Near-expiry items
    const nearExpiryItems = inventory
      .filter(inv => inv.exp_date && new Date(inv.exp_date) <= sixtyDaysFromNow && inv.quantity > 0)
      .map(inv => {
        const daysLeft = Math.floor((new Date(inv.exp_date).getTime() - Date.now()) / 86400000);
        return { name: (inv.medicine as any)?.name, daysLeft, quantity: inv.quantity };
      })
      .slice(0, 5);

    // Rejection reasons
    const rejectionReasons = rejected
      .filter(o => o.rejection_reason)
      .reduce((acc: Record<string, number>, o) => {
        const key = o.rejection_reason!;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

    const totalRevenue = delivered.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const terminal     = delivered.length + rejected.length + recentOrders.filter(o => o.status === 'cancelled').length;
    const fulfillRate  = terminal > 0 ? Math.round(delivered.length / terminal * 100) : 0;

    // Build compact JSON payload for the AI
    const storeContext = {
      storeName:          store.name,
      city:               store.city,
      period:             'last 30 days',
      totalOrders:        recentOrders.length,
      deliveredOrders:    delivered.length,
      rejectedOrders:     rejected.length,
      fulfillmentRate:    `${fulfillRate}%`,
      totalRevenue:       `₹${Math.round(totalRevenue).toLocaleString('en-IN')}`,
      topMedicinesSold:   topMedicines,
      deadStockItems,
      nearExpiryItems,
      rejectionReasons,
      totalInventorySKUs: inventory.length,
    };

    const prompt = `You are an expert retail pharmacy business analyst for Indian pharmacies.
Analyze this store's performance data and provide exactly 4 short, specific, actionable recommendations.

Store Data:
${JSON.stringify(storeContext, null, 2)}

Rules:
- Be specific to this store's numbers (use actual figures like ₹ amounts, percentages, medicine names)
- Focus on revenue growth, dead stock clearance, expiry risk, and operational efficiency
- Each insight must be a single concise sentence (max 25 words)
- Return ONLY a JSON array of 4 strings, no other text
- Format: ["Insight 1.", "Insight 2.", "Insight 3.", "Insight 4."]
- Always start with the most impactful insight first`;

    const text = await generateWithFallback(prompt);

    // Safely parse the JSON array from the AI response
    let insights: string[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) insights = JSON.parse(match[0]);
    } catch {
      // Fallback: split on newlines if JSON parse fails
      insights = text
        .split('\n')
        .map(l => l.replace(/^[\d\.\-\*\s"]+|["\\,]+$/g, '').trim())
        .filter(l => l.length > 10)
        .slice(0, 4);
    }

    return successResponse(res, { insights, generatedAt: new Date().toISOString() }, 'AI insights generated');

  } catch (err: any) {
    console.error('getPharmacyInsights error:', err);

    if (err instanceof AiUnavailableError) {
      return handleAiError(res, err);
    }

    return errorResponse(res, 'Failed to generate insights. Please try again.', 500);
  }
}
