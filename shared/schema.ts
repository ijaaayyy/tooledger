import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["student", "admin"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "declined", "returned"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  studentId: text("student_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
  lastLoginIp: text("last_login_ip"),
  lastUserAgent: text("last_user_agent"),
});

export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  totalQuantity: integer("total_quantity").notNull().default(1),
  availableQuantity: integer("available_quantity").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const borrowRequests = pgTable("borrow_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  equipmentId: varchar("equipment_id").notNull().references(() => equipment.id),
  quantity: integer("quantity").notNull().default(1),
  purpose: text("purpose").notNull(),
  borrowDate: timestamp("borrow_date").notNull(),
  expectedReturnDate: timestamp("expected_return_date").notNull(),
  actualReturnDate: timestamp("actual_return_date"),
  status: requestStatusEnum("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
});

export const usersRelations = relations(users, ({ many }) => ({
  borrowRequests: many(borrowRequests),
}));

export const equipmentRelations = relations(equipment, ({ many }) => ({
  borrowRequests: many(borrowRequests),
}));

export const borrowRequestsRelations = relations(borrowRequests, ({ one }) => ({
  user: one(users, {
    fields: [borrowRequests.userId],
    references: [users.id],
  }),
  equipment: one(equipment, {
    fields: [borrowRequests.equipmentId],
    references: [equipment.id],
  }),
  approver: one(users, {
    fields: [borrowRequests.approvedBy],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
});

export const insertBorrowRequestSchema = createInsertSchema(borrowRequests).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  approvedBy: true,
  actualReturnDate: true,
  status: true,
  adminNotes: true,
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  studentId: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = typeof equipment.$inferSelect;
export type InsertBorrowRequest = z.infer<typeof insertBorrowRequestSchema>;
export type BorrowRequest = typeof borrowRequests.$inferSelect;

export type BorrowRequestWithDetails = BorrowRequest & {
  user: User;
  equipment: Equipment;
  approver?: User;
};
