<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ressource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RessourceController extends Controller
{
    public function index(Request $request)
    {
        $query = Ressource::with('auteur');

        if ($request->search) {
            $query->where('titre', 'like', "%{$request->search}%");
        }

        if ($request->categorie) {
            $query->where('categorie', $request->categorie);
        }

        if ($request->publie !== null && $request->publie !== '') {
            $query->where('publie', (bool) $request->publie);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'titre'     => 'required|string|max:255',
            'contenu'   => 'required|string',
            'categorie' => 'required|in:sport,nutrition,recuperation,motivation',
            'publie'    => 'boolean',
        ]);

        $ressource = Ressource::create([
            'auteur_id' => auth('sanctum')->id(),
            'titre'     => $request->titre,
            'slug'      => Str::slug($request->titre) . '-' . time(),
            'contenu'   => $request->contenu,
            'categorie' => $request->categorie,
            'publie'    => $request->publie ?? false,
            'publie_at' => $request->publie ? now() : null,
        ]);

        return response()->json(['message' => 'Resource created.', 'ressource' => $ressource], 201);
    }

    public function update(Request $request, Ressource $ressource)
    {
        $request->validate([
            'titre'     => 'sometimes|string|max:255',
            'contenu'   => 'sometimes|string',
            'categorie' => 'sometimes|in:sport,nutrition,recuperation,motivation',
            'publie'    => 'sometimes|boolean',
        ]);

        if ($request->has('publie') && $request->publie && !$ressource->publie) {
            $request->merge(['publie_at' => now()]);
        }

        $ressource->update($request->only(['titre', 'contenu', 'categorie', 'publie', 'publie_at']));

        return response()->json(['message' => 'Resource updated.', 'ressource' => $ressource]);
    }

    public function destroy(Ressource $ressource)
    {
        $ressource->delete();
        return response()->json(['message' => 'Resource deleted.']);
    }
}
