<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;

use App\Models\AdminNotification;
use App\Models\User;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
        ResetPassword::createUrlUsing(function ($user, string $token) {
            $lien = 'http://localhost:5173/reset-password?token=' . $token . '&email=' . urlencode($user->email);

            AdminNotification::create([
                'type'       => 'reset_password',
                'titre'      => 'Password reset request',
                'message'    => $user->name . ' requested a password reset.',
                'lien'       => $lien,
                'lien_label' => 'Copy the reset link',
                'lu'         => false,
            ]);

            return $lien;
        });
    }
}
