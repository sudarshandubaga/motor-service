<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Item;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Demo Tenant (Motor Service Shop Owner)
        $tenant = Tenant::updateOrCreate(
            ['email' => 'owner@speedywheels.com'],
            [
                'name' => 'Speedy Wheels Motor Service',
                'domain_name' => 'speedy-motors',
                'email' => 'owner@speedywheels.com',
                'password' => Hash::make('password123'),
                'phone' => '+1 (555) 234-5678',
                'address' => '742 Evergreen Road, Motor City, CA 90210',
                'currency' => '₹',
                'subscription_plan' => 'Annual Garage Pro (Yearly)',
                'subscription_price' => 499.00,
                'expires_at' => Carbon::now()->addYear(),
                'is_active' => true,
            ]
        );

        // Demo Tenant 2 (for testing multi-tenancy)
        $tenant2 = Tenant::updateOrCreate(
            ['email' => 'admin@primeauto.com'],
            [
                'name' => 'Prime Auto & Performance',
                'domain_name' => 'prime-auto',
                'email' => 'admin@primeauto.com',
                'password' => Hash::make('password123'),
                'phone' => '+1 (555) 876-5432',
                'address' => '108 Industrial Parkway, Austin, TX 78701',
                'currency' => '₹',
                'subscription_plan' => 'Annual Enterprise Garage',
                'subscription_price' => 799.00,
                'expires_at' => Carbon::now()->addYear(),
                'is_active' => true,
            ]
        );

        // 2. Create Items & Services for Tenant 1
        $services = [
            [
                'name' => 'Synthetic Engine Oil & Filter Change',
                'short_name' => 'OIL-SYN',
                'category' => 'Engine & Lube',
                'price' => 75.00,
                'description' => 'Full synthetic 5W-30 engine oil with OEM filter replacement and inspection.',
            ],
            [
                'name' => 'Front Ceramic Brake Pad Replacement',
                'short_name' => 'BRK-PAD-F',
                'category' => 'Brakes & Safety',
                'price' => 120.00,
                'description' => 'Premium ceramic brake pads replacement for both front wheels with rotor cleaning.',
            ],
            [
                'name' => '4-Wheel Computerized Alignment & Balancing',
                'short_name' => 'ALIGN-4W',
                'category' => 'Wheels & Tires',
                'price' => 65.00,
                'description' => 'Laser 4-wheel alignment and dynamic tire balancing.',
            ],
            [
                'name' => 'Comprehensive 50-Point Vehicle Inspection',
                'short_name' => 'INSPECT-50',
                'category' => 'Inspection',
                'price' => 45.00,
                'description' => 'Detailed 50-point diagnostic check of engine, suspension, electronics, and fluids.',
            ],
            [
                'name' => 'AC Gas Recharge & Leak Detection Test',
                'short_name' => 'AC-GAS-R134',
                'category' => 'AC & Climate',
                'price' => 85.00,
                'description' => 'Evacuation and recharge of R134a refrigerant, compressor test and UV dye leak detection.',
            ],
            [
                'name' => 'Full Car Foam Wash & Interior Detailing',
                'short_name' => 'WASH-PREM',
                'category' => 'Detailing',
                'price' => 35.00,
                'description' => 'High pressure snow foam body wash, vacuum, dashboard polish, and tire gloss.',
            ],
            [
                'name' => 'Spark Plug Replacement (Set of 4)',
                'short_name' => 'PLUG-IRID',
                'category' => 'Engine & Lube',
                'price' => 60.00,
                'description' => 'High efficiency Iridium spark plugs replacement for optimal fuel combustion.',
            ],
            [
                'name' => 'Automatic Transmission Fluid Flush (ATF)',
                'short_name' => 'ATF-FLUSH',
                'category' => 'Transmission',
                'price' => 140.00,
                'description' => 'Complete flush and replacement of transmission fluid with torque converter cycle.',
            ],
            [
                'name' => 'Coolant Radiator Flush & Refill',
                'short_name' => 'COOLANT-RAD',
                'category' => 'Cooling System',
                'price' => 55.00,
                'description' => 'Anti-rust radiator flush and replenishment of long-life ethylene glycol coolant.',
            ],
            [
                'name' => '12V 65Ah Maintenance-Free Car Battery',
                'short_name' => 'BAT-12V65',
                'category' => 'Electrical',
                'price' => 115.00,
                'description' => 'Heavy duty 12V 65Ah sealed lead-acid battery with 2-year replacement warranty.',
            ],
        ];

        $createdItems = [];
        foreach ($services as $srv) {
            $createdItems[] = Item::updateOrCreate(
                ['tenant_id' => $tenant->id, 'short_name' => $srv['short_name']],
                [
                    'name' => $srv['name'],
                    'category' => $srv['category'],
                    'price' => $srv['price'],
                    'description' => $srv['description'],
                    'is_active' => true,
                ]
            );
        }

        // Add some items for Tenant 2 to confirm tenant segregation
        foreach (array_slice($services, 0, 4) as $srv) {
            Item::updateOrCreate(
                ['tenant_id' => $tenant2->id, 'short_name' => $srv['short_name']],
                [
                    'name' => $srv['name'],
                    'category' => $srv['category'],
                    'price' => $srv['price'] + 10,
                    'description' => $srv['description'],
                    'is_active' => true,
                ]
            );
        }

        // 3. Create Customers for Tenant 1
        $customersData = [
            [
                'name' => 'Rajesh Sharma',
                'mobile_no' => '+1 (555) 432-1098',
                'email' => 'rajesh.sharma@example.com',
                'address' => '142 Oakridge Avenue, Apt 4B',
                'vehicle_no' => 'CA-7XYZ99',
                'vehicle_model' => 'Honda Civic EX 2021',
            ],
            [
                'name' => 'Priya Patel',
                'mobile_no' => '+1 (555) 321-9876',
                'email' => 'priya.patel@example.com',
                'address' => '88 Blossom Hill Road',
                'vehicle_no' => 'CA-3KLM45',
                'vehicle_model' => 'Hyundai Creta 2022',
            ],
            [
                'name' => 'Michael Chen',
                'mobile_no' => '+1 (555) 654-3210',
                'email' => 'michael.chen@example.com',
                'address' => '512 Sunset Boulevard',
                'vehicle_no' => 'CA-9PQR12',
                'vehicle_model' => 'Toyota RAV4 2020',
            ],
            [
                'name' => 'Sarah Johnson',
                'mobile_no' => '+1 (555) 789-0123',
                'email' => 'sarah.j@example.com',
                'address' => '23 Maple Crest Drive',
                'vehicle_no' => 'CA-5ABC88',
                'vehicle_model' => 'Ford F-150 XLT 2019',
            ],
        ];

        $createdCustomers = [];
        foreach ($customersData as $c) {
            $createdCustomers[] = Customer::updateOrCreate(
                ['tenant_id' => $tenant->id, 'mobile_no' => $c['mobile_no']],
                [
                    'name' => $c['name'],
                    'email' => $c['email'],
                    'address' => $c['address'],
                    'vehicle_no' => $c['vehicle_no'],
                    'vehicle_model' => $c['vehicle_model'],
                ]
            );
        }

        // 4. Create sample initial POS Sales & Billing
        if (Sale::where('tenant_id', $tenant->id)->count() === 0) {
            // Sale 1
            $sale1 = Sale::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $createdCustomers[0]->id,
                'invoice_no' => 'INV-' . date('Ym') . '-0001',
                'subtotal' => 195.00,
                'tax_amount' => 15.60,
                'discount_amount' => 10.00,
                'total_amount' => 200.60,
                'payment_method' => 'Card',
                'payment_status' => 'Paid',
                'paid_amount' => 200.60,
                'notes' => 'Customer requested synthetic oil and brake pads inspection.',
                'created_at' => Carbon::now()->subDays(2),
            ]);

            SaleItem::create([
                'sale_id' => $sale1->id,
                'item_id' => $createdItems[0]->id,
                'item_name' => $createdItems[0]->name,
                'short_name' => $createdItems[0]->short_name,
                'unit_price' => 75.00,
                'quantity' => 1,
                'total_price' => 75.00,
            ]);

            SaleItem::create([
                'sale_id' => $sale1->id,
                'item_id' => $createdItems[1]->id,
                'item_name' => $createdItems[1]->name,
                'short_name' => $createdItems[1]->short_name,
                'unit_price' => 120.00,
                'quantity' => 1,
                'total_price' => 120.00,
            ]);

            // Sale 2
            $sale2 = Sale::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $createdCustomers[1]->id,
                'invoice_no' => 'INV-' . date('Ym') . '-0002',
                'subtotal' => 100.00,
                'tax_amount' => 8.00,
                'discount_amount' => 0.00,
                'total_amount' => 108.00,
                'payment_method' => 'Cash',
                'payment_status' => 'Paid',
                'paid_amount' => 110.00,
                'notes' => 'Wheel alignment and premium detailing.',
                'created_at' => Carbon::now()->subDay(),
            ]);

            SaleItem::create([
                'sale_id' => $sale2->id,
                'item_id' => $createdItems[2]->id,
                'item_name' => $createdItems[2]->name,
                'short_name' => $createdItems[2]->short_name,
                'unit_price' => 65.00,
                'quantity' => 1,
                'total_price' => 65.00,
            ]);

            SaleItem::create([
                'sale_id' => $sale2->id,
                'item_id' => $createdItems[5]->id,
                'item_name' => $createdItems[5]->name,
                'short_name' => $createdItems[5]->short_name,
                'unit_price' => 35.00,
                'quantity' => 1,
                'total_price' => 35.00,
            ]);
        }
    }
}
