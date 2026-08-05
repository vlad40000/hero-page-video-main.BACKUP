import type { Metadata } from 'next';
import { LockKeyhole } from 'lucide-react';
import { loginEmployee } from '@/actions/auth';

export const metadata: Metadata = {
  title: 'Employee Inventory Sign In',
  description: 'Authorized Road Runner Appliance inventory access.',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function EmployeeLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMessage =
    params.error === 'invalid'
      ? 'The access password was not accepted.'
      : params.error === 'configuration'
        ? 'Inventory access is locked until the required deployment secrets are configured.'
        : null;

  return (
    <section className="bg-slate-50 px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LockKeyhole className="h-7 w-7" aria-hidden="true" />
        </div>

        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
          Authorized employees only
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Inventory sign in
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Enter the private inventory password to manage products and listings.
        </p>

        {errorMessage ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
          >
            {errorMessage}
          </div>
        ) : null}

        <form action={loginEmployee} className="mt-7 space-y-5">
          <input type="hidden" name="next" value={params.next || '/inventory'} />
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-800">
              Inventory password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
          </div>
          <button
            type="submit"
            className="min-h-12 w-full rounded-xl bg-primary px-5 text-base font-extrabold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
          >
            Open inventory
          </button>
        </form>
      </div>
    </section>
  );
}
