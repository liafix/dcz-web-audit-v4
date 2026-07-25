export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const [{ isLiveProduction, productionConfigurationIssues }, { logApplicationEvent }] = await Promise.all([
    import('@/lib/env'),
    import('@/lib/monitoring/logger'),
  ]);
  if (!isLiveProduction()) return;
  const issues = productionConfigurationIssues();
  if (issues.length > 0) {
    await logApplicationEvent({
      level: 'error',
      event: 'production_configuration_incomplete',
      context: { missingConfiguration: issues },
    });
    throw new Error(`Production configuration is incomplete: ${issues.join(', ')}`);
  }
}
