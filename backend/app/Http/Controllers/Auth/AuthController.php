<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ── Login ──────────────────────────────────────────────────
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        // Utilisateur introuvable
        if (!$user) {
            return response()->json(['message' => 'Incorrect email or password.'], 401);
        }

        // Compte bloqué
        if ($user->isLocked()) {
            return response()->json([
                'message' => 'Account temporarily locked. Try again in 30 minutes.',
            ], 423);
        }

        // Compte inactif
        if (!$user->active) {
            return response()->json(['message' => 'Account disabled. Please contact the administrator.'], 403);
        }

        // Wrong password
        if (!Hash::check($request->password, $user->password)) {
            $user->incrementFailedAttempts();

            $remaining = 5 - $user->failed_login_attempts;
            $message   = $remaining > 0
                ? "Incorrect password. $remaining attempt(s) remaining."
                : 'Account locked for 30 minutes.';

            return response()->json(['message' => $message], 401);
        }

        // Success - reset the attempts and create the token
        $user->resetFailedAttempts();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Signed in successfully.',
            'token'   => $token,
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }

    // ── Me (profil connecté) ───────────────────────────────────
    public function me(Request $request)
    {
        $user = $request->user()->load(['coach', 'client']);

        return response()->json([
            'id'     => $user->id,
            'name'   => $user->name,
            'email'  => $user->email,
            'role'   => $user->role,
            'active' => $user->active,
            'profile' => $user->role === 'coach' ? $user->coach : $user->client,
        ]);
    }

    // ── Logout ─────────────────────────────────────────────────
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Signed out successfully.']);
    }

    // ── Forgot Password ────────────────────────────────────────
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email not found.'], 404);
        }

        $status = Password::sendResetLink(['email' => $request->email]);

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Reset email sent.']);
        }

        return response()->json(['message' => 'Error: ' . $status], 500);
    }

    // ── Reset Password ─────────────────────────────────────────
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                $user->tokens()->delete(); // invalide tous les tokens existants
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Password reset successfully.'])
            : response()->json(['message' => 'Invalid or expired token.'], 400);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|string|min:8|confirmed',
            'telephone'      => 'nullable|string',
            'date_naissance' => 'nullable|date',
            'specialite'     => 'required|string',
            'plan'           => 'required|string|in:mensuel,trimestriel,annuel',
            'payment_method' => 'required|string|in:card,cash',
        ]);

        // Déterminer le montant annuel selon le plan
        $montant = 3600.00;
        if ($request->plan === 'trimestriel') $montant = 3200.00;
        if ($request->plan === 'annuel') $montant = 2800.00;

        // Assigner un coach de cette spécialité (le premier trouvé ou null si aucun)
        $coach = DB::table('coaches')->where('specialite', $request->specialite)->inRandomOrder()->first();
        $coach_id = $coach ? $coach->id : null;

        return DB::transaction(function () use ($request, $montant, $coach_id) {
            $user = User::create([
                'name'     => $request->name,
                'email'    => $request->email,
                'password' => Hash::make($request->password),
                'role'     => 'client',
                'active'   => true,
            ]);

            $client = \App\Models\Client::create([
                'user_id'          => $user->id,
                'nom'              => explode(' ', $request->name, 2)[1] ?? $request->name,
                'prenom'           => explode(' ', $request->name, 2)[0],
                'telephone'        => $request->telephone,
                'date_naissance'   => $request->date_naissance,
                'date_inscription' => now()->toDateString(),
                'statut'           => 'actif',
                'coach_id'         => $coach_id,
            ]);

            $cotisation = \App\Models\Cotisation::create([
                'client_id'        => $client->id,
                'annee'            => now()->year,
                'montant_annuel'   => $montant,
                'statut'           => 'active',
                'date_inscription' => now()->toDateString(),
                'date_expiration'  => now()->addYear()->toDateString(),
            ]);

            // Si le client a payé par carte, on enregistre le premier paiement
            if ($request->payment_method === 'card') {
                $premiereEcheance = $cotisation->echeances()->where('numero', 1)->first();
                if ($premiereEcheance) {
                    \App\Models\Paiement::create([
                        'echeance_id'    => $premiereEcheance->id,
                        'enregistre_par' => $user->id,
                        'date_paiement'  => now(),
                        'montant'        => $premiereEcheance->montant,
                        'methode'        => 'carte',
                        'notes'          => 'Paiement initial lors de l\'inscription en ligne.',
                    ]);
                }
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Account created successfully. Welcome!',
                'token'   => $token,
                'user'    => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->role,
                ],
            ], 201);
        });
    }
}
