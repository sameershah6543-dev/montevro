import { requireUser } from "@/lib/auth";
import { PasswordForm, ProfileForm } from "@/components/store/ProfileForms";

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");
  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <section className="border border-line bg-white/60 p-6">
        <h2 className="font-display text-2xl">Profile</h2>
        <ProfileForm name={user.name} phone={user.phone ?? ""} email={user.email} />
      </section>
      <section className="border border-line bg-white/60 p-6">
        <h2 className="font-display text-2xl">Change password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
