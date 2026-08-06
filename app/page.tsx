import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect root to admin login by default.
  // Users will bookmark either /admin/login or /company/login.
  redirect('/admin/login');
}