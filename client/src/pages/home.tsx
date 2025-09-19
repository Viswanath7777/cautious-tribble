import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  difficulty: string;
  expiresAt: string;
}

interface BettingEvent {
  id: string;
  title: string;
  description: string;
  status: string;
  closesAt: string;
  options: BettingOption[];
  totalBets: number;
}

interface BettingOption {
  id: string;
  label: string;
  multiplier: string;
}

interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  totalRepayment: number;
  dueDate: string;
  purpose?: string;
  status: string;
  borrower?: User;
  lender?: User;
}

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  characterName: string | null;
  credits: number;
  lastStipendDate: Date | null;
  isAdmin: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  needsCharacterSetup?: boolean;
}

interface LeaderboardEntry {
  user: User;
  challengesCompleted: number;
  weeklyChange: number;
}

export default function Home() {
  const { user, isLoading } = useAuth() as { user: User | null; isLoading: boolean; isAuthenticated: boolean };
  const [activeTab, setActiveTab] = useState("dashboard");
  const [characterName, setCharacterName] = useState("");
  const [showCharacterSetup, setShowCharacterSetup] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user needs character setup
  useEffect(() => {
    if (user && !user.characterName) {
      setShowCharacterSetup(true);
    }
  }, [user]);

  // Character setup mutation
  const characterMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/auth/character", { characterName: name });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowCharacterSetup(false);
      toast({
        title: "Character Created",
        description: "Welcome to the CyberCredit Arena!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to set character name. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Data queries
  const { data: challenges = [] } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
    enabled: !!user?.characterName,
  });

  const { data: bettingEvents = [] } = useQuery<BettingEvent[]>({
    queryKey: ["/api/betting/events"],
    enabled: !!user?.characterName,
  });

  const { data: pendingLoans = [] } = useQuery<Loan[]>({
    queryKey: ["/api/loans/pending"],
    enabled: !!user?.characterName,
  });

  const { data: userLoans = [] } = useQuery<Loan[]>({
    queryKey: ["/api/users", user?.id, "loans"],
    enabled: !!user?.characterName && !!user?.id,
  });

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    enabled: !!user?.characterName,
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/users", user?.id, "stats"],
    enabled: !!user?.characterName && !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-primary font-mono cyber-grid scan-line-overlay flex items-center justify-center">
        <div className="text-center">
          <div className="glitch-text text-2xl mb-4">INITIALIZING...</div>
          <div className="text-muted-foreground">Connecting to the grid...</div>
        </div>
      </div>
    );
  }

  if (showCharacterSetup) {
    return (
      <div className="min-h-screen bg-black text-primary font-mono cyber-grid scan-line-overlay">
        <div className="container mx-auto px-4 py-16 max-w-md">
          <Card className="terminal-window">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold glitch-text mb-2">CONNECTION ESTABLISHED</h1>
                <p className="text-muted-foreground">Set your operative handle</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-semibold mb-2 text-primary">CHARACTER HANDLE</Label>
                  <Input
                    className="cyber-input"
                    placeholder="Neo47"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    maxLength={20}
                    data-testid="input-character-name"
                  />
                </div>
                
                <Button 
                  className="cyber-button w-full py-3 font-semibold"
                  onClick={() => characterMutation.mutate(characterName)}
                  disabled={characterMutation.isPending || !characterName.trim()}
                  data-testid="button-deploy-operative"
                >
                  <i className="fas fa-user-plus mr-2"></i>
                  {characterMutation.isPending ? "DEPLOYING..." : "DEPLOY OPERATIVE"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-primary font-mono cyber-grid scan-line-overlay">
      {/* Header */}
      <header className="status-bar p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold glitch-text">CYBERCREDIT ARENA</h1>
            <div className="flex items-center space-x-2">
              <i className="fas fa-user text-accent"></i>
              <span data-testid="text-character-name">{user?.characterName}</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <i className="fas fa-coins text-accent"></i>
              <span className="credit-display" data-testid="text-credits">{user?.credits?.toLocaleString() || "0"}</span>
              <span className="text-xs text-muted-foreground">CREDITS</span>
            </div>
            <Button 
              className="cyber-button px-4 py-2" 
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto">
            <TabsList className="flex space-x-0 bg-transparent">
              <TabsTrigger 
                value="dashboard" 
                className="nav-tab px-6 py-3"
                data-testid="tab-dashboard"
              >
                <i className="fas fa-tachometer-alt mr-2"></i>DASHBOARD
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard" 
                className="nav-tab px-6 py-3"
                data-testid="tab-leaderboard"
              >
                <i className="fas fa-trophy mr-2"></i>LEADERBOARD
              </TabsTrigger>
              <TabsTrigger 
                value="bets" 
                className="nav-tab px-6 py-3"
                data-testid="tab-bets"
              >
                <i className="fas fa-dice mr-2"></i>BETTING
              </TabsTrigger>
              <TabsTrigger 
                value="loans" 
                className="nav-tab px-6 py-3"
                data-testid="tab-loans"
              >
                <i className="fas fa-handshake mr-2"></i>LOANS
              </TabsTrigger>
              {user?.isAdmin && (
                <TabsTrigger 
                  value="admin" 
                  className="nav-tab px-6 py-3"
                  data-testid="tab-admin"
                >
                  <i className="fas fa-cog mr-2"></i>ADMIN
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

        <main className="max-w-7xl mx-auto p-6">
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-0">
            <DashboardContent 
              challenges={challenges} 
              userStats={userStats}
              user={user}
            />
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-0">
            <LeaderboardContent leaderboard={leaderboard} user={user} />
          </TabsContent>

          {/* Betting Tab */}
          <TabsContent value="bets" className="mt-0">
            <BettingContent 
              bettingEvents={bettingEvents} 
              userStats={userStats}
              user={user}
            />
          </TabsContent>

          {/* Loans Tab */}
          <TabsContent value="loans" className="mt-0">
            <LoansContent 
              pendingLoans={pendingLoans} 
              userLoans={userLoans}
              user={user}
            />
          </TabsContent>

          {/* Admin Tab */}
          {user?.isAdmin && (
            <TabsContent value="admin" className="mt-0">
              <AdminContent />
            </TabsContent>
          )}
        </main>
      </Tabs>
    </div>
  );
}

// Dashboard Component
function DashboardContent({ challenges, userStats, user }: { challenges: Challenge[]; userStats: any; user: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const submitProofMutation = useMutation({
    mutationFn: async ({ challengeId, proofText, proofUrl }: { challengeId: string; proofText: string; proofUrl?: string }) => {
      const response = await apiRequest("POST", `/api/challenges/${challengeId}/submissions`, {
        proofText,
        proofUrl: proofUrl || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setSelectedChallenge(null);
      setProofText("");
      setProofUrl("");
      toast({
        title: "Submission Successful",
        description: "Your proof has been submitted for review.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Submission Failed",
        description: "Failed to submit proof. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Challenges */}
      <Card className="terminal-window">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
            <i className="fas fa-tasks mr-2"></i>ACTIVE CHALLENGES
          </h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {challenges.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No active challenges available
              </p>
            ) : (
              challenges.map((challenge) => (
                <div key={challenge.id} className="neon-border p-4 bg-card" data-testid={`card-challenge-${challenge.id}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-accent">{challenge.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      EXPIRES: {new Date(challenge.expiresAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <span className="text-accent font-bold">+{challenge.reward} CREDITS</span>
                      <Badge className="text-xs">{challenge.difficulty}</Badge>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="cyber-button px-3 py-1 text-xs"
                          onClick={() => setSelectedChallenge(challenge)}
                          data-testid={`button-submit-proof-${challenge.id}`}
                        >
                          SUBMIT PROOF
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="terminal-window">
                        <DialogHeader>
                          <DialogTitle className="text-primary">SUBMIT CHALLENGE PROOF</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-primary">PROOF TEXT</Label>
                            <Textarea
                              className="cyber-input"
                              placeholder="Describe your solution and results..."
                              value={proofText}
                              onChange={(e) => setProofText(e.target.value)}
                              data-testid="textarea-proof-text"
                            />
                          </div>
                          <div>
                            <Label className="text-primary">PROOF URL (OPTIONAL)</Label>
                            <Input
                              className="cyber-input"
                              placeholder="https://github.com/username/project"
                              value={proofUrl}
                              onChange={(e) => setProofUrl(e.target.value)}
                              data-testid="input-proof-url"
                            />
                          </div>
                          <div className="flex space-x-3">
                            <Button
                              className="cyber-button flex-1"
                              onClick={() => selectedChallenge && submitProofMutation.mutate({
                                challengeId: selectedChallenge.id,
                                proofText,
                                proofUrl,
                              })}
                              disabled={submitProofMutation.isPending || !proofText.trim()}
                              data-testid="button-submit-proof"
                            >
                              <i className="fas fa-paper-plane mr-2"></i>
                              {submitProofMutation.isPending ? "SUBMITTING..." : "SUBMIT"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="terminal-window">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
            <i className="fas fa-chart-line mr-2"></i>SYSTEM STATUS
          </h2>
          
          <div className="space-y-4">
            <div className="neon-border p-3 bg-card">
              <div className="flex justify-between items-center">
                <span className="text-sm">Weekly Stipend</span>
                <span className="text-accent font-bold">+200 CREDITS</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Next payment: Auto-credited weekly
              </div>
            </div>

            {userStats && (
              <>
                <div className="neon-border p-3 bg-card">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Leaderboard Rank</span>
                    <span className="text-secondary font-bold" data-testid="text-user-rank">
                      #{userStats.rank} / {userStats.totalUsers}
                    </span>
                  </div>
                </div>

                <div className="neon-border p-3 bg-card">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Bets</span>
                    <span className="text-primary font-bold">{userStats.activeBets} OPEN</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Total staked: {userStats.totalStaked} credits
                  </div>
                </div>

                <div className="neon-border p-3 bg-card">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Win Rate</span>
                    <span className="text-accent font-bold">{userStats.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Net profit: +{userStats.totalWon - userStats.totalWagered}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Leaderboard Component
function LeaderboardContent({ leaderboard, user }: { leaderboard: LeaderboardEntry[]; user: any }) {
  return (
    <Card className="terminal-window">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
          <i className="fas fa-trophy mr-2"></i>CREDIT LEADERBOARD
          <span className="text-xs text-muted-foreground ml-4">PERMANENT RANKINGS - NO RESETS</span>
        </h2>
        
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>RANK</th>
                <th>OPERATIVE</th>
                <th>CREDITS</th>
                <th>CHALLENGES</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr 
                  key={entry.user.id} 
                  className={entry.user.id === user?.id ? "bg-primary bg-opacity-10" : ""}
                  data-testid={`row-leaderboard-${index}`}
                >
                  <td className="text-accent font-bold">#{index + 1}</td>
                  <td className={`text-primary ${entry.user.id === user?.id ? "font-bold" : ""}`}>
                    {entry.user.characterName}
                    {entry.user.id === user?.id && " (YOU)"}
                  </td>
                  <td className="text-accent font-bold">{entry.user.credits.toLocaleString()}</td>
                  <td className="text-muted-foreground">{entry.challengesCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Betting Component
function BettingContent({ bettingEvents, userStats, user }: { bettingEvents: BettingEvent[]; userStats: any; user: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [betAmount, setBetAmount] = useState("");
  const [selectedOption, setSelectedOption] = useState<{ eventId: string; optionId: string } | null>(null);

  const { data: userBets = [] } = useQuery<Array<any>>({
    queryKey: ["/api/users", user?.id, "bets"],
    enabled: !!user?.id,
  });

  const placeBetMutation = useMutation({
    mutationFn: async ({ eventId, optionId, amount }: { eventId: string; optionId: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/bets", {
        eventId,
        optionId,
        amount,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/betting/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setSelectedOption(null);
      setBetAmount("");
      toast({
        title: "Bet Placed",
        description: "Your bet has been placed successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Bet Failed",
        description: "Failed to place bet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelBetMutation = useMutation({
    mutationFn: async (betId: string) => {
      const response = await apiRequest("DELETE", `/api/bets/${betId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/betting/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Bet Cancelled",
        description: "Your bet has been cancelled and refunded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Cancel Failed",
        description: "Failed to cancel bet. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Active Betting Events */}
      <div className="lg:col-span-2">
        <Card className="terminal-window">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
              <i className="fas fa-dice mr-2"></i>ACTIVE BETTING EVENTS
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {bettingEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No active betting events
                </p>
              ) : (
                bettingEvents.map((event) => {
                  const userBet = userBets.find((bet: any) => bet.eventId === event.id && bet.status === 'active');
                  
                  return (
                    <div 
                      key={event.id} 
                      className={`neon-border p-4 bg-card ${userBet ? 'border-secondary' : ''}`}
                      data-testid={`card-betting-event-${event.id}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-accent">{event.title}</h3>
                          {event.closesAt && (
                            <p className="text-xs text-muted-foreground">
                              Closes: {new Date(event.closesAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={event.status === 'open' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {event.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {event.options.map((option) => {
                          const isUserChoice = userBet?.optionId === option.id;
                          
                          return (
                            <div 
                              key={option.id} 
                              className={`flex justify-between items-center p-2 rounded ${
                                isUserChoice ? 'bg-secondary bg-opacity-20 border border-secondary' : 'bg-muted bg-opacity-20'
                              }`}
                            >
                              <span className="text-sm">{option.label}</span>
                              <div className="flex items-center space-x-3">
                                <span className="text-accent font-bold">{option.multiplier}x</span>
                                {isUserChoice ? (
                                  <>
                                    <span className="text-secondary font-bold">STAKED: {userBet.amount}</span>
                                    <Button 
                                      className="cyber-button bg-destructive border-destructive px-3 py-1 text-xs"
                                      onClick={() => cancelBetMutation.mutate(userBet.id)}
                                      disabled={cancelBetMutation.isPending}
                                      data-testid={`button-cancel-bet-${userBet.id}`}
                                    >
                                      CANCEL
                                    </Button>
                                  </>
                                ) : event.status === 'open' && !userBet ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        className="cyber-button px-3 py-1 text-xs"
                                        onClick={() => setSelectedOption({ eventId: event.id, optionId: option.id })}
                                        data-testid={`button-place-bet-${option.id}`}
                                      >
                                        BET
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="terminal-window">
                                      <DialogHeader>
                                        <DialogTitle className="text-primary">PLACE BET</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <p className="text-sm text-muted-foreground mb-2">
                                            Betting on: <span className="text-accent">{option.label}</span>
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            Multiplier: <span className="text-accent">{option.multiplier}x</span>
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-primary">BET AMOUNT</Label>
                                          <Input
                                            type="number"
                                            className="cyber-input"
                                            placeholder="100"
                                            value={betAmount}
                                            onChange={(e) => setBetAmount(e.target.value)}
                                            max={user?.credits || 0}
                                            data-testid="input-bet-amount"
                                          />
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Available: {user?.credits || 0} credits
                                          </p>
                                        </div>
                                        <Button
                                          className="cyber-button w-full"
                                          onClick={() => {
                                            if (selectedOption && betAmount) {
                                              placeBetMutation.mutate({
                                                eventId: selectedOption.eventId,
                                                optionId: selectedOption.optionId,
                                                amount: parseInt(betAmount),
                                              });
                                            }
                                          }}
                                          disabled={placeBetMutation.isPending || !betAmount || parseInt(betAmount) <= 0}
                                          data-testid="button-confirm-bet"
                                        >
                                          {placeBetMutation.isPending ? "PLACING BET..." : "PLACE BET"}
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Total bets: {event.totalBets}
                        {userBet && (
                          <> • Your stake: {userBet.amount} credits (potential win: {Math.floor(userBet.amount * parseFloat(userBet.option.multiplier))})</>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Betting History & Stats */}
      <Card className="terminal-window">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center">
            <i className="fas fa-history mr-2"></i>YOUR BETS
          </h2>
          
          {userStats && (
            <div className="space-y-4 mb-6">
              <div className="neon-border p-3 bg-card">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">TOTAL WAGERED</span>
                  <span className="text-primary font-bold">{userStats.totalWagered}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">TOTAL WON</span>
                  <span className="text-accent font-bold">{userStats.totalWon}</span>
                </div>
              </div>

              <div className="neon-border p-3 bg-card">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">WIN RATE</span>
                  <span className="text-accent font-bold">{userStats.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">NET PROFIT</span>
                  <span className="text-accent font-bold">+{userStats.totalWon - userStats.totalWagered}</span>
                </div>
              </div>
            </div>
          )}

          <h3 className="text-sm font-semibold text-primary mb-3">RECENT BETS</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {userBets.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No bets placed yet
              </p>
            ) : (
              userBets.slice(0, 10).map((bet: any) => (
                <div key={bet.id} className="neon-border p-2 bg-card text-xs" data-testid={`card-bet-${bet.id}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-muted-foreground truncate">{bet.event.title}</span>
                    <Badge 
                      variant={bet.status === 'won' ? 'default' : bet.status === 'lost' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {bet.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Staked: {bet.amount}</span>
                    {bet.status === 'won' && <span className="text-accent">Won: {bet.payout}</span>}
                    {bet.status === 'lost' && <span className="text-destructive">Lost: {bet.amount}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loans Component
function LoansContent({ pendingLoans, userLoans, user }: { pendingLoans: Loan[]; userLoans: Loan[]; user: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [repaymentDays, setRepaymentDays] = useState("7");
  const [purpose, setPurpose] = useState("");

  const createLoanMutation = useMutation({
    mutationFn: async (loanData: any) => {
      const response = await apiRequest("POST", "/api/loans", loanData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "loans"] });
      setLoanAmount("");
      setInterestRate("");
      setPurpose("");
      toast({
        title: "Loan Request Created",
        description: "Your loan request is now available for funding.",
      });
    },
    onError: (error) => {
      toast({
        title: "Request Failed",
        description: "Failed to create loan request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const fundLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const response = await apiRequest("POST", `/api/loans/${loanId}/fund`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Loan Funded",
        description: "You have successfully funded the loan.",
      });
    },
    onError: (error) => {
      toast({
        title: "Funding Failed",
        description: "Failed to fund loan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const repayLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const response = await apiRequest("POST", `/api/loans/${loanId}/repay`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Loan Repaid",
        description: "Your loan has been successfully repaid.",
      });
    },
    onError: (error) => {
      toast({
        title: "Repayment Failed",
        description: "Failed to repay loan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateLoan = () => {
    if (!loanAmount || !interestRate) return;
    
    const amount = parseInt(loanAmount);
    const rate = parseInt(interestRate);
    const days = parseInt(repaymentDays);
    const totalRepayment = Math.floor(amount * (1 + rate / 100));
    const dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    createLoanMutation.mutate({
      amount,
      interestRate: rate,
      totalRepayment,
      dueDate,
      purpose: purpose || undefined,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Request Loan */}
      <Card className="terminal-window">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
            <i className="fas fa-hand-holding-usd mr-2"></i>REQUEST CREDIT LOAN
          </h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <Label className="block text-sm font-semibold mb-2 text-primary">LOAN AMOUNT</Label>
              <Input
                type="number"
                className="cyber-input"
                placeholder="500"
                max="1000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                data-testid="input-loan-amount"
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum: 1,000 credits</p>
            </div>
            
            <div>
              <Label className="block text-sm font-semibold mb-2 text-primary">INTEREST RATE (%)</Label>
              <Input
                type="number"
                className="cyber-input"
                placeholder="10"
                min="5"
                max="50"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                data-testid="input-interest-rate"
              />
              <p className="text-xs text-muted-foreground mt-1">5% - 50% (higher rates get funded faster)</p>
            </div>
            
            <div>
              <Label className="block text-sm font-semibold mb-2 text-primary">REPAYMENT DEADLINE</Label>
              <Select value={repaymentDays} onValueChange={setRepaymentDays}>
                <SelectTrigger className="cyber-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="block text-sm font-semibold mb-2 text-primary">PURPOSE (OPTIONAL)</Label>
              <Textarea
                className="cyber-input"
                placeholder="Reason for loan request..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                data-testid="textarea-loan-purpose"
              />
            </div>
          </div>
          
          <Button 
            className="cyber-button w-full py-3 font-semibold"
            onClick={handleCreateLoan}
            disabled={createLoanMutation.isPending || !loanAmount || !interestRate}
            data-testid="button-request-loan"
          >
            <i className="fas fa-paper-plane mr-2"></i>
            {createLoanMutation.isPending ? "SUBMITTING..." : "SUBMIT LOAN REQUEST"}
          </Button>
          
          <div className="mt-4 p-3 bg-muted bg-opacity-20 rounded text-xs text-muted-foreground">
            <i className="fas fa-info-circle mr-1"></i>
            Loans must be repaid by the deadline or additional penalties apply.
          </div>
        </CardContent>
      </Card>

      {/* Available Loans & Your Loans */}
      <div className="space-y-6">
        {/* Available Loans to Fund */}
        <Card className="terminal-window">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-primary mb-4 flex items-center">
              <i className="fas fa-piggy-bank mr-2"></i>FUND LOANS
            </h2>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {pendingLoans.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No pending loan requests
                </p>
              ) : (
                pendingLoans.map((loan) => (
                  <div key={loan.id} className="neon-border p-3 bg-card" data-testid={`card-pending-loan-${loan.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-semibold text-accent">{loan.amount} CREDITS</div>
                        <div className="text-xs text-muted-foreground">by {loan.borrower?.characterName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-accent">{loan.interestRate}% APR</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.ceil((new Date(loan.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    </div>
                    {loan.purpose && (
                      <div className="text-xs text-muted-foreground mb-2">
                        Purpose: {loan.purpose}
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-accent">Potential return: {loan.totalRepayment} credits</span>
                      <Button 
                        className="cyber-button px-3 py-1 text-xs"
                        onClick={() => fundLoanMutation.mutate(loan.id)}
                        disabled={fundLoanMutation.isPending || (user?.credits || 0) < loan.amount}
                        data-testid={`button-fund-loan-${loan.id}`}
                      >
                        FUND
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Your Active Loans */}
        <Card className="terminal-window">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-primary mb-4 flex items-center">
              <i className="fas fa-receipt mr-2"></i>YOUR LOANS
            </h2>
            
            <div className="space-y-3">
              {userLoans.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-4">
                  <i className="fas fa-check-circle mr-1 text-accent"></i>
                  No active loans
                </div>
              ) : (
                userLoans.map((loan) => (
                  <div key={loan.id} className="neon-border p-3 bg-card border-secondary" data-testid={`card-user-loan-${loan.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-semibold text-accent">BORROWED: {loan.amount}</div>
                        {loan.lender && (
                          <div className="text-xs text-muted-foreground">from {loan.lender.characterName}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-destructive">DUE: {loan.totalRepayment}</div>
                        <div className="text-xs text-muted-foreground">
                          in {Math.ceil((new Date(loan.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    </div>
                    {loan.status === 'funded' && (
                      <Button 
                        className="cyber-button w-full py-2 text-xs"
                        onClick={() => repayLoanMutation.mutate(loan.id)}
                        disabled={repayLoanMutation.isPending || (user?.credits || 0) < loan.totalRepayment}
                        data-testid={`button-repay-loan-${loan.id}`}
                      >
                        {repayLoanMutation.isPending ? "REPAYING..." : "REPAY LOAN"}
                      </Button>
                    )}
                    {loan.status === 'pending' && (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        Waiting for funding...
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Admin Component
function AdminContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeReward, setChallengeReward] = useState("");
  const [challengeDifficulty, setChallengeDifficulty] = useState("Easy");
  const [challengeExpiration, setChallengeExpiration] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventOptions, setEventOptions] = useState("");
  const [eventCloses, setEventCloses] = useState("");

  const { data: pendingSubmissions = [] } = useQuery<Array<any>>({
    queryKey: ["/api/admin/submissions/pending"],
  });

  const { data: bettingEvents = [] } = useQuery<Array<any>>({
    queryKey: ["/api/betting/events"],
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (challengeData: any) => {
      const response = await apiRequest("POST", "/api/challenges", challengeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setChallengeTitle("");
      setChallengeDescription("");
      setChallengeReward("");
      setChallengeExpiration("");
      toast({
        title: "Challenge Created",
        description: "New challenge has been deployed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: "Failed to create challenge. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reviewSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, status }: { submissionId: string; status: 'approved' | 'rejected' }) => {
      const response = await apiRequest("POST", `/api/admin/submissions/${submissionId}/review`, { status });
      return response.json();
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions/pending"] });
      toast({
        title: status === 'approved' ? "Submission Approved" : "Submission Rejected",
        description: status === 'approved' ? "Credits have been awarded." : "Submission has been rejected.",
      });
    },
    onError: (error) => {
      toast({
        title: "Review Failed",
        description: "Failed to review submission. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createBettingEventMutation = useMutation({
    mutationFn: async ({ event, options }: { event: any; options: any[] }) => {
      const response = await apiRequest("POST", "/api/betting/events", { event, options });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/betting/events"] });
      setEventTitle("");
      setEventOptions("");
      setEventCloses("");
      toast({
        title: "Event Created",
        description: "New betting event has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: "Failed to create betting event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resolveBettingEventMutation = useMutation({
    mutationFn: async ({ eventId, winningOptionId }: { eventId: string; winningOptionId: string }) => {
      const response = await apiRequest("POST", `/api/betting/events/${eventId}/resolve`, { winningOptionId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/betting/events"] });
      toast({
        title: "Event Resolved",
        description: "Betting event resolved and payouts distributed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Resolution Failed",
        description: "Failed to resolve betting event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateChallenge = () => {
    if (!challengeTitle || !challengeDescription || !challengeReward || !challengeExpiration) return;

    createChallengeMutation.mutate({
      title: challengeTitle,
      description: challengeDescription,
      reward: parseInt(challengeReward),
      difficulty: challengeDifficulty,
      expiresAt: new Date(challengeExpiration),
    });
  };

  const handleCreateBettingEvent = () => {
    if (!eventTitle || !eventOptions) return;

    const options = eventOptions.split('\n').map(line => {
      const [label, multiplier] = line.split(':');
      return {
        label: label.trim(),
        multiplier: parseFloat(multiplier.replace('x', '')) || 2.0,
      };
    }).filter(option => option.label);

    const event = {
      title: eventTitle,
      closesAt: eventCloses ? new Date(eventCloses) : null,
    };

    createBettingEventMutation.mutate({ event, options });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Challenge Management */}
        <Card className="terminal-window">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
              <i className="fas fa-plus-circle mr-2"></i>CREATE CHALLENGE
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-semibold mb-2 text-primary">CHALLENGE TITLE</Label>
                <Input
                  className="cyber-input"
                  placeholder="Neural Network Optimization"
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                  data-testid="input-challenge-title"
                />
              </div>
              
              <div>
                <Label className="block text-sm font-semibold mb-2 text-primary">DESCRIPTION</Label>
                <Textarea
                  className="cyber-input"
                  placeholder="Detailed challenge requirements..."
                  value={challengeDescription}
                  onChange={(e) => setChallengeDescription(e.target.value)}
                  data-testid="textarea-challenge-description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-semibold mb-2 text-primary">REWARD</Label>
                  <Input
                    type="number"
                    className="cyber-input"
                    placeholder="500"
                    value={challengeReward}
                    onChange={(e) => setChallengeReward(e.target.value)}
                    data-testid="input-challenge-reward"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-semibold mb-2 text-primary">DIFFICULTY</Label>
                  <Select value={challengeDifficulty} onValueChange={setChallengeDifficulty}>
                    <SelectTrigger className="cyber-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                      <SelectItem value="Extreme">Extreme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label className="block text-sm font-semibold mb-2 text-primary">EXPIRATION</Label>
                <Input
                  type="datetime-local"
                  className="cyber-input"
                  value={challengeExpiration}
                  onChange={(e) => setChallengeExpiration(e.target.value)}
                  data-testid="input-challenge-expiration"
                />
              </div>
            </div>
            
            <Button 
              className="cyber-button w-full py-3 font-semibold mt-6"
              onClick={handleCreateChallenge}
              disabled={createChallengeMutation.isPending}
              data-testid="button-create-challenge"
            >
              <i className="fas fa-rocket mr-2"></i>
              {createChallengeMutation.isPending ? "DEPLOYING..." : "DEPLOY CHALLENGE"}
            </Button>
          </CardContent>
        </Card>

        {/* Submission Review */}
        <Card className="terminal-window">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
              <i className="fas fa-clipboard-check mr-2"></i>PENDING SUBMISSIONS
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pendingSubmissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending submissions
                </p>
              ) : (
                pendingSubmissions.map((submission: any) => (
                  <div key={submission.id} className="neon-border p-4 bg-card" data-testid={`card-submission-${submission.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-accent">{submission.challenge.title}</h3>
                        <p className="text-xs text-muted-foreground">by {submission.user.characterName}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">PENDING</Badge>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground mb-2">Submission Text:</p>
                      <p className="text-xs bg-muted bg-opacity-20 p-2 rounded">
                        {submission.proofText}
                      </p>
                    </div>
                    
                    {submission.proofUrl && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-1">Proof URL:</p>
                        <a href={submission.proofUrl} target="_blank" rel="noopener noreferrer" className="text-accent text-xs underline">
                          {submission.proofUrl}
                        </a>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        className="cyber-button bg-accent border-accent text-accent-foreground flex-1 py-2 text-xs"
                        onClick={() => reviewSubmissionMutation.mutate({ submissionId: submission.id, status: 'approved' })}
                        disabled={reviewSubmissionMutation.isPending}
                        data-testid={`button-approve-${submission.id}`}
                      >
                        <i className="fas fa-check mr-1"></i>APPROVE (+{submission.challenge.reward})
                      </Button>
                      <Button
                        className="cyber-button bg-destructive border-destructive flex-1 py-2 text-xs"
                        onClick={() => reviewSubmissionMutation.mutate({ submissionId: submission.id, status: 'rejected' })}
                        disabled={reviewSubmissionMutation.isPending}
                        data-testid={`button-reject-${submission.id}`}
                      >
                        <i className="fas fa-times mr-1"></i>REJECT
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Betting Event Management */}
      <Card className="terminal-window">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
            <i className="fas fa-dice-d6 mr-2"></i>BETTING EVENT MANAGEMENT
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4">CREATE EVENT</h3>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-semibold mb-2 text-primary">EVENT TITLE</Label>
                  <Input
                    className="cyber-input"
                    placeholder="Who will complete the next challenge first?"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    data-testid="input-event-title"
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-semibold mb-2 text-primary">BETTING OPTIONS (one per line)</Label>
                  <Textarea
                    className="cyber-input"
                    placeholder="Option 1:1.5x&#10;Option 2:2.0x&#10;Option 3:3.5x"
                    value={eventOptions}
                    onChange={(e) => setEventOptions(e.target.value)}
                    data-testid="textarea-event-options"
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-semibold mb-2 text-primary">CLOSES AT</Label>
                  <Input
                    type="datetime-local"
                    className="cyber-input"
                    value={eventCloses}
                    onChange={(e) => setEventCloses(e.target.value)}
                    data-testid="input-event-closes"
                  />
                </div>
                
                <Button 
                  className="cyber-button w-full py-2"
                  onClick={handleCreateBettingEvent}
                  disabled={createBettingEventMutation.isPending}
                  data-testid="button-create-event"
                >
                  {createBettingEventMutation.isPending ? "CREATING..." : "CREATE EVENT"}
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4">ACTIVE EVENTS</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {bettingEvents.filter((event: any) => event.status === 'open').map((event: any) => (
                  <div key={event.id} className="neon-border p-3 bg-card" data-testid={`card-admin-event-${event.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-semibold text-accent">{event.title}</h4>
                      <Badge variant="default" className="text-xs">OPEN</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Total bets: {event.totalBets}</p>
                    <div className="mb-2">
                      <Label className="text-xs text-muted-foreground">SELECT WINNER:</Label>
                      <Select onValueChange={(optionId) => resolveBettingEventMutation.mutate({ eventId: event.id, winningOptionId: optionId })}>
                        <SelectTrigger className="cyber-input text-xs h-8">
                          <SelectValue placeholder="Choose winner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {event.options.map((option: any) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
