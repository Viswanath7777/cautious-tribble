import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertChallengeSchema,
  insertChallengeSubmissionSchema,
  insertBettingEventSchema,
  insertBettingOptionSchema,
  insertBetSchema,
  insertLoanSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.characterName) {
        return res.json({ ...user, needsCharacterSetup: true });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Character setup
  app.post('/api/auth/character', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { characterName } = req.body;
      
      if (!characterName || characterName.trim().length === 0) {
        return res.status(400).json({ message: "Character name is required" });
      }
      
      await storage.updateCharacterName(userId, characterName.trim());
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error setting character name:", error);
      res.status(500).json({ message: "Failed to set character name" });
    }
  });

  // Weekly stipend processing (would be called by a cron job)
  app.post('/api/admin/process-stipends', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      await storage.processWeeklyStipends();
      res.json({ message: "Stipends processed successfully" });
    } catch (error) {
      console.error("Error processing stipends:", error);
      res.status(500).json({ message: "Failed to process stipends" });
    }
  });

  // Challenge routes
  app.get('/api/challenges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challenges = await storage.getActiveUserChallenges(userId);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.post('/api/challenges', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const challengeData = insertChallengeSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });

      const challenge = await storage.createChallenge(challengeData);
      res.json(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });

  // Challenge submission routes
  app.post('/api/challenges/:challengeId/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const { challengeId } = req.params;
      const submissionData = insertChallengeSubmissionSchema.parse({
        ...req.body,
        challengeId,
        userId: req.user.claims.sub,
      });

      const submission = await storage.createSubmission(submissionData);
      res.json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.get('/api/admin/submissions/pending', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const submissions = await storage.getPendingSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching pending submissions:", error);
      res.status(500).json({ message: "Failed to fetch pending submissions" });
    }
  });

  app.post('/api/admin/submissions/:submissionId/review', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { submissionId } = req.params;
      const { status } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.reviewSubmission(submissionId, status, req.user.claims.sub);
      res.json({ message: "Submission reviewed successfully" });
    } catch (error) {
      console.error("Error reviewing submission:", error);
      res.status(500).json({ message: "Failed to review submission" });
    }
  });

  // Betting routes
  app.get('/api/betting/events', isAuthenticated, async (req: any, res) => {
    try {
      const events = await storage.getBettingEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching betting events:", error);
      res.status(500).json({ message: "Failed to fetch betting events" });
    }
  });

  app.post('/api/betting/events', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { event, options } = req.body;
      
      const eventData = insertBettingEventSchema.parse({
        ...event,
        createdBy: req.user.claims.sub,
      });

      const optionsData = options.map((option: any) => 
        insertBettingOptionSchema.parse(option)
      );

      const createdEvent = await storage.createBettingEvent(eventData, optionsData);
      res.json(createdEvent);
    } catch (error) {
      console.error("Error creating betting event:", error);
      res.status(500).json({ message: "Failed to create betting event" });
    }
  });

  app.post('/api/betting/events/:eventId/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { eventId } = req.params;
      const { winningOptionId } = req.body;

      await storage.resolveBettingEvent(eventId, winningOptionId, req.user.claims.sub);
      res.json({ message: "Event resolved successfully" });
    } catch (error) {
      console.error("Error resolving betting event:", error);
      res.status(500).json({ message: "Failed to resolve betting event" });
    }
  });

  app.post('/api/bets', isAuthenticated, async (req: any, res) => {
    try {
      const betData = insertBetSchema.parse({
        ...req.body,
        userId: req.user.claims.sub,
      });

      await storage.placeBet(betData);
      res.json({ message: "Bet placed successfully" });
    } catch (error) {
      console.error("Error placing bet:", error);
      res.status(500).json({ message: "Failed to place bet" });
    }
  });

  app.delete('/api/bets/:betId', isAuthenticated, async (req: any, res) => {
    try {
      const { betId } = req.params;
      await storage.cancelBet(betId, req.user.claims.sub);
      res.json({ message: "Bet cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling bet:", error);
      res.status(500).json({ message: "Failed to cancel bet" });
    }
  });

  app.get('/api/users/:userId/bets', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Users can only view their own bets
      if (userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const bets = await storage.getUserBets(userId);
      res.json(bets);
    } catch (error) {
      console.error("Error fetching user bets:", error);
      res.status(500).json({ message: "Failed to fetch user bets" });
    }
  });

  // Loan routes
  app.get('/api/loans/pending', isAuthenticated, async (req: any, res) => {
    try {
      const loans = await storage.getPendingLoans();
      res.json(loans);
    } catch (error) {
      console.error("Error fetching pending loans:", error);
      res.status(500).json({ message: "Failed to fetch pending loans" });
    }
  });

  app.get('/api/users/:userId/loans', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Users can only view their own loans
      if (userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const loans = await storage.getUserLoans(userId);
      res.json(loans);
    } catch (error) {
      console.error("Error fetching user loans:", error);
      res.status(500).json({ message: "Failed to fetch user loans" });
    }
  });

  app.post('/api/loans', isAuthenticated, async (req: any, res) => {
    try {
      const loanData = insertLoanSchema.parse({
        ...req.body,
        borrowerId: req.user.claims.sub,
      });

      const loan = await storage.createLoan(loanData);
      res.json(loan);
    } catch (error) {
      console.error("Error creating loan:", error);
      res.status(500).json({ message: "Failed to create loan" });
    }
  });

  app.post('/api/loans/:loanId/fund', isAuthenticated, async (req: any, res) => {
    try {
      const { loanId } = req.params;
      await storage.fundLoan(loanId, req.user.claims.sub);
      res.json({ message: "Loan funded successfully" });
    } catch (error) {
      console.error("Error funding loan:", error);
      res.status(500).json({ message: "Failed to fund loan" });
    }
  });

  app.post('/api/loans/:loanId/repay', isAuthenticated, async (req: any, res) => {
    try {
      const { loanId } = req.params;
      await storage.repayLoan(loanId);
      res.json({ message: "Loan repaid successfully" });
    } catch (error) {
      console.error("Error repaying loan:", error);
      res.status(500).json({ message: "Failed to repay loan" });
    }
  });

  // Leaderboard route
  app.get('/api/leaderboard', isAuthenticated, async (req: any, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // User stats route
  app.get('/api/users/:userId/stats', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Users can only view their own stats
      if (userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
