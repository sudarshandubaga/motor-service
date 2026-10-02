<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

// API Endpoints for the React Single Page App
Route::prefix('api')->group(function () {
    // Auth & Password Management
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    // Tenant Module (SaaS Tenants & Yearly Subscription)
    Route::get('/tenants', [TenantController::class, 'index']);
    Route::post('/tenants', [TenantController::class, 'store']);
    Route::put('/tenants/{tenant}', [TenantController::class, 'update']);
    Route::post('/tenants/{tenant}/renew', [TenantController::class, 'renewSubscription']);
    Route::post('/tenants/{tenant}/activate-license', [TenantController::class, 'activateLicense']);
    Route::post('/tenants/{tenant}/switch', [TenantController::class, 'switchTenant']);

    // Garage & Loyalty Points Settings
    Route::get('/settings', [TenantController::class, 'getSettings']);
    Route::put('/settings', [TenantController::class, 'updateSettings']);

    // Dashboard Statistics
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Dynamic Categories for Service / Parts
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Items & Services Module
    Route::get('/items', [ItemController::class, 'index']);
    Route::post('/items', [ItemController::class, 'store']);
    Route::put('/items/{id}', [ItemController::class, 'update']);
    Route::delete('/items/{id}', [ItemController::class, 'destroy']);

    // Customer Module
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

    // Sales & POS Billing Module
    Route::get('/sales', [SaleController::class, 'index']);
    Route::get('/sales/{id}', [SaleController::class, 'show']);
    Route::post('/sales', [SaleController::class, 'store']);
});

// Single Page Application entrypoint
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
