import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Reports</h1>
      <Card>
        <CardHeader><CardTitle className="text-sm">Export Transactions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input type="date" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm"><Download className="mr-1.5 h-3.5 w-3.5" />Export CSV</Button>
            <Button size="sm" variant="outline"><Download className="mr-1.5 h-3.5 w-3.5" />Export JSON</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
