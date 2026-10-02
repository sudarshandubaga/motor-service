<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CustomerController extends Controller
{
    private function getCurrentTenant(): Tenant
    {
        $tenant = request()->attributes->get('tenant')
            ?? Auth::guard('web')->user()
            ?? app(\App\Services\TenantManager::class)->resolveTenant(request());

        return $tenant;
    }

    /**
     * List customers for current tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $query = Customer::where('tenant_id', $tenant->id)
            ->withCount('sales');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile_no', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('vehicle_no', 'like', "%{$search}%");
            });
        }

        $customers = $query->orderBy('name')->get();

        return response()->json($customers);
    }

    /**
     * Store new customer.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'vehicle_no' => 'required|string|max:50',
            'mobile_no' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'vehicle_model' => 'nullable|string|max:100',
            'points' => 'nullable|numeric|min:0',
        ]);

        $customer = Customer::create([
            'tenant_id' => $tenant->id,
            'name' => $validated['name'],
            'vehicle_no' => strtoupper(trim($validated['vehicle_no'])),
            'mobile_no' => $validated['mobile_no'] ?? null,
            'email' => $validated['email'] ?? null,
            'address' => $validated['address'] ?? null,
            'vehicle_model' => $validated['vehicle_model'] ?? null,
            'points' => isset($validated['points']) ? (float)$validated['points'] : 0.00,
        ]);

        return response()->json([
            'message' => 'Customer created successfully',
            'customer' => $customer,
        ], 201);
    }

    /**
     * Update customer.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $customer = Customer::where('tenant_id', $tenant->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'vehicle_no' => 'required|string|max:50',
            'mobile_no' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'vehicle_model' => 'nullable|string|max:100',
            'points' => 'nullable|numeric|min:0',
        ]);

        $validated['vehicle_no'] = strtoupper(trim($validated['vehicle_no']));
        if (isset($validated['points'])) {
            $validated['points'] = (float)$validated['points'];
        }
        $customer->update($validated);

        return response()->json([
            'message' => 'Customer updated successfully',
            'customer' => $customer,
        ]);
    }

    /**
     * Delete customer.
     */
    public function destroy($id): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $customer = Customer::where('tenant_id', $tenant->id)->findOrFail($id);
        $customer->delete();

        return response()->json([
            'message' => 'Customer deleted successfully',
        ]);
    }
}
