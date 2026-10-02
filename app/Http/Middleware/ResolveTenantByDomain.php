<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenantByDomain
{
    public function __construct(protected TenantManager $tenantManager)
    {
    }

    /**
     * Handle an incoming request and bind tenant from domain.
     * Shows a 404 page if domain does not match any registered tenant.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $this->tenantManager->resolveTenant($request);

        if (! $tenant) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'error' => 'Garage Not Found',
                    'message' => 'No motor service tenant found for domain: ' . $request->getHost(),
                ], 404);
            }

            return response()->view('tenant_not_found', [
                'domain' => $request->getHost(),
                'registeredTenants' => Tenant::where('is_active', true)->select('name', 'domain_name')->get(),
            ], 404);
        }

        // Set in request attributes and session
        $request->attributes->set('tenant', $tenant);

        if ($request->hasSession()) {
            $request->session()->put('tenant_id', $tenant->id);
            $request->session()->put('tenant_domain', $tenant->domain_name);
        }

        // Associate user to session auth guard
        Auth::guard('web')->setUser($tenant);

        // Share to Blade templates
        view()->share('currentTenant', $tenant);

        return $next($request);
    }
}
