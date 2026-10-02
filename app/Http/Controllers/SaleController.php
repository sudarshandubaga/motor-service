<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Item;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    private function getCurrentTenant(): Tenant
    {
        $tenant = Auth::guard('web')->user()
            ?? request()->attributes->get('tenant')
            ?? app(\App\Services\TenantManager::class)->resolveTenant(request());

        return $tenant;
    }

    /**
     * List sales/invoices for the current tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $query = Sale::where('tenant_id', $tenant->id)
            ->with(['customer', 'items'])
            ->orderBy('id', 'desc');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('mobile_no', 'like', "%{$search}%")
                         ->orWhere('vehicle_no', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('payment_method') && $request->query('payment_method') !== 'All') {
            $query->where('payment_method', $request->query('payment_method'));
        }

        $perPage = min(250, (int) $request->query('per_page', 100));
        $sales = $query->paginate($perPage);

        return response()->json($sales);
    }

    /**
     * Get single sale/invoice with full itemized breakdown.
     */
    public function show($id): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $sale = Sale::where('tenant_id', $tenant->id)
            ->with(['customer', 'items', 'tenant'])
            ->findOrFail($id);

        return response()->json($sale);
    }

    /**
     * Store new POS Sale & Billing.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = $this->getCurrentTenant();

        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'nullable|exists:items,id',
            'items.*.item_name' => 'required|string',
            'items.*.short_name' => 'nullable|string',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.gst_percent' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'points_redeemed' => 'nullable|numeric|min:0',
            'points_discount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|string|in:Cash,Card,UPI,Bank Transfer',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        return DB::transaction(function () use ($tenant, $validated) {
            $subtotal = 0;
            $calculatedTax = 0;

            foreach ($validated['items'] as $it) {
                $lineSubtotal = ($it['unit_price'] * $it['quantity']);
                $subtotal += $lineSubtotal;

                $lineGst = isset($it['gst_percent']) ? (float)$it['gst_percent'] : 0;
                $lineTax = isset($it['tax_amount']) ? (float)$it['tax_amount'] : (($lineSubtotal * $lineGst) / 100);
                $calculatedTax += $lineTax;
            }

            // Points & Discounts
            // Point discount reflects on subtotal without reducing GST amount
            $manualDiscount = (float) ($validated['discount_amount'] ?? 0);
            $pointsRedeemed = (float) ($validated['points_redeemed'] ?? 0);
            $pointsDiscount = isset($validated['points_discount']) ? (float)$validated['points_discount'] : $pointsRedeemed; // 1 point = ₹1
            $totalDiscount = $manualDiscount + $pointsDiscount;

            // GST is computed on subtotal items without being reduced by point discounts
            $tax = isset($validated['tax_amount']) ? (float)$validated['tax_amount'] : $calculatedTax;
            $taxableSubtotalAfterDiscount = max(0, $subtotal - $totalDiscount);
            $totalAmount = round($taxableSubtotalAfterDiscount + $tax, 2);

            // Calculate loyalty points earned for customer on subtotal (exclusive GST)
            $pointsEarned = 0.00;
            $customer = null;
            if (! empty($validated['customer_id'])) {
                $customer = \App\Models\Customer::where('tenant_id', $tenant->id)->find($validated['customer_id']);
                if ($customer) {
                    $pointPercentage = (float) ($tenant->point_percentage ?? 0);
                    if ($pointPercentage > 0) {
                        // Points earned on subtotal (exclusive of GST)
                        $pointsEarned = round(($subtotal * $pointPercentage) / 100, 2);
                    }

                    // Deduct redeemed points and credit earned points
                    $pointsRedeemed = min($pointsRedeemed, (float)($customer->points ?? 0));
                    $newBalance = max(0, round((float)($customer->points ?? 0) - $pointsRedeemed + $pointsEarned, 2));
                    $customer->points = $newBalance;
                    $customer->save();
                }
            }

            // Generate sequence invoice number: INV-YYYYMM-XXXX
            $datePrefix = Carbon::now()->format('Ym');
            $countToday = Sale::where('tenant_id', $tenant->id)
                ->where('invoice_no', 'like', "INV-{$datePrefix}-%")
                ->count() + 1;
            $invoiceNo = sprintf('INV-%s-%04d', $datePrefix, $countToday);

            $sale = Sale::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $validated['customer_id'] ?? null,
                'invoice_no' => $invoiceNo,
                'subtotal' => $subtotal,
                'tax_amount' => $tax,
                'discount_amount' => $totalDiscount,
                'points_earned' => $pointsEarned,
                'points_redeemed' => $pointsRedeemed,
                'points_discount' => $pointsDiscount,
                'total_amount' => $totalAmount,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'Paid',
                'paid_amount' => $validated['paid_amount'] ?? $totalAmount,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $it) {
                $lineSubtotal = ($it['unit_price'] * $it['quantity']);
                $lineGst = isset($it['gst_percent']) ? (float)$it['gst_percent'] : 0;
                $lineTax = isset($it['tax_amount']) ? (float)$it['tax_amount'] : (($lineSubtotal * $lineGst) / 100);

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'item_id' => $it['item_id'] ?? null,
                    'item_name' => $it['item_name'],
                    'short_name' => $it['short_name'] ?? null,
                    'unit_price' => $it['unit_price'],
                    'quantity' => $it['quantity'],
                    'gst_percent' => $lineGst,
                    'tax_amount' => $lineTax,
                    'total_price' => $lineSubtotal,
                ]);
            }

            $freshSale = $sale->load(['customer', 'items', 'tenant']);

            return response()->json([
                'message' => 'Invoice ' . $invoiceNo . ' generated successfully!',
                'sale' => $freshSale,
            ], 201);
        });
    }
}
