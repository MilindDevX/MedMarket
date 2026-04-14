import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma.ts';
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary.ts';
import { successResponse, errorResponse } from '../utils/response.ts';

const VALID_DOC_TYPES = ['drug_license', 'gst_certificate', 'aadhaar', 'pan', 'store_photo'] as const;
type DocType = typeof VALID_DOC_TYPES[number];

export async function uploadDocument(req: Request, res: Response) {
  try {
    if (!req.file) return errorResponse(res, 'No file provided.', 400);

    const doc_type = req.body.doc_type as DocType;
    if (!VALID_DOC_TYPES.includes(doc_type)) {
      return errorResponse(res, `doc_type must be one of: ${VALID_DOC_TYPES.join(', ')}`, 400);
    }

    const store = await prisma.pharmacyStore.findFirst({ where: { owner_id: req.userId } });
    if (!store) return errorResponse(res, 'No store found for this account.', 404);

    const folder   = `medmarket/documents/${store.id}`;
    const publicId = `${doc_type}_${uuidv4()}`;

    const { secure_url, public_id } = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      folder,
      publicId,
    );

    const existing = await prisma.storeDocument.findFirst({
      where: { store_id: store.id, doc_type },
    });

    let doc;
    if (existing) {
      // Delete old file from Cloudinary before replacing
      if (existing.s3_key) {
        await deleteFromCloudinary(existing.s3_key, existing.mime_type).catch(() => {});
      }
      doc = await prisma.storeDocument.update({
        where: { id: existing.id },
        data: {
          s3_key:            public_id,
          original_filename: req.file.originalname,
          mime_type:         req.file.mimetype,
        },
      });
    } else {
      doc = await prisma.storeDocument.create({
        data: {
          store_id:          store.id,
          doc_type,
          s3_key:            public_id,
          original_filename: req.file.originalname,
          mime_type:         req.file.mimetype,
        },
      });
    }

    return successResponse(
      res,
      { ...doc, url: secure_url },
      'Document uploaded successfully',
      201,
    );
  } catch (err: any) {
    console.error('Document upload error:', err);
    if (err.message?.includes('Only PDF')) return errorResponse(res, err.message, 400);
    return errorResponse(res, 'Failed to upload document. Please try again.', 500);
  }
}

export async function getDocumentUrl(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const doc = await prisma.storeDocument.findUnique({ where: { id } });
    if (!doc) return errorResponse(res, 'Document not found.', 404);

    const store   = await prisma.pharmacyStore.findFirst({ where: { owner_id: req.userId } });
    const isAdmin = req.role === 'admin';
    const isOwner = store?.id === doc.store_id;

    if (!isAdmin && !isOwner) return errorResponse(res, 'Access denied.', 403);

    const { v2: cloudinary } = await import('cloudinary');
    const resourceType = doc.mime_type === 'application/pdf' ? 'raw' : 'image';
    const url = cloudinary.url(doc.s3_key, { resource_type: resourceType, secure: true });

    return successResponse(res, { url }, 'Document URL fetched');
  } catch {
    return errorResponse(res, 'Something went wrong.', 500);
  }
}

export async function listDocuments(req: Request, res: Response) {
  try {
    const store = await prisma.pharmacyStore.findFirst({ where: { owner_id: req.userId } });
    if (!store) return errorResponse(res, 'No store found.', 404);

    const docs = await prisma.storeDocument.findMany({
      where: { store_id: store.id },
      orderBy: { uploaded_at: 'desc' },
    });

    // Attach Cloudinary URL to each document for direct preview
    const { v2: cloudinary } = await import('cloudinary');
    const docsWithUrls = docs.map(doc => {
      const resourceType = doc.mime_type === 'application/pdf' ? 'raw' : 'image';
      return {
        ...doc,
        url: cloudinary.url(doc.s3_key, { resource_type: resourceType, secure: true }),
      };
    });

    return successResponse(res, docsWithUrls, 'Documents fetched');
  } catch {
    return errorResponse(res, 'Something went wrong.', 500);
  }
}
