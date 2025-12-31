"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DashboardPromptButton({ label }: { label: string }) {
  const [username, setUsername] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "error" | "not-onboarded">("idle");

  const message =
    status === "error"
      ? "Please enter your Twitch username."
      : status === "not-onboarded"
        ? "You haven't been onboarded yet."
        : null;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setUsername("");
          setStatus("idle");
        }
      }}
    >
      <AlertDialogTrigger render={<Button size="lg" />}>
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enter your Twitch username</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="twitch-username">Twitch username</Label>
          <Input
            id="twitch-username"
            placeholder="yourname"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
          {message ? (
            <AlertDialogDescription className="text-sm text-destructive">
              {message}
            </AlertDialogDescription>
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            onClick={() => {
              if (!username.trim()) {
                setStatus("error");
                return;
              }
              setStatus("not-onboarded");
            }}
          >
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
