import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Sparkles } from "lucide-react";

export const SubscriptionPrompt = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Checkout opened",
          description: "Complete your subscription to unlock full access.",
        });
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Could not start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Start Your 14-Day Free Trial</CardTitle>
        </div>
        <CardDescription>
          Unlock full access to DealFlow and never miss a sale again. $99/month after trial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Real-time chat monitoring
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Automatic buyer detection
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Unlimited streams & claims
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Export to CSV
            </li>
          </ul>
          <Button 
            onClick={handleStartTrial} 
            className="w-full" 
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Start Free Trial - $0 Today"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            No credit card required for trial. Cancel anytime.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
