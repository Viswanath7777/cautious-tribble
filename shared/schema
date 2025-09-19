import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  characterName: varchar("character_name").unique(),
  credits: integer("credits").default(1000).notNull(),
  lastStipendDate: timestamp("last_stipend_date"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Challenges table
export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  reward: integer("reward").notNull(),
  difficulty: varchar("difficulty").notNull(), // Easy, Medium, Hard, Extreme
  expiresAt: timestamp("expires_at").notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge submissions table
export const challengeSubmissions = pgTable("challenge_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  proofText: text("proof_text").notNull(),
  proofUrl: varchar("proof_url"),
  status: varchar("status").default("pending").notNull(), // pending, approved, rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Betting events table
export const bettingEvents = pgTable("betting_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").default("open").notNull(), // open, closed, resolved, cancelled
  closesAt: timestamp("closes_at"),
  resolvedAt: timestamp("resolved_at"),
  winningOptionId: varchar("winning_option_id"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Betting options table
export const bettingOptions = pgTable("betting_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => bettingEvents.id).notNull(),
  label: varchar("label").notNull(),
  multiplier: decimal("multiplier", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bets table
export const bets = pgTable("bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => bettingEvents.id).notNull(),
  optionId: varchar("option_id").references(() => bettingOptions.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  status: varchar("status").default("active").notNull(), // active, cancelled, won, lost
  payout: integer("payout"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loans table
export const loans = pgTable("loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  borrowerId: varchar("borrower_id").references(() => users.id).notNull(),
  lenderId: varchar("lender_id").references(() => users.id),
  amount: integer("amount").notNull(),
  interestRate: integer("interest_rate").notNull(), // percentage
  totalRepayment: integer("total_repayment").notNull(),
  dueDate: timestamp("due_date").notNull(),
  purpose: text("purpose"),
  status: varchar("status").default("pending").notNull(), // pending, funded, repaid, defaulted
  fundedAt: timestamp("funded_at"),
  repaidAt: timestamp("repaid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit transactions table (for audit trail)
export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // positive for credit, negative for debit
  type: varchar("type").notNull(), // challenge_reward, bet_win, bet_loss, loan_fund, loan_repay, weekly_stipend, etc.
  referenceId: varchar("reference_id"), // ID of related record (challenge, bet, loan, etc.)
  description: text("description").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  challenges: many(challenges),
  submissions: many(challengeSubmissions),
  bettingEvents: many(bettingEvents),
  bets: many(bets),
  borrowedLoans: many(loans, { relationName: "borrower" }),
  lentLoans: many(loans, { relationName: "lender" }),
  transactions: many(creditTransactions),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  creator: one(users, { fields: [challenges.createdBy], references: [users.id] }),
  submissions: many(challengeSubmissions),
}));

export const challengeSubmissionsRelations = relations(challengeSubmissions, ({ one }) => ({
  challenge: one(challenges, { fields: [challengeSubmissions.challengeId], references: [challenges.id] }),
  user: one(users, { fields: [challengeSubmissions.userId], references: [users.id] }),
  reviewer: one(users, { fields: [challengeSubmissions.reviewedBy], references: [users.id] }),
}));

export const bettingEventsRelations = relations(bettingEvents, ({ one, many }) => ({
  creator: one(users, { fields: [bettingEvents.createdBy], references: [users.id] }),
  options: many(bettingOptions),
  bets: many(bets),
}));

export const bettingOptionsRelations = relations(bettingOptions, ({ one, many }) => ({
  event: one(bettingEvents, { fields: [bettingOptions.eventId], references: [bettingEvents.id] }),
  bets: many(bets),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  event: one(bettingEvents, { fields: [bets.eventId], references: [bettingEvents.id] }),
  option: one(bettingOptions, { fields: [bets.optionId], references: [bettingOptions.id] }),
  user: one(users, { fields: [bets.userId], references: [users.id] }),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  borrower: one(users, { fields: [loans.borrowerId], references: [users.id], relationName: "borrower" }),
  lender: one(users, { fields: [loans.lenderId], references: [users.id], relationName: "lender" }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, { fields: [creditTransactions.userId], references: [users.id] }),
}));

// Insert schemas
export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeSubmissionSchema = createInsertSchema(challengeSubmissions).omit({
  id: true,
  submittedAt: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
});

export const insertBettingEventSchema = createInsertSchema(bettingEvents).omit({
  id: true,
  createdAt: true,
  status: true,
  resolvedAt: true,
  winningOptionId: true,
});

export const insertBettingOptionSchema = createInsertSchema(bettingOptions).omit({
  id: true,
  createdAt: true,
});

export const insertBetSchema = createInsertSchema(bets).omit({
  id: true,
  createdAt: true,
  status: true,
  payout: true,
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  createdAt: true,
  lenderId: true,
  status: true,
  fundedAt: true,
  repaidAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type ChallengeSubmission = typeof challengeSubmissions.$inferSelect;
export type InsertChallengeSubmission = z.infer<typeof insertChallengeSubmissionSchema>;
export type BettingEvent = typeof bettingEvents.$inferSelect;
export type InsertBettingEvent = z.infer<typeof insertBettingEventSchema>;
export type BettingOption = typeof bettingOptions.$inferSelect;
export type InsertBettingOption = z.infer<typeof insertBettingOptionSchema>;
export type Bet = typeof bets.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
