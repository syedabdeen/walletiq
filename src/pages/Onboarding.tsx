import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionPlans, useActiveOffers, useCreateSubscription, useHasActiveSubscription, SubscriptionType } from '@/hooks/useSubscription';
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
  const { signUp, signIn, user, loading: authLoading } = useAuth();
  const { hasActiveSubscription, isLoading: subLoading } = useHasActiveSubscription();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: offers } = useActiveOffers();
  const createSubscription = useCreateSubscription();
  
  const [step, setStep] = useState<'plan' | 'selectPlan' | 'register'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  // If user is already logged in AND has active subscription, redirect to dashboard
  useEffect(() => {
    if (!authLoading && !subLoading && user && hasActiveSubscription) {
      navigate('/');
    }
  }, [user, authLoading, subLoading, hasActiveSubscription, navigate]);

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
    // If user is already logged in, skip registration and directly create subscription
    if (user) {
      handleRenewSubscription(planType);
    } else {
      setStep('register');
    }
  };

  const handleRenewSubscription = async (planType: SubscriptionType) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const plan = plans?.find(p => p.plan_type === planType);
      const amountPaid = plan ? getDiscountedPrice(plan) : 0;
      
      await createSubscription.mutateAsync({
        planType,
        amountPaid: planType === 'free_trial' ? 0 : amountPaid,
      });

      toast.success('Subscription activated!');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
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

  if (plansLoading || authLoading || subLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is logged in but has active subscription, redirect (handled by useEffect)
  // Otherwise, show the plan selection for renewal

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Hero Section - Full screen entry */}
      {step === 'plan' && (
        <div className="flex-1 flex flex-col">
          {/* Top Section - Branding */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            <div className="w-28 h-28 md:w-36 md:h-36 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-md p-4 shadow-glow animate-pulse-slow">
              <img src={walletiqLogo} alt="WalletIQ" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 text-center drop-shadow-lg">WalletIQ</h1>
            <p className="text-lg md:text-xl text-white/90 font-medium text-center max-w-md">
              Smart expense tracking & financial insights
            </p>
          </div>

          {/* Bottom Section - Action Buttons */}
          <div className="bg-card/95 backdrop-blur-lg rounded-t-[2.5rem] shadow-2xl px-6 py-8 md:px-12 md:py-10">
            <div className="max-w-lg mx-auto space-y-4">
              {/* New User - Get Started */}
              <Button
                onClick={() => setStep('selectPlan')}
                variant="gradient"
                className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-glow transition-all duration-300"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Existing User - Sign In */}
              <Button
                onClick={() => navigate('/auth')}
                variant="outline"
                className="w-full h-14 text-lg font-semibold border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300"
              >
                I already have an account
              </Button>

              <p className="text-center text-muted-foreground text-sm pt-4">
                Join thousands managing their finances smarter
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Selection Step */}
      {step === 'selectPlan' && (
        <div className="flex-1 flex flex-col px-4 py-6 overflow-auto">
          <div className="max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
              <p className="text-white/70">Start your journey to financial freedom</p>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {plans?.map((plan) => {
                const offer = getApplicableOffer(plan.plan_type);
                const discountedPrice = getDiscountedPrice(plan);
                const isPrimary = plan.plan_type === 'yearly';

                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "relative cursor-pointer transition-all border-2 glass hover:scale-[1.02]",
                      isPrimary ? "border-primary ring-2 ring-primary/20 shadow-glow" : "border-white/20 hover:border-primary/50"
                    )}
                    onClick={() => handlePlanSelect(plan.plan_type)}
                  >
                    {isPrimary && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground shadow-md">
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
                        className="w-full h-11"
                      >
                        {plan.plan_type === 'free_trial' ? 'Start Free Trial' : 'Select Plan'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <button 
              onClick={() => setStep('plan')} 
              className="flex items-center justify-center gap-2 text-white/70 hover:text-white mx-auto transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Register Step */}
      {step === 'register' && (
        <div className="flex-1 flex flex-col px-4 py-6 overflow-auto">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Create Your Account</h2>
              <p className="text-white/70">
                You selected: <Badge variant="secondary" className="ml-1">{selectedPlan?.replace('_', ' ').toUpperCase()}</Badge>
              </p>
            </div>

            <Card className="glass border-white/20 shadow-2xl">
              <CardContent className="pt-6">
                <form onSubmit={handleSignupAndSubscribe} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      className="bg-background/50 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-background/50 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="bg-background/50 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="bg-background/50 h-12"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('selectPlan')}
                      className="flex-1 h-12"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="gradient"
                      className="flex-1 h-12 font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
