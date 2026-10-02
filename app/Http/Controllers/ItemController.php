<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ItemController extends Controller
{
    private function getCurrentTenant(): Tenant
    {
        $tenant = request()->attributes->get('tenant')
            ?? Auth::guard('web')->user()
            ?? app(\App\Services\TenantManager::class)->resolveTenant(request());

        return $tenant;
    }

    /**
     * List items/services for the current tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $query = Item::where('tenant_id', $tenant->id);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('short_name', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category') && $request->query('category') !== 'All') {
            $query->where('category', $request->query('category'));
        }

        $items = $query->orderBy('name')->get();

        // Get unique categories for filters
        $categories = Item::where('tenant_id', $tenant->id)
            ->distinct()
            ->pluck('category');

        return response()->json([
            'items' => $items,
            'categories' => $categories,
        ]);
    }

    /**
     * Store new Item / Service.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:100',
            'price' => 'required|numeric|min:0',
            'gst_percent' => 'nullable|numeric|min:0|max:100',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        $shortName = ! empty($validated['short_name']) ? strtoupper(trim($validated['short_name'])) : null;

        $item = Item::create([
            'tenant_id' => $tenant->id,
            'name' => $validated['name'],
            'short_name' => $shortName,
            'category' => $validated['category'] ?? 'Service',
            'price' => $validated['price'],
            'gst_percent' => $validated['gst_percent'] ?? 18.00,
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Service/Item added successfully',
            'item' => $item,
        ], 201);
    }

    /**
     * Update Item / Service.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $item = Item::where('tenant_id', $tenant->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:100',
            'price' => 'required|numeric|min:0',
            'gst_percent' => 'nullable|numeric|min:0|max:100',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        $shortName = ! empty($validated['short_name']) ? strtoupper(trim($validated['short_name'])) : null;

        $item->update([
            'name' => $validated['name'],
            'short_name' => $shortName,
            'category' => $validated['category'] ?? 'Service',
            'price' => $validated['price'],
            'gst_percent' => $validated['gst_percent'] ?? $item->gst_percent ?? 18.00,
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Service/Item updated successfully',
            'item' => $item,
        ]);
    }

    /**
     * Delete Item / Service.
     */
    public function destroy($id): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $item = Item::where('tenant_id', $tenant->id)->findOrFail($id);
        $item->delete();

        return response()->json([
            'message' => 'Service/Item deleted successfully',
        ]);
    }
}
