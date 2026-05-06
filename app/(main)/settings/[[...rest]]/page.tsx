import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <div className="flex justify-center py-8">
      <UserProfile />
    </div>
  );
}