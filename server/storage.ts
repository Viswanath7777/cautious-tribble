import {
  users,
  challenges,
  challengeSubmissions,
  bettingEvents,
  bettingOptions,
  bets,
  loans,
  creditTransactions,
  type User,
  type UpsertUser,
  type Challenge,
  type InsertChallenge,
  type ChallengeSubmission,
  type InsertChallengeSubmission,
  type BettingEvent,
  type InsertBettingEvent,
  type BettingOption,
  type InsertBettingOption,
  type Bet,
  type InsertBet,
  type Loan,
  type InsertLoan,
  type CreditTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateCharacterName(userId: string, characterName: string): Promise<void>;
  
  // Credit operations
  updateUserCredits(userId: string, amount: number, type: string, description: string, referenceId?: string): Promise<void>;
  processWeeklyStipends(): Promise<void>;
  
  // Challenge operations
  getChallenges(): Promise<Challenge[]>;
  getActiveUserChallenges(userId: string): Promise<Challenge[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getChallenge(id: string): Promise<Challenge | undefined>;
  
  // Challenge submission operations
  getSubmissionsByChallenge(challengeId: string): Promise<ChallengeSubmission[]>;
  getPendingSubmissions(): Promise<Array<ChallengeSubmission & { challenge: Challenge; user: User }>>;
  createSubmission(submission: InsertChallengeSubmission): Promise<ChallengeSubmission>;
  reviewSubmission(submissionId: string, status: 'approved' | 'rejected', reviewerId: string): Promise<void>;
  
  // Betting operations
  getBettingEvents(): Promise<Array<BettingEvent & { options: BettingOption[]; totalBets: number }>>;
  createBettingEvent(event: InsertBettingEvent, options: InsertBettingOption[]): Promise<BettingEvent>;
  placeBet(bet: InsertBet): Promise<void>;
  cancelBet(betId: string, userId: string): Promise<void>;
  getUserBets(userId: string): Promise<Array<Bet & { event: BettingEvent; option: BettingOption }>>;
  resolveBettingEvent(eventId: string, winningOptionId: string, adminId: string): Promise<void>;
  
  // Loan operations
  getPendingLoans(): Promise<Array<Loan & { borrower: User }>>;
  getUserLoans(userId: string): Promise<Array<Loan & { lender?: User }>>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  fundLoan(loanId: string, lenderId: string): Promise<void>;
  repayLoan(loanId: string): Promise<void>;
  
  // Leaderboard
  getLeaderboard(): Promise<Array<{ user: User; challengesCompleted: number; weeklyChange: number }>>;
  
  // Statistics
  getUserStats(userId: string): Promise<{
    totalWagered: number;
    totalWon: number;
    winRate: number;
    activeBets: number;
    totalStaked: number;
    rank: number;
    totalUsers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateCharacterName(userId: string, characterName: string): Promise<void> {
    await db
      .update(users)
      .set({ characterName, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserCredits(userId: string, amount: number, type: string, description: string, referenceId?: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Update user credits
      const [user] = await tx
        .update(users)
        .set({ 
          credits: sql`${users.credits} + ${amount}`,
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId))
        .returning();

      // Record transaction
      await tx.insert(creditTransactions).values({
        userId,
        amount,
        type,
        description,
        referenceId,
        balanceAfter: user.credits,
      });
    });
  }

  async processWeeklyStipends(): Promise<void> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const eligibleUsers = await db
      .select()
      .from(users)
      .where(
        sql`${users.lastStipendDate} IS NULL OR ${users.lastStipendDate} < ${oneWeekAgo}`
      );

    for (const user of eligibleUsers) {
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ 
            credits: sql`${users.credits} + 200`,
            lastStipendDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));

        await tx.insert(creditTransactions).values({
          userId: user.id,
          amount: 200,
          type: 'weekly_stipend',
          description: 'Weekly credit stipend',
          balanceAfter: user.credits + 200,
        });
      });
    }
  }

  async getChallenges(): Promise<Challenge[]> {
    return await db
      .select()
      .from(challenges)
      .where(eq(challenges.isActive, true))
      .orderBy(desc(challenges.createdAt));
  }

  async getActiveUserChallenges(userId: string): Promise<Challenge[]> {
    const userSubmissions = db
      .select({ challengeId: challengeSubmissions.challengeId })
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.userId, userId));

    return await db
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.isActive, true),
          sql`${challenges.expiresAt} > NOW()`,
          sql`${challenges.id} NOT IN (${userSubmissions})`
        )
      )
      .orderBy(desc(challenges.reward));
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [created] = await db.insert(challenges).values(challenge).returning();
    return created;
  }

  async getChallenge(id: string): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async getSubmissionsByChallenge(challengeId: string): Promise<ChallengeSubmission[]> {
    return await db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.challengeId, challengeId))
      .orderBy(desc(challengeSubmissions.submittedAt));
  }

  async getPendingSubmissions(): Promise<Array<ChallengeSubmission & { challenge: Challenge; user: User }>> {
    return await db
      .select({
        id: challengeSubmissions.id,
        challengeId: challengeSubmissions.challengeId,
        userId: challengeSubmissions.userId,
        proofText: challengeSubmissions.proofText,
        proofUrl: challengeSubmissions.proofUrl,
        status: challengeSubmissions.status,
        reviewedBy: challengeSubmissions.reviewedBy,
        reviewedAt: challengeSubmissions.reviewedAt,
        submittedAt: challengeSubmissions.submittedAt,
        challenge: challenges,
        user: users,
      })
      .from(challengeSubmissions)
      .innerJoin(challenges, eq(challengeSubmissions.challengeId, challenges.id))
      .innerJoin(users, eq(challengeSubmissions.userId, users.id))
      .where(eq(challengeSubmissions.status, 'pending'))
      .orderBy(desc(challengeSubmissions.submittedAt));
  }

  async createSubmission(submission: InsertChallengeSubmission): Promise<ChallengeSubmission> {
    const [created] = await db.insert(challengeSubmissions).values(submission).returning();
    return created;
  }

  async reviewSubmission(submissionId: string, status: 'approved' | 'rejected', reviewerId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [submission] = await tx
        .update(challengeSubmissions)
        .set({
          status,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        })
        .where(eq(challengeSubmissions.id, submissionId))
        .returning();

      if (status === 'approved') {
        const [challenge] = await tx
          .select()
          .from(challenges)
          .where(eq(challenges.id, submission.challengeId));

        if (challenge) {
          await this.updateUserCredits(
            submission.userId,
            challenge.reward,
            'challenge_reward',
            `Challenge completed: ${challenge.title}`,
            challenge.id
          );
        }
      }
    });
  }

  async getBettingEvents(): Promise<Array<BettingEvent & { options: BettingOption[]; totalBets: number }>> {
    const events = await db
      .select()
      .from(bettingEvents)
      .orderBy(desc(bettingEvents.createdAt));

    const results = [];
    for (const event of events) {
      const options = await db
        .select()
        .from(bettingOptions)
        .where(eq(bettingOptions.eventId, event.id));

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(bets)
        .where(eq(bets.eventId, event.id));

      results.push({
        ...event,
        options,
        totalBets: count,
      });
    }

    return results;
  }

  async createBettingEvent(event: InsertBettingEvent, options: InsertBettingOption[]): Promise<BettingEvent> {
    return await db.transaction(async (tx) => {
      const [created] = await tx.insert(bettingEvents).values(event).returning();
      
      const optionsWithEventId = options.map(option => ({
        ...option,
        eventId: created.id,
      }));
      
      await tx.insert(bettingOptions).values(optionsWithEventId);
      
      return created;
    });
  }

  async placeBet(bet: InsertBet): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.insert(bets).values(bet);
      
      await this.updateUserCredits(
        bet.userId,
        -bet.amount,
        'bet_placed',
        'Bet placed',
        bet.eventId
      );
    });
  }

  async cancelBet(betId: string, userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [bet] = await tx
        .update(bets)
        .set({ status: 'cancelled' })
        .where(and(eq(bets.id, betId), eq(bets.userId, userId)))
        .returning();

      if (bet) {
        await this.updateUserCredits(
          userId,
          bet.amount,
          'bet_cancelled',
          'Bet cancelled and refunded',
          bet.eventId
        );
      }
    });
  }

  async getUserBets(userId: string): Promise<Array<Bet & { event: BettingEvent; option: BettingOption }>> {
    return await db
      .select({
        id: bets.id,
        eventId: bets.eventId,
        optionId: bets.optionId,
        userId: bets.userId,
        amount: bets.amount,
        status: bets.status,
        payout: bets.payout,
        createdAt: bets.createdAt,
        event: bettingEvents,
        option: bettingOptions,
      })
      .from(bets)
      .innerJoin(bettingEvents, eq(bets.eventId, bettingEvents.id))
      .innerJoin(bettingOptions, eq(bets.optionId, bettingOptions.id))
      .where(eq(bets.userId, userId))
      .orderBy(desc(bets.createdAt));
  }

  async resolveBettingEvent(eventId: string, winningOptionId: string, adminId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(bettingEvents)
        .set({
          status: 'resolved',
          winningOptionId,
          resolvedAt: new Date(),
        })
        .where(eq(bettingEvents.id, eventId));

      const winningBets = await tx
        .select()
        .from(bets)
        .innerJoin(bettingOptions, eq(bets.optionId, bettingOptions.id))
        .where(
          and(
            eq(bets.eventId, eventId),
            eq(bets.optionId, winningOptionId),
            eq(bets.status, 'active')
          )
        );

      for (const { bets: bet, betting_options: option } of winningBets) {
        const payout = Math.floor(bet.amount * parseFloat(option.multiplier));
        
        await tx
          .update(bets)
          .set({ status: 'won', payout })
          .where(eq(bets.id, bet.id));

        await this.updateUserCredits(
          bet.userId,
          payout,
          'bet_win',
          'Betting win payout',
          eventId
        );
      }

      await tx
        .update(bets)
        .set({ status: 'lost' })
        .where(
          and(
            eq(bets.eventId, eventId),
            sql`${bets.optionId} != ${winningOptionId}`,
            eq(bets.status, 'active')
          )
        );
    });
  }

  async getPendingLoans(): Promise<Array<Loan & { borrower: User }>> {
    return await db
      .select({
        id: loans.id,
        borrowerId: loans.borrowerId,
        lenderId: loans.lenderId,
        amount: loans.amount,
        interestRate: loans.interestRate,
        totalRepayment: loans.totalRepayment,
        dueDate: loans.dueDate,
        purpose: loans.purpose,
        status: loans.status,
        fundedAt: loans.fundedAt,
        repaidAt: loans.repaidAt,
        createdAt: loans.createdAt,
        borrower: users,
      })
      .from(loans)
      .innerJoin(users, eq(loans.borrowerId, users.id))
      .where(eq(loans.status, 'pending'))
      .orderBy(desc(loans.createdAt));
  }

  async getUserLoans(userId: string): Promise<Array<Loan & { lender?: User }>> {
    const results = await db
      .select({
        id: loans.id,
        borrowerId: loans.borrowerId,
        lenderId: loans.lenderId,
        amount: loans.amount,
        interestRate: loans.interestRate,
        totalRepayment: loans.totalRepayment,
        dueDate: loans.dueDate,
        purpose: loans.purpose,
        status: loans.status,
        fundedAt: loans.fundedAt,
        repaidAt: loans.repaidAt,
        createdAt: loans.createdAt,
        lender: users,
      })
      .from(loans)
      .leftJoin(users, eq(loans.lenderId, users.id))
      .where(eq(loans.borrowerId, userId))
      .orderBy(desc(loans.createdAt));

    return results as Array<Loan & { lender?: User }>;
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const [created] = await db.insert(loans).values(loan).returning();
    return created;
  }

  async fundLoan(loanId: string, lenderId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [loan] = await tx
        .update(loans)
        .set({
          lenderId,
          status: 'funded',
          fundedAt: new Date(),
        })
        .where(eq(loans.id, loanId))
        .returning();

      if (loan) {
        // Deduct from lender
        await this.updateUserCredits(
          lenderId,
          -loan.amount,
          'loan_funded',
          'Loan funded to another user',
          loanId
        );

        // Credit borrower
        await this.updateUserCredits(
          loan.borrowerId,
          loan.amount,
          'loan_received',
          'Loan received from another user',
          loanId
        );
      }
    });
  }

  async repayLoan(loanId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [loan] = await tx
        .update(loans)
        .set({
          status: 'repaid',
          repaidAt: new Date(),
        })
        .where(eq(loans.id, loanId))
        .returning();

      if (loan && loan.lenderId) {
        // Deduct from borrower
        await this.updateUserCredits(
          loan.borrowerId,
          -loan.totalRepayment,
          'loan_repaid',
          'Loan repayment',
          loanId
        );

        // Credit lender
        await this.updateUserCredits(
          loan.lenderId,
          loan.totalRepayment,
          'loan_repaid_received',
          'Loan repayment received',
          loanId
        );
      }
    });
  }

  async getLeaderboard(): Promise<Array<{ user: User; challengesCompleted: number; weeklyChange: number }>> {
    const leaderboard = await db
      .select({
        user: users,
        challengesCompleted: sql<number>`
          (SELECT COUNT(*) FROM ${challengeSubmissions} 
           WHERE ${challengeSubmissions.userId} = ${users.id} 
           AND ${challengeSubmissions.status} = 'approved')
        `,
      })
      .from(users)
      .orderBy(desc(users.credits))
      .limit(100);

    return leaderboard.map(item => ({
      ...item,
      weeklyChange: 0, // TODO: Calculate weekly change
    }));
  }

  async getUserStats(userId: string): Promise<{
    totalWagered: number;
    totalWon: number;
    winRate: number;
    activeBets: number;
    totalStaked: number;
    rank: number;
    totalUsers: number;
  }> {
    const userBets = await db
      .select()
      .from(bets)
      .where(eq(bets.userId, userId));

    const totalWagered = userBets.reduce((sum, bet) => sum + bet.amount, 0);
    const wonBets = userBets.filter(bet => bet.status === 'won');
    const totalWon = wonBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
    const winRate = userBets.length > 0 ? (wonBets.length / userBets.length) * 100 : 0;
    
    const activeBets = userBets.filter(bet => bet.status === 'active');
    const totalStaked = activeBets.reduce((sum, bet) => sum + bet.amount, 0);

    const [{ count: totalUsers }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [{ rank }] = await db
      .select({ rank: sql<number>`
        (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.credits > (SELECT credits FROM users WHERE id = ${userId}))
      ` })
      .from(users)
      .limit(1);

    return {
      totalWagered,
      totalWon,
      winRate,
      activeBets: activeBets.length,
      totalStaked,
      rank,
      totalUsers,
    };
  }
}

export const storage = new DatabaseStorage();
