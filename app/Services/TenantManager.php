<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Http\Request;

class TenantManager
{
    protected ?Tenant $tenant = null;

    /**
     * Resolve the active tenant from the domain / host / query parameter.
     * Returns null if no registered tenant matches the domain.
     */
    public function resolveTenant(Request $request): ?Tenant
    {
        if ($this->tenant) {
            return $this->tenant;
        }

        // 1. Check explicit domain query parameter (?domain=speedy-motors) or X-Tenant-Domain header
        $explicitDomain = $request->query('domain') ?: $request->header('X-Tenant-Domain');
        if ($explicitDomain) {
            $this->tenant = Tenant::where('domain_name', $explicitDomain)->first();
            if ($this->tenant) {
                return $this->tenant;
            }
        }

        // 2. Resolve from HTTP Host
        $host = strtolower($request->getHost());

        // A. Direct exact match with domain_name (e.g. "speedy-motors" or "speedy-motors.com")
        $this->tenant = Tenant::where('domain_name', $host)->first();
        if ($this->tenant) {
            return $this->tenant;
        }

        // B. Subdomain match (e.g. "speedy-motors.localhost" or "speedy-motors.moterservice.com")
        $parts = explode('.', $host);
        if (count($parts) > 1) {
            $subdomain = $parts[0];
            if (! in_array($subdomain, ['www', 'app', 'admin', 'api'])) {
                $this->tenant = Tenant::where('domain_name', $subdomain)->first();
                if ($this->tenant) {
                    return $this->tenant;
                }
            }
        }

        // 3. Fallback to session domain if previously resolved on this browser
        if ($request->hasSession() && $request->session()->has('tenant_domain')) {
            $sessionDomain = $request->session()->get('tenant_domain');
            $this->tenant = Tenant::where('domain_name', $sessionDomain)->first();
            if ($this->tenant) {
                return $this->tenant;
            }
        }

        // If domain is not matched to any tenant in DB, return null so 404 is shown
        return null;
    }

    public function getTenant(): ?Tenant
    {
        return $this->tenant;
    }

    public function setTenant(Tenant $tenant): void
    {
        $this->tenant = $tenant;
    }
}
