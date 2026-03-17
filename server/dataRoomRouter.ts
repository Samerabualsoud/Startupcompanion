/**
 * Data Room Router
 * Handles: create/list/delete rooms, file upload to S3, share-link generation,
 * activity tracking (who opened, what they viewed), and public viewer access.
 */
import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from './_core/trpc';
import { getDb } from './db';
import { dataRooms, dataRoomFiles, dataRoomViews } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { storagePut } from './storage';
import crypto from 'crypto';

function generateToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

function randomSuffix(): string {
  return crypto.randomBytes(6).toString('hex');
}

export const dataRoomRouter = router({
  // ── List all data rooms for the authenticated user ──────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(dataRooms)
      .where(eq(dataRooms.userId, ctx.user.id))
      .orderBy(desc(dataRooms.updatedAt));
  }),

  // ── Create a new data room ──────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(256),
      description: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const [room] = await db
        .insert(dataRooms)
        .values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description ?? null,
          isShared: false,
          requireEmail: false,
          viewCount: 0,
        })
        .$returningId();
      const created = await db
        .select()
        .from(dataRooms)
        .where(eq(dataRooms.id, room.id))
        .limit(1);
      return created[0];
    }),

  // ── Update data room metadata ───────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(256).optional(),
      description: z.string().max(2000).optional(),
      requireEmail: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const { id, ...fields } = input;
      await db
        .update(dataRooms)
        .set(fields)
        .where(and(eq(dataRooms.id, id), eq(dataRooms.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Delete a data room and all its files ───────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      await db.delete(dataRoomViews).where(eq(dataRoomViews.dataRoomId, input.id));
      await db.delete(dataRoomFiles).where(eq(dataRoomFiles.dataRoomId, input.id));
      await db
        .delete(dataRooms)
        .where(and(eq(dataRooms.id, input.id), eq(dataRooms.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Upload a file to a data room (base64 encoded) ──────────────────────
  uploadFile: protectedProcedure
    .input(z.object({
      dataRoomId: z.number(),
      name: z.string().min(1).max(256),
      mimeType: z.string().max(128),
      sizeBytes: z.number().max(20 * 1024 * 1024),
      folder: z.string().max(128).default('General'),
      base64Data: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const [room] = await db
        .select()
        .from(dataRooms)
        .where(and(eq(dataRooms.id, input.dataRoomId), eq(dataRooms.userId, ctx.user.id)))
        .limit(1);
      if (!room) throw new Error('Data room not found');

      const fileBuffer = Buffer.from(input.base64Data, 'base64');
      const ext = input.name.split('.').pop() ?? 'bin';
      const fileKey = `data-rooms/${ctx.user.id}/${input.dataRoomId}/${randomSuffix()}.${ext}`;
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

      const [file] = await db
        .insert(dataRoomFiles)
        .values({
          dataRoomId: input.dataRoomId,
          userId: ctx.user.id,
          name: input.name,
          fileKey,
          fileUrl: url,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          folder: input.folder,
          sortOrder: 0,
        })
        .$returningId();

      const created = await db
        .select()
        .from(dataRoomFiles)
        .where(eq(dataRoomFiles.id, file.id))
        .limit(1);
      return created[0];
    }),

  // ── Delete a file from a data room ─────────────────────────────────────
  deleteFile: protectedProcedure
    .input(z.object({ fileId: z.number(), dataRoomId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      await db.delete(dataRoomViews).where(eq(dataRoomViews.fileId, input.fileId));
      await db
        .delete(dataRoomFiles)
        .where(and(eq(dataRoomFiles.id, input.fileId), eq(dataRoomFiles.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── List files in a data room ───────────────────────────────────────────
  listFiles: protectedProcedure
    .input(z.object({ dataRoomId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const [room] = await db
        .select()
        .from(dataRooms)
        .where(and(eq(dataRooms.id, input.dataRoomId), eq(dataRooms.userId, ctx.user.id)))
        .limit(1);
      if (!room) throw new Error('Data room not found');

      return db
        .select()
        .from(dataRoomFiles)
        .where(eq(dataRoomFiles.dataRoomId, input.dataRoomId))
        .orderBy(dataRoomFiles.folder, dataRoomFiles.sortOrder, dataRoomFiles.createdAt);
    }),

  // ── Generate / toggle share link ───────────────────────────────────────
  generateShareLink: protectedProcedure
    .input(z.object({
      dataRoomId: z.number(),
      requireEmail: z.boolean().default(false),
      expiresInDays: z.number().min(1).max(365).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const token = generateToken();
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 86400 * 1000)
        : null;

      await db
        .update(dataRooms)
        .set({ shareToken: token, isShared: true, requireEmail: input.requireEmail, expiresAt })
        .where(and(eq(dataRooms.id, input.dataRoomId), eq(dataRooms.userId, ctx.user.id)));

      return { token, shareUrl: `/data-room/${token}` };
    }),

  // ── Revoke share link ──────────────────────────────────────────────────
  revokeShareLink: protectedProcedure
    .input(z.object({ dataRoomId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      await db
        .update(dataRooms)
        .set({ shareToken: null, isShared: false })
        .where(and(eq(dataRooms.id, input.dataRoomId), eq(dataRooms.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Get activity log for a data room ───────────────────────────────────
  getActivity: protectedProcedure
    .input(z.object({ dataRoomId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const [room] = await db
        .select()
        .from(dataRooms)
        .where(and(eq(dataRooms.id, input.dataRoomId), eq(dataRooms.userId, ctx.user.id)))
        .limit(1);
      if (!room) throw new Error('Data room not found');

      const views = await db
        .select()
        .from(dataRoomViews)
        .where(eq(dataRoomViews.dataRoomId, input.dataRoomId))
        .orderBy(desc(dataRoomViews.createdAt))
        .limit(200);

      const files = await db
        .select()
        .from(dataRoomFiles)
        .where(eq(dataRoomFiles.dataRoomId, input.dataRoomId));
      const fileMap: Record<number, string> = Object.fromEntries(files.map((f) => [f.id, f.name]));

      return views.map((v) => ({
        ...v,
        fileName: v.fileId ? (fileMap[v.fileId] ?? 'Unknown file') : null,
      }));
    }),

  // ── Public: view a shared data room by token ───────────────────────────
  getSharedRoom: publicProcedure
    .input(z.object({
      token: z.string(),
      viewerEmail: z.string().email().optional(),
      viewerName: z.string().max(256).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const [room] = await db
        .select()
        .from(dataRooms)
        .where(eq(dataRooms.shareToken, input.token))
        .limit(1);

      if (!room || !room.isShared) throw new Error('Data room not found or not shared');
      if (room.expiresAt && new Date(room.expiresAt) < new Date()) {
        throw new Error('This share link has expired');
      }
      if (room.requireEmail && !input.viewerEmail) {
        return { requireEmail: true, room: null, files: [] };
      }

      const req = (ctx as any).req;
      const ip = req?.headers?.['x-forwarded-for'] ?? req?.socket?.remoteAddress ?? null;
      const ua = req?.headers?.['user-agent'] ?? null;

      await db.insert(dataRoomViews).values({
        dataRoomId: room.id,
        fileId: null,
        viewerEmail: input.viewerEmail ?? null,
        viewerName: input.viewerName ?? null,
        ipAddress: ip ? String(ip).split(',')[0].trim() : null,
        userAgent: ua ? String(ua).slice(0, 512) : null,
        action: 'room_opened',
      });

      await db
        .update(dataRooms)
        .set({ viewCount: room.viewCount + 1 })
        .where(eq(dataRooms.id, room.id));

      const files = await db
        .select()
        .from(dataRoomFiles)
        .where(eq(dataRoomFiles.dataRoomId, room.id))
        .orderBy(dataRoomFiles.folder, dataRoomFiles.sortOrder);

      return {
        requireEmail: false,
        room: { id: room.id, name: room.name, description: room.description },
        files,
      };
    }),

  // ── Public: track a file view from a shared room ───────────────────────
  trackFileView: publicProcedure
    .input(z.object({
      token: z.string(),
      fileId: z.number(),
      viewerEmail: z.string().email().optional(),
      viewerName: z.string().max(256).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const [room] = await db
        .select()
        .from(dataRooms)
        .where(eq(dataRooms.shareToken, input.token))
        .limit(1);
      if (!room || !room.isShared) return { success: false };

      const req = (ctx as any).req;
      const ip = req?.headers?.['x-forwarded-for'] ?? req?.socket?.remoteAddress ?? null;
      const ua = req?.headers?.['user-agent'] ?? null;

      await db.insert(dataRoomViews).values({
        dataRoomId: room.id,
        fileId: input.fileId,
        viewerEmail: input.viewerEmail ?? null,
        viewerName: input.viewerName ?? null,
        ipAddress: ip ? String(ip).split(',')[0].trim() : null,
        userAgent: ua ? String(ua).slice(0, 512) : null,
        action: 'file_viewed',
      });
      return { success: true };
    }),
});
