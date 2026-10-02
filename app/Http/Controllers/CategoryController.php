<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Item;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    private function getCurrentTenant(): Tenant
    {
        $tenant = Auth::guard('web')->user()
            ?? request()->attributes->get('tenant')
            ?? app(\App\Services\TenantManager::class)->resolveTenant(request());

        return $tenant;
    }

    /**
     * List all categories for the current tenant.
     * Auto-seeds standard categories if none exist yet.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $count = Category::where('tenant_id', $tenant->id)->count();

        // Auto-seed default categories if empty
        if ($count === 0) {
            $defaultCategories = [
                ['name' => 'Engine & Lube', 'type' => 'Both', 'description' => 'Motor oil, lubricants, filters & fluids'],
                ['name' => 'Brakes & Wheels', 'type' => 'Both', 'description' => 'Brake pads, rotors, shoes, tyres & alignment'],
                ['name' => 'Electrical & Battery', 'type' => 'Both', 'description' => 'Battery replacement, alternators, wiring & lights'],
                ['name' => 'Suspension & Steering', 'type' => 'Both', 'description' => 'Shocks, struts, bushings, ball joints & steering rack'],
                ['name' => 'AC & Heating', 'type' => 'Both', 'description' => 'Cabin filter, refrigerant gas refill & compressor'],
                ['name' => 'Car Wash & Detailing', 'type' => 'Service', 'description' => 'Foam wash, interior vacuuming & exterior polish'],
                ['name' => 'Periodic Inspection', 'type' => 'Service', 'description' => 'Comprehensive multi-point vehicle health checkup'],
                ['name' => 'General Spare Parts', 'type' => 'Part', 'description' => 'Replacement parts, belts, spark plugs & hardware'],
            ];

            // Also check any existing items categories
            $existingItemCats = Item::where('tenant_id', $tenant->id)
                ->whereNotNull('category')
                ->where('category', '!=', '')
                ->distinct()
                ->pluck('category')
                ->toArray();

            $existingNames = array_column($defaultCategories, 'name');
            foreach ($existingItemCats as $catName) {
                if (! in_array($catName, $existingNames, true)) {
                    $defaultCategories[] = [
                        'name' => $catName,
                        'type' => 'Both',
                        'description' => 'Custom Category',
                    ];
                }
            }

            foreach ($defaultCategories as $cat) {
                Category::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'name' => $cat['name']],
                    [
                        'type' => $cat['type'] ?? 'Both',
                        'description' => $cat['description'] ?? null,
                        'is_active' => true,
                    ]
                );
            }
        }

        $query = Category::where('tenant_id', $tenant->id);

        if ($request->filled('type') && $request->query('type') !== 'All') {
            $type = $request->query('type');
            $query->where(function ($q) use ($type) {
                $q->where('type', $type)->orWhere('type', 'Both');
            });
        }

        $categories = $query->orderBy('name')->get();

        // Calculate item counts for each category
        $itemCounts = Item::where('tenant_id', $tenant->id)
            ->selectRaw('category, count(*) as total')
            ->groupBy('category')
            ->pluck('total', 'category')
            ->toArray();

        $formatted = $categories->map(function ($cat) use ($itemCounts) {
            $cat->items_count = $itemCounts[$cat->name] ?? 0;
            return $cat;
        });

        return response()->json([
            'categories' => $formatted,
        ]);
    }

    /**
     * Store a new Category.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories', 'name')->where('tenant_id', $tenant->id),
            ],
            'type' => 'nullable|string|in:Service,Part,Both',
            'description' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        $category = Category::create([
            'tenant_id' => $tenant->id,
            'name' => trim($validated['name']),
            'type' => $validated['type'] ?? 'Both',
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $category->items_count = 0;

        return response()->json([
            'message' => "Category '{$category->name}' created successfully",
            'category' => $category,
        ], 201);
    }

    /**
     * Update an existing Category.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $category = Category::where('tenant_id', $tenant->id)->findOrFail($id);
        $oldName = $category->name;

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories', 'name')
                    ->where('tenant_id', $tenant->id)
                    ->ignore($category->id),
            ],
            'type' => 'nullable|string|in:Service,Part,Both',
            'description' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        $newName = trim($validated['name']);

        $category->update([
            'name' => $newName,
            'type' => $validated['type'] ?? $category->type,
            'description' => $validated['description'] ?? $category->description,
            'is_active' => $validated['is_active'] ?? $category->is_active,
        ]);

        // If category name was renamed, cascade update to Item records
        if ($oldName !== $newName) {
            Item::where('tenant_id', $tenant->id)
                ->where('category', $oldName)
                ->update(['category' => $newName]);
        }

        $itemsCount = Item::where('tenant_id', $tenant->id)
            ->where('category', $newName)
            ->count();
        $category->items_count = $itemsCount;

        return response()->json([
            'message' => "Category '{$category->name}' updated successfully",
            'category' => $category,
        ]);
    }

    /**
     * Delete a Category.
     */
    public function destroy($id): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $category = Category::where('tenant_id', $tenant->id)->findOrFail($id);

        $itemsCount = Item::where('tenant_id', $tenant->id)
            ->where('category', $category->name)
            ->count();

        // If items exist in this category, reassign them to 'General Spare Parts' or 'General'
        if ($itemsCount > 0) {
            Item::where('tenant_id', $tenant->id)
                ->where('category', $category->name)
                ->update(['category' => 'General Spare Parts']);
        }

        $categoryName = $category->name;
        $category->delete();

        return response()->json([
            'message' => "Category '{$categoryName}' deleted successfully",
            'reassigned_items' => $itemsCount,
        ]);
    }
}
