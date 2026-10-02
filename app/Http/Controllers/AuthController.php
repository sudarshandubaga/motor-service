<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Authenticate tenant login via email and password.
     * The garage domain is automatically resolved from the URL/Host.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Automatically resolve domain from the URL (host / subdomain / query / attributes)
        $resolvedTenant = $request->attributes->get('domain_tenant')
            ?? app(\App\Services\TenantManager::class)->resolveTenant($request);

        $domain = $resolvedTenant?->domain_name;

        if (!$domain) {
            return response()->json([
                'message' => 'No motor service tenant could be identified from this URL.',
            ], 404);
        }

        // Query tenant matching the domain from the URL and the email provided
        $tenant = Tenant::where('domain_name', $domain)
            ->where('email', $credentials['email'])
            ->first();

        if (!$tenant) {
            // Check if tenant exists under another domain
            $otherTenant = Tenant::where('email', $credentials['email'])->first();
            if ($otherTenant) {
                return response()->json([
                    'message' => "Wrong credentials! Please check your email and password.",
                    'errors' => ['email' => ["Login failed! Email does not exists."]],
                ], 422);
            }

            return response()->json([
                'message' => 'Invalid email or password credentials for this garage.',
            ], 422);
        }

        if (!Hash::check($credentials['password'], $tenant->password)) {
            return response()->json([
                'message' => 'Invalid email or password credentials.',
            ], 422);
        }

        if (!$tenant->is_active) {
            return response()->json([
                'message' => 'Your garage account is suspended or inactive. Please contact administration.',
            ], 403);
        }

        Auth::guard('web')->login($tenant, $request->boolean('remember'));
        $request->session()->regenerate();

        if ($request->hasSession()) {
            $request->session()->put('tenant_id', $tenant->id);
            $request->session()->put('tenant_domain', $tenant->domain_name);
        }

        return response()->json([
            'message' => 'Login successful',
            'tenant' => $tenant->fresh(),
            'authenticated' => true,
        ]);
    }



    /**
     * Log out the current tenant and destroy session.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully',
            'authenticated' => false,
        ]);
    }

    /**
     * Get current authenticated tenant info.
     * Returns authenticated: false if no tenant is logged in.
     */
    public function me(Request $request): JsonResponse
    {
        $tenant = Auth::guard('web')->user();

        if (!$tenant) {
            $domainTenant = $request->attributes->get('domain_tenant')
                ?? $request->attributes->get('tenant')
                ?? app(\App\Services\TenantManager::class)->resolveTenant($request);

            return response()->json([
                'authenticated' => false,
                'tenant' => null,
                'domain_info' => $domainTenant ? [
                    'name' => $domainTenant->name,
                    'domain_name' => $domainTenant->domain_name,
                    'currency' => $domainTenant->currency,
                    'email' => $domainTenant->email,
                ] : null,
            ]);
        }

        return response()->json([
            'authenticated' => true,
            'tenant' => $tenant->fresh(),
        ]);
    }

    /**
     * Module 5: Change Password for authenticated tenant.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $tenant = Auth::guard('web')->user();

        if (!$tenant) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $tenant->password)) {
            return response()->json([
                'errors' => ['current_password' => ['The provided current password does not match our records.']],
            ], 422);
        }

        $tenant->password = Hash::make($validated['new_password']);
        $tenant->save();

        return response()->json([
            'message' => 'Password updated successfully!',
        ]);
    }

    /**
     * Module 6: Forgot Password using email - Request reset token.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:tenants,email',
        ], [
            'email.exists' => 'No motor service tenant account found with this email address.',
        ]);

        $token = Str::random(64);

        // Store or update in password_reset_tokens table
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $validated['email']],
            [
                'token' => Hash::make($token),
                'created_at' => Carbon::now(),
            ]
        );

        // For local development and instant testing, we return the token in the response
        // while also simulating email delivery
        return response()->json([
            'message' => 'Password reset instructions and token have been generated for ' . $validated['email'],
            'demo_token' => $token, // Provides a hassle-free demo experience!
            'email' => $validated['email'],
        ]);
    }

    /**
     * Module 6: Reset Password using email token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:tenants,email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (!$record) {
            return response()->json([
                'message' => 'Invalid or expired password reset token.',
            ], 422);
        }

        // Verify token (check plain or hash)
        $tokenValid = Hash::check($validated['token'], $record->token) || $validated['token'] === $record->token;

        if (!$tokenValid) {
            return response()->json([
                'message' => 'The provided reset token is incorrect.',
            ], 422);
        }

        // Check expiry (60 minutes)
        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            return response()->json([
                'message' => 'This password reset token has expired. Please request a new one.',
            ], 422);
        }

        $tenant = Tenant::where('email', $validated['email'])->first();
        $tenant->password = Hash::make($validated['password']);
        $tenant->save();

        // Delete used token
        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        // Automatically log tenant in
        Auth::guard('web')->login($tenant);

        return response()->json([
            'message' => 'Password reset successfully! You are now logged in.',
            'tenant' => $tenant->fresh(),
        ]);
    }
}
