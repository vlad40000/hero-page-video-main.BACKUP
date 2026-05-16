export function formatUsd(value: unknown): string {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return 'Price pending';

    return `$${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
