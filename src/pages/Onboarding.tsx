import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionPlans, useActiveOffers, useCreateSubscription, SubscriptionType } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import walletiqLogo from '@/assets/walletiq-logo.png';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function Onboarding() {
  const navigate = useNavigate();
  const { signUp, user, loading: authLoading } = useAuth();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: offers } = useActiveOffers();
  const createSubscription = useCreateSubscription();
  
  const [step, setStep] = useState<'plan' | 'register'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const getApplicableOffer = (planType: SubscriptionType) => {
    return offers?.find(o => 
      o.for_new_subscribers && 
      o.applicable_plans.includes(planType)
    );
  };

  const getDiscountedPrice = (plan: { price: number; plan_type: SubscriptionType }) => {
    const offer = getApplicableOffer(plan.plan_type);
    if (offer) {
      return plan.price * (1 - offer.discount_percent / 100);
    }
    return plan.price;
  };

  const handlePlanSelect = (planType: SubscriptionType) => {
    setSelectedPlan(planType);
    setStep('register');
  };

  const handleSignupAndSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (!selectedPlan) {
      toast.error('Please select a subscription plan');
      return;
    }

    setIsLoading(true);
    
    try {
      // Step 1: Sign up the user
      const { error: signupError } = await signUp(formData.email, formData.password, formData.fullName);
      
      if (signupError) {
        if (signupError.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in.');
        } else {
          toast.error(signupError.message);
        }
        setIsLoading(false);
        return;
      }

      // Step 2: Create subscription
      const plan = plans?.find(p => p.plan_type === selectedPlan);
      const amountPaid = plan ? getDiscountedPrice(plan) : 0;
      
      await createSubscription.mutateAsync({
        planType: selectedPlan,
        amountPaid: selectedPlan === 'free_trial' ? 0 : amountPaid,
      });

      toast.success('Account created and subscription activated!');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const planFeatures = {
    free_trial: ['14-day full access', 'All features included', 'No credit card required', 'Cancel anytime'],
    monthly: ['Unlimited expense tracking', 'Budget management', 'Reports & analytics', 'Priority support'],
    yearly: ['Everything in Monthly', '2 months free', 'Early access to features', 'Premium support'],
  };

  if (plansLoading || authLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if user is logged in (will redirect via useEffect)
  if (user) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={walletiqLogo} alt="WalletIQ" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">Welcome to WalletIQ</h1>
          <p className="text-primary-foreground/70">Smart expense tracking & financial insights</p>
        </div>

        {step === 'plan' && (
          <>
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
              <div className="w-16 h-1 bg-muted rounded" />
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">2</div>
            </div>

            <h2 className="text-xl font-semibold text-center text-primary-foreground mb-6">Choose Your Plan</h2>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {plans?.map((plan) => {
                const offer = getApplicableOffer(plan.plan_type);
                const discountedPrice = getDiscountedPrice(plan);
                const isPrimary = plan.plan_type === 'yearly';

                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "relative cursor-pointer transition-all border-2 glass",
                      isPrimary ? "border-primary ring-2 ring-primary/20" : "border-border/30 hover:border-primary/50"
                    )}
                    onClick={() => handlePlanSelect(plan.plan_type)}
                  >
                    {isPrimary && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Best Value
                        </Badge>
                      </div>
                    )}
                    {offer && (
                      <div className="absolute -top-3 right-4">
                        <Badge variant="destructive">{offer.discount_percent}% OFF</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-foreground">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        {offer && plan.price > 0 && (
                          <span className="text-muted-foreground line-through text-lg mr-2">
                            ${plan.price}
                          </span>
                        )}
                        <span className="text-3xl font-bold text-foreground">
                          {plan.plan_type === 'free_trial' ? 'Free' : `$${discountedPrice.toFixed(2)}`}
                        </span>
                        {plan.plan_type !== 'free_trial' && (
                          <span className="text-muted-foreground">
                            /{plan.plan_type === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        )}
                      </div>
                      <ul className="text-left space-y-2 mb-4">
                        {planFeatures[plan.plan_type]?.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-primary shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant={isPrimary ? "gradient" : "outline"}
                        className="w-full"
                      >
                        {plan.plan_type === 'free_trial' ? 'Start Free Trial' : 'Select Plan'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="text-center text-primary-foreground/50 text-sm">
              Already have an account?{' '}
              <button onClick={() => navigate('/auth')} className="text-primary hover:underline">
                Sign In
              </button>
            </p>
          </>
        )}

        {step === 'register' && (
          <>
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-full bg-primary/50 text-primary-foreground flex items-center justify-center font-bold">
                <Check className="w-4 h-4" />
              </div>
              <div className="w-16 h-1 bg-primary rounded" />
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
            </div>

            <div className="max-w-md mx-auto">
              <Card className="glass border-border/30">
                <CardHeader className="text-center">
                  <CardTitle>Create Your Account</CardTitle>
                  <CardDescription>
                    You selected: <Badge variant="secondary">{selectedPlan?.replace('_', ' ').toUpperCase()}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignupAndSubscribe} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        className="bg-background/50"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('plan')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        variant="gradient"
                        className="flex-1"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
