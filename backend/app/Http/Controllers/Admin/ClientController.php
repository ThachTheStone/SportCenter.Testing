<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Coach;
use App\Models\User;
use App\Models\Cotisation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::with(['user', 'coach', 'cotisations.echeances']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('nom', 'like', "%{$request->search}%")
                    ->orWhere('prenom', 'like', "%{$request->search}%")
                    ->orWhereHas('user', fn($q) => $q->where('email', 'like', "%{$request->search}%"));
            });
        }

        if ($request->statut) {
            $query->where('statut', $request->statut);
        }

        if ($request->coach_id) {
            $query->where('coach_id', $request->coach_id);
        }

        $clients = $query->orderByDesc('created_at')->paginate(10);

        return response()->json($clients);
    }

    public function store(Request $request)
    {
        $request->validate([
            'prenom'         => 'required|string',
            'nom'            => 'required|string',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|min:8',
            'coach_id'       => 'required|exists:coaches,id',
            'montant_annuel' => 'required|numeric|min:0',
            'telephone'      => 'nullable|string',
            'date_naissance' => 'nullable|date',
            'adresse'        => 'nullable|string',
        ]);

        $user = User::create([
            'name'     => $request->prenom . ' ' . $request->nom,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'client',
            'active'   => true,
        ]);

        $client = Client::create([
            'user_id'          => $user->id,
            'coach_id'         => $request->coach_id,
            'nom'              => $request->nom,
            'prenom'           => $request->prenom,
            'telephone'        => $request->telephone,
            'date_naissance'   => $request->date_naissance,
            'adresse'          => $request->adresse,
            'statut'           => 'actif',
            'date_inscription' => now()->toDateString(),
        ]);

        Cotisation::create([
            'client_id'        => $client->id,
            'montant_annuel'   => $request->montant_annuel,
            'statut'           => 'active',
            'date_inscription' => $client->date_inscription,
            'date_expiration'  => now()->addYear()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Client created successfully.',
            'client'  => $client->load(['user', 'coach']),
        ], 201);
    }

    public function show(Client $client)
    {
        return response()->json(
            $client->load(['user', 'coach', 'bilansPhysiques', 'bilansSanitaires', 'programmes', 'cotisations.echeances.paiement'])
        );
    }

    public function update(Request $request, Client $client)
    {
        $request->validate([
            'prenom'         => 'sometimes|string',
            'nom'            => 'sometimes|string',
            'coach_id'       => 'sometimes|exists:coaches,id',
            'telephone'      => 'nullable|string',
            'date_naissance' => 'nullable|date',
            'adresse'        => 'nullable|string',
            'statut'         => 'sometimes|in:actif,inactif,suspendu',
        ]);

        $client->update($request->only(['prenom', 'nom', 'coach_id', 'telephone', 'date_naissance', 'adresse', 'statut']));

        return response()->json([
            'message' => 'Client updated.',
            'client'  => $client->load(['user', 'coach']),
        ]);
    }

    public function destroy(Client $client)
    {
        $client->user->delete();
        $client->delete();
        return response()->json(['message' => 'Client deleted.']);
    }
}
