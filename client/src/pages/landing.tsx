import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-primary font-mono cyber-grid scan-line-overlay">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold glitch-text mb-4 text-primary">
              CYBERCREDIT ARENA
            </h1>
            <p className="text-xl text-accent mb-2">
              COMPETITIVE CYBERPUNK CLASS GAME
            </p>
            <p className="text-muted-foreground">
              Earn credits • Climb leaderboards • Place bets • Survive the grid
            </p>
          </div>

          <Card className="terminal-window max-w-2xl mx-auto mb-8">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="space-y-4">
                  <div className="neon-border p-4 bg-card">
                    <h3 className="text-accent font-bold mb-2">
                      <i className="fas fa-tasks mr-2"></i>CHALLENGES
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Complete coding challenges to earn credits and climb the permanent leaderboard
                    </p>
                  </div>
                  
                  <div className="neon-border p-4 bg-card">
                    <h3 className="text-accent font-bold mb-2">
                      <i className="fas fa-dice mr-2"></i>BETTING
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Wager credits on events with multipliers. Risk it all or play it safe
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="neon-border p-4 bg-card">
                    <h3 className="text-accent font-bold mb-2">
                      <i className="fas fa-trophy mr-2"></i>LEADERBOARD
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Permanent credit rankings. No weekly resets. Every credit counts forever
                    </p>
                  </div>
                  
                  <div className="neon-border p-4 bg-card">
                    <h3 className="text-accent font-bold mb-2">
                      <i className="fas fa-handshake mr-2"></i>LOANS
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Out of credits? Request peer loans or fund others for profit
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-accent text-sm mb-2">START WITH 1000 CREDITS + 200 WEEKLY</p>
              <Button 
                className="cyber-button px-8 py-4 text-lg font-bold"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-login"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                INITIALIZE CONNECTION
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              By entering the grid, you agree to the cyberpunk code of conduct. 
              Credits are permanent. Rankings are forever. Trust no one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
