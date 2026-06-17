import { Organization, User } from "./types";

export const mockOrgs: Organization[] = [
  {
    id: "1",
    name: "FashionNep",
    subdomain: "fashionnep.khata.app",
    icon: "👗",
    trialDaysLeft: 10,
    status: "trial",
  },
  {
    id: "2",
    name: "TechStore",
    subdomain: "techstore.khata.app",
    icon: "💻",
    trialDaysLeft: 5,
    status: "trial",
  },
];

export const mockUser: User = {
  id: "1",
  name: "Aarav Sharma",
  email: "aarav@example.com",
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
