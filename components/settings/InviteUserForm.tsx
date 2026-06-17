"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteUserFormProps {
  roles: string[];
  onSubmit?: (data: { email: string; role: string }) => void;
  onCancel?: () => void;
}

export function InviteUserForm({
  roles,
  onSubmit,
  onCancel,
}: InviteUserFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(roles[0] ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && role) {
      onSubmit?.({ email, role });
      setEmail("");
      setRole(roles[0] ?? "");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email" className="text-sm">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="h-9 text-sm border-gray-200 mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="role" className="text-sm">
          Role
        </Label>
        <Select value={role} onValueChange={(v) => setRole(v ?? "")}>
          <SelectTrigger className="h-9 text-sm border-gray-200 mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="border-gray-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
        >
          Send Invite
        </Button>
      </div>
    </form>
  );
}
