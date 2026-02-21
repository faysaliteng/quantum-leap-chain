import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-3">
              <AlertTriangle className="h-10 w-10 mx-auto text-warning" />
              <h2 className="font-semibold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">{this.state.error?.message}</p>
              <Button size="sm" variant="outline" onClick={() => this.setState({ hasError: false })}>Try again</Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
