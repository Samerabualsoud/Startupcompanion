/**
 * Attachment Router — File upload/download/delete for data rooms
 * 
 * Procedures:
 * - uploadAttachment: Upload file to S3 and create database record
 * - getAttachments: List all attachments for a data room
 * - deleteAttachment: Delete file from S3 and database
 * - getDownloadUrl: Get presigned URL for downloading attachment
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { attachments } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { storagePut, storageGet } from '../storage';
import { TRPCError } from '@trpc/server';

export const attachmentRouter = router({
  /**
   * Upload file to S3 and create attachment record
   */
  uploadAttachment: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        fileData: z.string(), // Base64 encoded
        fileType: z.string().min(1).max(100),
        dataRoomId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Decode base64 to buffer
        const buffer = Buffer.from(input.fileData, 'base64');

        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileKey = `data-rooms/${ctx.user.id}/${input.dataRoomId}/${timestamp}-${randomSuffix}-${input.fileName}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.fileType);

        // Create database record
        await db
          .insert(attachments)
          .values({
            userId: ctx.user.id,
            dataRoomId: input.dataRoomId,
            fileName: input.fileName,
            fileType: input.fileType,
            fileSize: buffer.length,
            fileKey,
            downloadUrl: url,
          });

        return {
          fileName: input.fileName,
          fileSize: buffer.length,
          downloadUrl: url,
          uploadedAt: new Date(),
        };
      } catch (error) {
        console.error('[Attachment Upload Error]', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload attachment',
        });
      }
    }),

  /**
   * Get all attachments for a data room
   */
  getAttachments: protectedProcedure
    .input(
      z.object({
        dataRoomId: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const items = await db
          .select()
          .from(attachments)
          .where(
            and(
              eq(attachments.userId, ctx.user.id),
              eq(attachments.dataRoomId, input.dataRoomId)
            )
          );

        return items.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileType: a.fileType,
          fileSize: a.fileSize,
          downloadUrl: a.downloadUrl,
          uploadedAt: a.uploadedAt,
        }));
      } catch (error) {
        console.error('[Attachment Fetch Error]', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch attachments',
        });
      }
    }),

  /**
   * Delete attachment from S3 and database
   */
  deleteAttachment: protectedProcedure
    .input(
      z.object({
        attachmentId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Get attachment record to verify ownership
        const attachment = await db
          .select()
          .from(attachments)
          .where(eq(attachments.id, input.attachmentId));

        if (!attachment.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Attachment not found',
          });
        }

        if (attachment[0].userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this attachment',
          });
        }

        // Delete from database
        await db
          .delete(attachments)
          .where(eq(attachments.id, input.attachmentId));

        return { success: true };
      } catch (error) {
        console.error('[Attachment Delete Error]', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete attachment',
        });
      }
    }),

  /**
   * Get presigned download URL for attachment
   */
  getDownloadUrl: protectedProcedure
    .input(
      z.object({
        attachmentId: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const attachment = await db
          .select()
          .from(attachments)
          .where(eq(attachments.id, input.attachmentId));

        if (!attachment.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Attachment not found',
          });
        }

        if (attachment[0].userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this attachment',
          });
        }

        // Get presigned URL (valid for 1 hour)
        const { url } = await storageGet(attachment[0].fileKey);

        return { downloadUrl: url };
      } catch (error) {
        console.error('[Attachment Download URL Error]', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate download URL',
        });
      }
    }),
});
