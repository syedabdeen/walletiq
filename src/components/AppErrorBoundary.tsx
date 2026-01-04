import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Avoid printing potentially sensitive data; keep it high-level.
    console.error("[AppErrorBoundary] Unhandled error", { message: error.message, errorInfo });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Card className="glass border-border/30">
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                The app hit an unexpected error. You can return to the login screen or force-refresh cached files.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="gradient" onClick={() => (window.location.href = "/auth")}
              >
                Go to Login
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => (window.location.href = "/auth?resetCache=1")}
              >
                Reset Cache & Reload
              </Button>
              <p className="text-xs text-muted-foreground break-words">
                Error: {this.state.error.message}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
}
