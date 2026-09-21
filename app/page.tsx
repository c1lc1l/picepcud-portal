"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Picepcud Portal</CardTitle>
          <CardDescription>
            Theme check — colors are driven by CSS variables in{" "}
            <code className="font-mono text-xs">app/globals.css</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input placeholder="Type something..." />
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => toast("Theme is wired up correctly.")}
          >
            Test button
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
