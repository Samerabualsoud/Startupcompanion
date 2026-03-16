/**
 * crmRouter — Investor CRM CRUD procedures
 * All procedures are protected (require login).
 * Contacts are scoped per user — users can only see/edit their own contacts.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

const StatusEnum = z.enum([
  "target",
  "contacted",
  "intro-requested",
  "meeting-scheduled",
  "due-diligence",
  "term-sheet",
  "passed",
  "invested",
]);

const ContactInput = z.object({
  name: z.string().min(1).max(256),
  firm: z.string().max(256).default(""),
  stageFocus: z.string().max(128).default(""),
  sectorFocus: z.string().max(256).default(""),
  status: StatusEnum.default("target"),
  lastContact: z.string().max(32).default(""),
  notes: z.string().max(2048).default(""),
  email: z.string().max(320).default(""),
  linkedin: z.string().max(512).default(""),
});

export const crmRouter = router({
  /** Get all contacts for the current user */
  getContacts: protectedProcedure.query(async ({ ctx }) => {
    return db.getCrmContacts(ctx.user.id);
  }),

  /** Add a new contact */
  addContact: protectedProcedure
    .input(ContactInput)
    .mutation(async ({ ctx, input }) => {
      return db.addCrmContact(ctx.user.id, {
        name: input.name,
        firm: input.firm,
        stageFocus: input.stageFocus,
        sectorFocus: input.sectorFocus,
        status: input.status,
        lastContact: input.lastContact,
        notes: input.notes,
        email: input.email,
        linkedin: input.linkedin,
      });
    }),

  /** Update an existing contact (only owner can update) */
  updateContact: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        data: ContactInput.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await db.updateCrmContact(input.id, ctx.user.id, input.data);
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
      }
      return updated;
    }),

  /** Update just the status of a contact (quick pipeline move) */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: StatusEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await db.updateCrmContact(input.id, ctx.user.id, { status: input.status });
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
      }
      return { success: true };
    }),

  /** Delete a contact (only owner can delete) */
  deleteContact: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await db.deleteCrmContact(input.id, ctx.user.id);
      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });
      }
      return { success: true };
    }),
});
