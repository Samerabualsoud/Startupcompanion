/**
 * Tests for Attachment Router
 * 
 * Tests:
 * - uploadAttachment: Upload file to S3 and create record
 * - getAttachments: List attachments for a data room
 * - deleteAttachment: Delete attachment
 * - getDownloadUrl: Get presigned URL
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { attachmentRouter } from './attachmentRouter';
import { getDb } from '../db';
import { storagePut, storageGet } from '../storage';

// Mock dependencies
vi.mock('../db');
vi.mock('../storage');

describe('Attachment Router', () => {
  const mockUser = { id: 123, email: 'test@example.com', role: 'user' as const };
  const mockContext = { user: mockUser };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadAttachment', () => {
    it('should upload file and create database record', async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue([{ id: 'att_123' }]),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(storagePut).mockResolvedValue({ url: 'https://cdn.example.com/file.pdf' });

      const input = {
        fileName: 'test.pdf',
        fileData: Buffer.from('test content').toString('base64'),
        fileType: 'application/pdf',
        dataRoomId: 'room_123',
      };

      const result = await attachmentRouter.createCaller(mockContext).uploadAttachment(input);

      expect(result).toHaveProperty('fileName', 'test.pdf');
      expect(result).toHaveProperty('downloadUrl', 'https://cdn.example.com/file.pdf');
      expect(result).toHaveProperty('fileSize');
      expect(storagePut).toHaveBeenCalled();
    });

    it('should throw error if database is unavailable', async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const input = {
        fileName: 'test.pdf',
        fileData: Buffer.from('test content').toString('base64'),
        fileType: 'application/pdf',
        dataRoomId: 'room_123',
      };

      await expect(
        attachmentRouter.createCaller(mockContext).uploadAttachment(input)
      ).rejects.toThrow();
    });
  });

  describe('getAttachments', () => {
    it('should return list of attachments for data room', async () => {
      const mockAttachments = [
        {
          id: 'att_1',
          fileName: 'doc1.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          downloadUrl: 'https://cdn.example.com/doc1.pdf',
          uploadedAt: new Date(),
          userId: 123,
          dataRoomId: 'room_123',
          fileKey: 'key1',
          createdAt: new Date(),
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockAttachments),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await attachmentRouter.createCaller(mockContext).getAttachments({
        dataRoomId: 'room_123',
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('fileName', 'doc1.pdf');
    });

    it('should throw error if database is unavailable', async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      await expect(
        attachmentRouter.createCaller(mockContext).getAttachments({
          dataRoomId: 'room_123',
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteAttachment', () => {
    it('should delete attachment if user owns it', async () => {
      const mockAttachment = [
        {
          id: 'att_1',
          fileName: 'doc1.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          downloadUrl: 'https://cdn.example.com/doc1.pdf',
          uploadedAt: new Date(),
          userId: 123, // Same as mockUser.id
          dataRoomId: 'room_123',
          fileKey: 'key1',
          createdAt: new Date(),
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockAttachment),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const result = await attachmentRouter.createCaller(mockContext).deleteAttachment({
        attachmentId: 'att_1',
      });

      expect(result).toHaveProperty('success', true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw error if user does not own attachment', async () => {
      const mockAttachment = [
        {
          id: 'att_1',
          fileName: 'doc1.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          downloadUrl: 'https://cdn.example.com/doc1.pdf',
          uploadedAt: new Date(),
          userId: 999, // Different user
          dataRoomId: 'room_123',
          fileKey: 'key1',
          createdAt: new Date(),
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockAttachment),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await expect(
        attachmentRouter.createCaller(mockContext).deleteAttachment({
          attachmentId: 'att_1',
        })
      ).rejects.toThrow('You do not have permission to delete this attachment');
    });

    it('should throw error if attachment not found', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await expect(
        attachmentRouter.createCaller(mockContext).deleteAttachment({
          attachmentId: 'att_nonexistent',
        })
      ).rejects.toThrow('Attachment not found');
    });
  });

  describe('getDownloadUrl', () => {
    it('should return presigned download URL', async () => {
      const mockAttachment = [
        {
          id: 'att_1',
          fileName: 'doc1.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          downloadUrl: 'https://cdn.example.com/doc1.pdf',
          uploadedAt: new Date(),
          userId: 123,
          dataRoomId: 'room_123',
          fileKey: 'key1',
          createdAt: new Date(),
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockAttachment),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);
      vi.mocked(storageGet).mockResolvedValue({
        url: 'https://cdn.example.com/presigned-url',
      });

      const result = await attachmentRouter.createCaller(mockContext).getDownloadUrl({
        attachmentId: 'att_1',
      });

      expect(result).toHaveProperty('downloadUrl');
      expect(storageGet).toHaveBeenCalledWith('key1');
    });

    it('should throw error if user does not own attachment', async () => {
      const mockAttachment = [
        {
          id: 'att_1',
          fileName: 'doc1.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          downloadUrl: 'https://cdn.example.com/doc1.pdf',
          uploadedAt: new Date(),
          userId: 999,
          dataRoomId: 'room_123',
          fileKey: 'key1',
          createdAt: new Date(),
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockAttachment),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      await expect(
        attachmentRouter.createCaller(mockContext).getDownloadUrl({
          attachmentId: 'att_1',
        })
      ).rejects.toThrow('You do not have permission to access this attachment');
    });
  });
});
