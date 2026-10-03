<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coach;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CoachController extends Controller
{
    public function index()
    {
        $coaches = Coach::with(['user', 'clients'])
            ->withCount('clients')
            ->get()
            ->map(function ($coach) {
                return [
                    'id'           => $coach->id,
                    'code_coach'   => $coach->code_coach,
                    'nom'          => $coach->nom,
                    'prenom'       => $coach->prenom,
                    'specialite'   => $coach->specialite,
                    'telephone'    => $coach->telephone,
                    'date_embauche' => $coach->date_embauche,
                    'bio'          => $coach->bio,
                    'email'        => $coach->user?->email,
                    'active'       => $coach->user?->active,
                    'clients_count' => $coach->clients_count,
                ];
            });

        return response()->json($coaches);
    }

    public function store(Request $request)
    {
        $request->validate([
            'prenom'       => 'required|string',
            'nom'          => 'required|string',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|min:8',
            'specialite'   => 'nullable|string',
            'telephone'    => 'nullable|string',
            'date_embauche' => 'nullable|date',
            'bio'          => 'nullable|string',
        ]);

        $lastCode = Coach::orderByDesc('id')->first()?->code_coach ?? 'COACH-000';
        $num      = intval(substr($lastCode, -3)) + 1;
        $code     = 'COACH-' . str_pad($num, 3, '0', STR_PAD_LEFT);

        $user = User::create([
            'name'     => $request->prenom . ' ' . $request->nom,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'coach',
            'active'   => true,
        ]);

        $coach = Coach::create([
            'user_id'       => $user->id,
            'code_coach'    => $code,
            'nom'           => $request->nom,
            'prenom'        => $request->prenom,
            'specialite'    => $request->specialite,
            'telephone'     => $request->telephone,
            'date_embauche' => $request->date_embauche,
            'bio'           => $request->bio,
        ]);

        return response()->json([
            'message' => 'Coach created successfully.',
            'coach'   => $coach,
        ], 201);
    }

    public function update(Request $request, Coach $coach)
    {
        $request->validate([
            'prenom'       => 'sometimes|string',
            'nom'          => 'sometimes|string',
            'specialite'   => 'nullable|string',
            'telephone'    => 'nullable|string',
            'date_embauche' => 'nullable|date',
            'bio'          => 'nullable|string',
            'active'       => 'sometimes|boolean',
        ]);

        $coach->update($request->only(['prenom', 'nom', 'specialite', 'telephone', 'date_embauche', 'bio']));

        if ($request->has('active')) {
            $coach->user->update(['active' => $request->active]);
        }

        return response()->json(['message' => 'Coach updated.', 'coach' => $coach]);
    }

    public function destroy(Coach $coach)
    {
        if ($coach->clients()->count() > 0) {
            return response()->json(['message' => 'Cannot delete a coach who has assigned clients.'], 422);
        }
        $coach->user->delete();
        $coach->delete();
        return response()->json(['message' => 'Coach deleted.']);
    }
}
